// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { cosmiconfig } from 'cosmiconfig';
import path from 'path';
import resolveFrom from 'resolve-from';
import toposort from 'toposort';

import { ChangelogStrategy, CoreChangelogStrategies } from './ChangelogStrategy';
import {
    checkConfig,
    Config,
    CONFIG_NAME,
    ConfigOptions,
    findConfig,
    GenerateOptions,
    IncludeModulesMode,
    PluginOptions,
} from './Config';
import { FileLoader } from './FileLoader';
import * as log from './Logger';
import { MarkupGenerator, MarkupGeneratorOptions, Plugin } from './plugins';

/**
 * Markup generators ran by default when none are specified
 */
const DefaultGenerators = ['ts', 'ts-source', 'changelog', 'npm', 'typedoc', 'msdocs'];

/**
 * Parse CLI options and merge with the loaded config if it exists
 */
async function parseConfig(generateOptions: GenerateOptions): Promise<ConfigOptions> {
    let configFile;

    if (!generateOptions.ignoreConfig) {
        if (generateOptions.configPath) {
            configFile = await cosmiconfig(CONFIG_NAME).load(generateOptions.configPath);
            if (!configFile) {
                log.warn(
                    `Could not load config file from '${generateOptions.configPath}', will search for one instead.`
                );
            }
        }
        if (!configFile) {
            configFile = await findConfig();
            if (configFile) {
                generateOptions.configPath = configFile.filepath;
            }
        }
    }

    const parsedConfig = configFile ? checkConfig(configFile.config as Config) : {};
    const parsedOptions = Object.fromEntries(Object.entries(generateOptions).filter(([, v]) => v));

    return {
        ...parsedConfig,
        ...parsedOptions,
    };
}

function initGenerators(generatorsToInit: MarkupGenerator[], allGenerators: Map<string, MarkupGenerator>): string[] {
    const ids: string[] = [];
    for (const generator of generatorsToInit) {
        if (!allGenerators.has(generator.id)) {
            allGenerators.set(generator.id, generator);
            ids.push(generator.id);
        } else {
            log.warn(`Multiple generators with identical ID '${generator.id}' present. Ignoring duplicate.`);
        }
    }
    return ids;
}

function initTemplates(templatesToInit: Record<string, string>, allTemplates: Map<string, FileLoader>): string[] {
    const ids: string[] = [];
    for (const id in templatesToInit) {
        if (!allTemplates.has(id)) {
            const fileLoader = new FileLoader(templatesToInit[id]);
            if (!fileLoader.loaded()) {
                log.warn(`No template files were loaded from directory: ${templatesToInit[id]}`);
                continue;
            }
            allTemplates.set(id, fileLoader);
            ids.push(id);
        } else {
            log.warn(`Multiple templates with identical ID '${id}' present. Ignoring duplicates.`);
        }
    }
    return ids;
}

function initStrategies(
    strategiesToInit: Record<string, ChangelogStrategy>,
    allStrategies: Map<string, ChangelogStrategy>
): string[] {
    const ids: string[] = [];
    for (const id in strategiesToInit) {
        if (!allStrategies.has(id)) {
            allStrategies.set(id, strategiesToInit[id]);
            ids.push(id);
        } else {
            log.warn(`Multiple changelog strategies with identical ID '${id}' present. Ignoring duplicates.`);
        }
    }
    return ids;
}

type MarkupGeneratorAndOptions = [generator: MarkupGenerator, options: MarkupGeneratorOptions];
type MarkupGeneratorMap = Map<string, MarkupGeneratorAndOptions>;
type InitializedPluginsData = {
    generators: MarkupGeneratorMap;
    templates: Map<string, FileLoader>;
    changelogStrategy: ChangelogStrategy;
};

/**
 * Initialize markup generators imported from plugin modules
 */
async function initPlugins(config: ConfigOptions): Promise<InitializedPluginsData> {
    const allGenerators = new Map<string, MarkupGenerator>();
    const allTemplates = new Map<string, FileLoader>();
    const allStrategies = new Map<string, ChangelogStrategy>(CoreChangelogStrategies);

    if (config.plugins && config.plugins.length === 0) {
        throw new Error('No plugins defined in config, must specify at least one plugin to import generators from.');
    } else if (!config.plugins) {
        log.debug(`No plugins specified, adding '@minecraft/markup-generators-plugin'.`);
        config.plugins = ['@minecraft/markup-generators-plugin'];
    }

    if (config.plugins) {
        for (const plugin of config.plugins) {
            let pluginName: string | undefined;
            let pluginConfig: PluginOptions = {};

            if (typeof plugin === 'string') {
                pluginName = plugin;
            } else if (Array.isArray(plugin)) {
                if (plugin.length <= 2) {
                    if (plugin.length >= 1 && typeof plugin[0] === 'string') {
                        pluginName = plugin[0];
                    }
                    if (plugin.length === 2 && typeof plugin[1] === 'object') {
                        pluginConfig = plugin[1];
                    }
                } else {
                    throw new Error(
                        `Plugin config should be a tuple, but has ${plugin.length} values. Expected format: ['plugin-name', { setting: true }]`
                    );
                }
            }

            if (!pluginName) {
                throw new Error(
                    `Incorrectly formatted plugin config in '${config.configPath}'. Expected format: ['plugin-name', { setting: true }]`
                );
            }

            let importPath = pluginName;
            if (pluginConfig.path) {
                const relativeStart = config.configPath ? path.dirname(config.configPath) : process.cwd();
                importPath = resolveFrom(relativeStart, pluginConfig.path);
            }

            log.info(`Importing plugin: '${importPath}'`);
            try {
                const { default: pluginModule } = (await import(importPath)) as { default: Plugin };
                const generatorIds = initGenerators(pluginModule.generators ?? [], allGenerators);
                const templateIds = initTemplates(pluginModule.templates ?? {}, allTemplates);
                const strategyIds = initStrategies(pluginModule.changelogStrategies ?? {}, allStrategies);

                if (generatorIds.length > 0) {
                    log.info(`Imported generators: [${generatorIds.join(', ')}]`);
                }
                if (templateIds.length > 0) {
                    log.info(`Imported templates: [${templateIds.join(', ')}]`);
                }
                if (strategyIds.length > 0) {
                    log.info(`Imported changelog strategies: [${strategyIds.join(', ')}]`);
                }
                if (generatorIds.length === 0 && templateIds.length === 0 && strategyIds.length === 0) {
                    log.warn('Plugin has nothing to import!');
                }
            } catch (e) {
                if (e instanceof Error) {
                    log.error(`Could not import plugin module '${importPath}'.`);
                    throw e;
                }
            }
        }
    }

    let changelogStrategy: ChangelogStrategy | undefined;
    if (config.changelogStrategy) {
        if (allStrategies.has(config.changelogStrategy)) {
            changelogStrategy = allStrategies.get(config.changelogStrategy);
        } else {
            log.warn(`Changelog Strategy '${config.changelogStrategy}' is invalid, will default to 'module_version'.`);
        }
    }
    if (!changelogStrategy) {
        changelogStrategy = allStrategies.get('module_version');
    }

    const generatorsToRun = new Map<string, MarkupGenerator>();

    const initGeneratorRecursive = (generatorId: string) => {
        let generator = generatorsToRun.get(generatorId);
        if (!generator) {
            if (allGenerators.has(generatorId)) {
                generator = allGenerators.get(generatorId);
            } else {
                throw new Error(
                    `Attempted to run generator '${generatorId}' but it has not been imported from a plugin module.\n
                    Verify that all required plugins are included in config.`
                );
            }

            generatorsToRun.set(generatorId, generator);

            if (generator.dependencies) {
                for (const dependencyId of generator.dependencies) {
                    initGeneratorRecursive(dependencyId);
                }
            }
        }
    };

    for (const generatorId of config.generatorsToRun ?? DefaultGenerators) {
        initGeneratorRecursive(generatorId);
    }

    const generatorDependencyEdges: [string, string][] = [];
    for (const generator of generatorsToRun.values()) {
        if (generator.dependencies) {
            for (const depId of generator.dependencies) {
                generatorDependencyEdges.push([depId, generator.id]);
            }
        }
    }

    const sortedGeneratorIds = toposort.array(Array.from(generatorsToRun.keys()), generatorDependencyEdges);
    const sortedGeneratorMap: MarkupGeneratorMap = new Map(
        sortedGeneratorIds.map(id => {
            const generator = generatorsToRun.get(id);
            return [
                id,
                [
                    generator,
                    {
                        ...generator.defaultOptions,
                        ...config.generators?.[id],
                    },
                ],
            ];
        })
    );

    return {
        generators: sortedGeneratorMap,
        templates: allTemplates,
        changelogStrategy,
    };
}

export class GeneratorContext {
    private readonly config: ConfigOptions;

    readonly changelogStrategy: ChangelogStrategy;

    readonly inputDirectory: string;
    readonly rootOutputDirectory: string;

    readonly documentationFileLoader: FileLoader | undefined;

    private readonly generators: MarkupGeneratorMap;
    private readonly templates: Map<string, FileLoader>;

    private constructor(
        config: ConfigOptions,
        generators: MarkupGeneratorMap,
        templates: Map<string, FileLoader>,
        changelogStrategy: ChangelogStrategy
    ) {
        this.config = { ...config };
        this.generators = generators;
        this.templates = templates;
        this.changelogStrategy = changelogStrategy;

        this.inputDirectory = path.resolve(config.inputDirectory);
        this.rootOutputDirectory = path.resolve(config.outputDirectory);

        if (config.documentationDirectory) {
            const docsPath = path.resolve(config.documentationDirectory);
            const loader = new FileLoader(docsPath, ['.json', '.js', '.ts']);
            if (loader.loaded()) {
                this.documentationFileLoader = loader;
            } else {
                log.warn(`No documentation files were loaded from directory: ${docsPath}`);
            }
        }
    }

    static async Init(cliOptions: GenerateOptions): Promise<GeneratorContext> {
        const config = await parseConfig(cliOptions);

        log.setLogOptions(config.log);

        if (config.configPath) {
            log.info(`Loaded config file: ${config.configPath}`);
        }

        const { generators, templates, changelogStrategy } = await initPlugins(config);
        return new GeneratorContext(config, generators, templates, changelogStrategy);
    }

    get minecraftReleaseVersion(): string | undefined {
        return this.config.minecraftReleaseVersion;
    }

    get preexistingModuleReleases(): Record<string, string[]> | undefined {
        return this.config.preexistingModuleReleases;
    }

    get includeModules(): IncludeModulesMode {
        return this.config.includeModulesMode ?? 'all';
    }

    get includeBaseModules(): boolean {
        return this.config.includeBaseModules ?? false;
    }

    get skipMerging(): boolean {
        return this.config.skipMerging ?? false;
    }

    getGenerator(generatorId: string): MarkupGenerator {
        return this.generators.get(generatorId)[0];
    }

    getGeneratorOptions(generatorId: string): MarkupGeneratorOptions {
        return this.generators.get(generatorId)[1];
    }

    getGenerators(): Iterable<MarkupGenerator> {
        return Array.from(this.generators.values()).map(g => g[0]);
    }

    getGeneratorIds(): string[] {
        return Array.from(this.generators.keys());
    }

    hasGenerators(...generatorIds: string[]): boolean {
        return generatorIds.every(id => this.generators.has(id));
    }

    getTemplates(...templateIds: string[]): Record<string, FileLoader> {
        return Object.fromEntries(Array.from(this.templates.entries()).filter(([id]) => templateIds.includes(id)));
    }

    hasTemplates(...templateIds: string[]): boolean {
        return templateIds.every(id => this.templates.has(id));
    }

    shutdown(): void {
        this.documentationFileLoader?.logUnusedFiles();
        for (const id in this.templates) {
            this.templates.get(id).logUnusedFiles();
        }
    }
}
