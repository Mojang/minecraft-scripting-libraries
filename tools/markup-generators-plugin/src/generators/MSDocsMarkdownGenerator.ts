// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import mustache from 'mustache';
import path from 'path';
import * as semver from 'semver';

import {
    CommonFilters,
    FileLoader,
    FilterGroup,
    GeneratorContext,
    Logger,
    MarkdownFilters,
    MarkupGenerator,
    MinecraftBlock,
    MinecraftBlockProperty,
    MinecraftClass,
    MinecraftCommand,
    MinecraftCommandEnum,
    MinecraftCommandModule,
    MinecraftEnum,
    MinecraftFunction,
    MinecraftModuleDescription,
    MinecraftRelease,
    MinecraftScriptModule,
    MinecraftTypeAlias,
    moduleHasChangelog,
    TypeScriptFilters,
    Utils,
} from '@minecraft/api-docs-generator';

export const MSDocsFilters: FilterGroup = {
    id: 'msdoc',
    filters: [
        ['add_headers_to_prior_docs', addHeaderToPrior],
        ['add_changed_stable_apis', checkForChangedStableAPIs],
    ],
};

function addHeaderToPrior(releases: MinecraftRelease[]) {
    if (releases.length !== 1) {
        Logger.assert(false, 'There should only be one release for MSDocs.');
        return;
    }

    const markPrior = (
        c: {
            from_module?: MinecraftModuleDescription;
            show_prior_warning?: boolean;
            prior_link?: string;
            deprecated_version?: string;
            name: string;
        },
        isModule?: boolean
    ) => {
        if (!c.from_module.prior_version) {
            return;
        }

        c.show_prior_warning = true;
        if (c.deprecated_version === undefined) {
            if (isModule) {
                c.prior_link = `../../../scriptapi/${
                    c.from_module.bookmark_name.startsWith('minecraft-')
                        ? `minecraft/${c.from_module.bookmark_name.substring(10)}`
                        : c.from_module.bookmark_name
                }/${c.from_module.bookmark_name}.md`;
            } else {
                c.prior_link = `../../../scriptapi/${
                    c.from_module.bookmark_name.startsWith('minecraft-')
                        ? `minecraft/${c.from_module.bookmark_name.substring(10)}`
                        : c.from_module.bookmark_name
                }/${c.name}.md`;
            }
        }
    };

    const release = releases[0];
    for (const scriptModule of release.script_modules) {
        markPrior(scriptModule, true);

        for (const arr of [
            scriptModule.classes,
            scriptModule.interfaces,
            scriptModule.enums,
            scriptModule.type_aliases,
        ]) {
            for (const c of arr) {
                markPrior(c);
            }
        }
    }
}

function getLatestBeta(scriptModules: MinecraftScriptModule[], uuid: string): MinecraftScriptModule | undefined {
    const betas = scriptModules.filter(
        module => module.uuid === uuid && semver.prerelease(module.version)?.some(prerelease => prerelease === 'beta')
    );
    if (betas.length > 1) {
        Logger.warn(`Unexpected amount of betas for ${uuid}`);
        return undefined;
    }
    return betas.length === 1 ? betas[0] : undefined;
}

function getLatestStable(
    scriptModules: MinecraftScriptModule[],
    uuid: string,
    majorVersion: number
): MinecraftScriptModule | undefined {
    let latestStable: MinecraftScriptModule | undefined;
    for (const module of scriptModules) {
        if (module.uuid !== uuid) {
            continue;
        }
        const moduleVersion = semver.parse(module.version);
        if (moduleVersion.major !== majorVersion) {
            continue;
        }
        if (
            moduleVersion.prerelease &&
            moduleVersion.prerelease.some(pr => pr === 'beta' || pr === 'alpha' || pr === 'internal')
        ) {
            continue;
        }
        if (!latestStable || moduleVersion.minor > semver.minor(latestStable.version)) {
            latestStable = module;
        }
    }
    return latestStable;
}

function checkForChangedStableAPIs(releases: MinecraftRelease[]) {
    if (releases.length !== 1) {
        Logger.assert(false, 'There should only be one release for MSDocs.');
        return;
    }

    const release = releases[0];

    const moduleUUIDs = [...new Set(release.script_modules.map(m => m.uuid))];
    for (const uuid of moduleUUIDs) {
        const latestBeta = getLatestBeta(release.script_modules, uuid);
        if (!latestBeta) {
            continue;
        }
        const latestStable = getLatestStable(release.script_modules, uuid, semver.major(latestBeta.version));
        if (!latestStable) {
            continue;
        }

        const compareFunctionLists = (betaFuncs: MinecraftFunction[], stableFuncs: MinecraftFunction[]): void => {
            const newBetaFuncs = [];
            for (const betaFunc of betaFuncs ?? []) {
                for (const stableFunc of stableFuncs ?? []) {
                    if (betaFunc.name === stableFunc.name) {
                        if (
                            betaFunc.arguments.length !== stableFunc.arguments.length ||
                            betaFunc.return_type.name !== stableFunc.return_type.name
                        ) {
                            betaFunc.is_prerelease = true;
                            stableFunc.stable_only = true;
                            newBetaFuncs.push(stableFunc);
                        }
                        continue;
                    }
                }
            }
            for (const newBetaFunc of newBetaFuncs) {
                betaFuncs.push(newBetaFunc);
            }
        };

        compareFunctionLists(latestBeta.functions, latestStable.functions);

        for (const betaFunc of latestBeta.classes ?? []) {
            for (const stableFunc of latestStable.classes ?? []) {
                if (betaFunc.class_name === stableFunc.class_name) {
                    compareFunctionLists(betaFunc.functions, stableFunc.functions);
                    continue;
                }
            }
        }
    }
}

type TypeScriptMustacheConfig = {
    display_constructor_as_instantiation?: boolean;
    disable_export_keyword?: boolean;
};

type WithTypeScriptMustacheConfig<T> = T & {
    mustache_config?: TypeScriptMustacheConfig;
};

const MUSTACHE_CONFIG: TypeScriptMustacheConfig = {
    display_constructor_as_instantiation: true,
    disable_export_keyword: true,
};

export class MSDocsMarkdownGenerator implements MarkupGenerator {
    private generateScriptClassFiles(
        classJson: WithTypeScriptMustacheConfig<MinecraftClass>,
        mdTemplateFiles: FileLoader,
        tsTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('script/class.mustache');

        classJson.mustache_config = MUSTACHE_CONFIG;

        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, classJson, {
            // MSDocs Partials
            type_with_links: mdTemplateFiles.readFileAsString('script/type_with_links.mustache'),
            function: mdTemplateFiles.readFileAsString('script/function.mustache'),
            examples: mdTemplateFiles.readFileAsString('script/examples.mustache'),
            value: mdTemplateFiles.readFileAsString('script/value.mustache'),
            property: mdTemplateFiles.readFileAsString('script/property.mustache'),
            property_declaration: mdTemplateFiles.readFileAsString('script/property_declaration.mustache'),
            default_metadata: mdTemplateFiles.readFileAsString('script/default_metadata.mustache'),

            // TypeScript Partials
            function_declaration: tsTemplateFiles.readFileAsString('function_declaration.mustache'),
            function_argument_declaration: tsTemplateFiles.readFileAsString('function_argument_declaration.mustache'),
            type: tsTemplateFiles.readFileAsString('type.mustache'),
        });
        const msdocsClassFilePath = path.join(outputDirectory, `${classJson.name}.md`);
        fs.mkdirSync(path.dirname(msdocsClassFilePath), { recursive: true });
        fs.writeFileSync(msdocsClassFilePath, msdocsProcessedData);
    }

    private generateScriptEnumFiles(
        enumJson: WithTypeScriptMustacheConfig<MinecraftEnum>,
        mdTemplateFiles: FileLoader,
        tsTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('script/enum.mustache');

        enumJson.mustache_config = MUSTACHE_CONFIG;

        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, enumJson, {
            // MSDocs Partials
            type_with_links: mdTemplateFiles.readFileAsString('script/type_with_links.mustache'),
            function: mdTemplateFiles.readFileAsString('script/function.mustache'),
            value: mdTemplateFiles.readFileAsString('script/value.mustache'),
            property: mdTemplateFiles.readFileAsString('script/property.mustache'),
            property_declaration: mdTemplateFiles.readFileAsString('script/property_declaration.mustache'),
            default_metadata: mdTemplateFiles.readFileAsString('script/default_metadata.mustache'),

            // TypeScript Partials
            function_declaration: tsTemplateFiles.readFileAsString('function_declaration.mustache'),
            function_argument_declaration: tsTemplateFiles.readFileAsString('function_argument_declaration.mustache'),
            type: tsTemplateFiles.readFileAsString('type.mustache'),
        });
        const msdocsClassFilePath = path.join(outputDirectory, `${enumJson.name}.md`);
        fs.mkdirSync(path.dirname(msdocsClassFilePath), { recursive: true });
        fs.writeFileSync(msdocsClassFilePath, msdocsProcessedData);
    }

    private generateScriptTypeAliasFiles(
        typeAliasJson: WithTypeScriptMustacheConfig<MinecraftTypeAlias>,
        mdTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('script/type_alias.mustache');

        typeAliasJson.mustache_config = MUSTACHE_CONFIG;

        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, typeAliasJson, {
            examples: mdTemplateFiles.readFileAsString('script/examples.mustache'),
            default_metadata: mdTemplateFiles.readFileAsString('script/default_metadata.mustache'),
        });
        const msdocsClassFilePath = path.join(outputDirectory, `${typeAliasJson.name}.md`);
        fs.mkdirSync(path.dirname(msdocsClassFilePath), { recursive: true });
        fs.writeFileSync(msdocsClassFilePath, msdocsProcessedData);
    }

    private generateScriptModuleFile(
        moduleJson: WithTypeScriptMustacheConfig<MinecraftScriptModule>,
        mdTemplateFiles: FileLoader,
        tsTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('script/module.mustache');

        moduleJson.mustache_config = MUSTACHE_CONFIG;

        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, moduleJson, {
            // MSDocs Partials
            type_with_links: mdTemplateFiles.readFileAsString('script/type_with_links.mustache'),
            class: mdTemplateFiles.readFileAsString('script/class.mustache'),
            function: mdTemplateFiles.readFileAsString('script/function.mustache'),
            examples: mdTemplateFiles.readFileAsString('script/examples.mustache'),
            value: mdTemplateFiles.readFileAsString('script/value.mustache'),
            property: mdTemplateFiles.readFileAsString('script/property.mustache'),
            property_declaration: mdTemplateFiles.readFileAsString('script/property_declaration.mustache'),
            default_metadata: mdTemplateFiles.readFileAsString('script/default_metadata.mustache'),

            // TypeScript Partials
            function_declaration: tsTemplateFiles.readFileAsString('function_declaration.mustache'),
            function_argument_declaration: tsTemplateFiles.readFileAsString('function_argument_declaration.mustache'),
            type: tsTemplateFiles.readFileAsString('type.mustache'),
        });
        const msdocsModuleFilePath = path.join(outputDirectory, `${moduleJson.bookmark_name}.md`);
        fs.mkdirSync(path.dirname(msdocsModuleFilePath), { recursive: true });
        fs.writeFileSync(msdocsModuleFilePath, msdocsProcessedData);
    }

    private generateScriptModuleChangelogFile(
        moduleJson: WithTypeScriptMustacheConfig<MinecraftScriptModule>,
        mdTemplateFiles: FileLoader,
        tsTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('script/module_changelog.mustache');
        moduleJson.mustache_config = MUSTACHE_CONFIG;

        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, moduleJson, {
            // MSDocs Partials
            type_with_links: mdTemplateFiles.readFileAsString('script/type_with_links.mustache'),
            class: mdTemplateFiles.readFileAsString('script/class.mustache'),
            function: mdTemplateFiles.readFileAsString('script/function.mustache'),
            examples: mdTemplateFiles.readFileAsString('script/examples.mustache'),
            value: mdTemplateFiles.readFileAsString('script/value.mustache'),
            property: mdTemplateFiles.readFileAsString('script/property.mustache'),
            property_declaration: mdTemplateFiles.readFileAsString('script/property_declaration.mustache'),
            default_metadata: mdTemplateFiles.readFileAsString('script/default_metadata.mustache'),

            // TypeScript Partials
            function_declaration: tsTemplateFiles.readFileAsString('function_declaration.mustache'),
            function_argument_declaration: tsTemplateFiles.readFileAsString('function_argument_declaration.mustache'),
            type: tsTemplateFiles.readFileAsString('type.mustache'),
        });
        const msdocChangelogFilePath = path.join(outputDirectory, 'changelog.md');
        fs.mkdirSync(path.dirname(msdocChangelogFilePath), { recursive: true });
        fs.writeFileSync(msdocChangelogFilePath, msdocsProcessedData);
    }

    getSortedModules(release: MinecraftRelease): { latest: MinecraftScriptModule[]; prior: MinecraftScriptModule[] } {
        const latest = release.getLatestScriptModules().sort(Utils.nameSortComparer);
        const prior = release
            .getLatestScriptModulesByMajorVersion()
            .filter(module => !latest.includes(module))
            .sort((e1, e2) => {
                const nameSort = Utils.nameSortComparer(e1, e2);
                if (nameSort === 0) {
                    return semver.compare(e2.version, e1.version);
                }
                return nameSort;
            });
        return {
            latest,
            prior,
        };
    }

    private generateScriptTableOfContents(
        release: MinecraftRelease,
        mdTemplateFiles: FileLoader,
        msdocsDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('script/toc.mustache');

        const createTOC = (pathString: string, modules: MinecraftScriptModule[]) => {
            const msdocsProcessedData = mustache.render(msdocsTemplateFileData, {
                script_modules: modules,
            });
            fs.mkdirSync(path.dirname(pathString), { recursive: true });
            fs.writeFileSync(pathString, msdocsProcessedData);
        };

        const modules = this.getSortedModules(release);
        createTOC(path.join(msdocsDirectory, 'scriptapi', `TOC.yml`), modules.latest);
        if (modules.prior.length !== 0) {
            createTOC(path.join(msdocsDirectory, 'priorscriptapi', `TOC.yml`), modules.prior);
        }
    }

    private generateCommandFiles(
        commandJson: MinecraftCommand,
        mdTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('commands/command.mustache');
        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, commandJson, {
            overload: mdTemplateFiles.readFileAsString('commands/overload.mustache'),
            parameter: mdTemplateFiles.readFileAsString('commands/parameter.mustache'),
            inline_enum: mdTemplateFiles.readFileAsString('commands/inline_enum.mustache'),
            default_metadata: mdTemplateFiles.readFileAsString('commands/default_metadata.mustache'),
        });
        const msdocsCommandFilePath = path.join(outputDirectory, 'commands', `${commandJson.name}.md`);
        fs.mkdirSync(path.dirname(msdocsCommandFilePath), { recursive: true });
        fs.writeFileSync(msdocsCommandFilePath, msdocsProcessedData);
    }

    private generateCommandEnumFiles(
        enumJson: MinecraftCommandEnum,
        mdTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('commands/enum.mustache');
        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, enumJson, {
            default_metadata: mdTemplateFiles.readFileAsString('commands/default_metadata.mustache'),
        });
        const msdocsEnumFilePath = path.join(outputDirectory, 'enums', `${enumJson.name}.md`);
        fs.mkdirSync(path.dirname(msdocsEnumFilePath), { recursive: true });
        fs.writeFileSync(msdocsEnumFilePath, msdocsProcessedData);
    }

    private generateCommandsTableOfContents(
        commandsJson: MinecraftCommand[],
        mdTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('commands/toc.mustache');
        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, {
            commands: commandsJson,
        });
        const msdocsModuleFilePath = path.join(outputDirectory, `TOC.yml`);
        fs.mkdirSync(path.dirname(msdocsModuleFilePath), { recursive: true });
        fs.writeFileSync(msdocsModuleFilePath, msdocsProcessedData);
    }

    private generateCommandsSummaryFile(
        moduleJson: MinecraftCommandModule,
        mdTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const summaryTemplateFileData = mdTemplateFiles.readFileAsString('commands/summary.mustache');
        const summaryProcessedData = mustache.render(
            summaryTemplateFileData,
            {
                commands: moduleJson.commands,
                command_enums: moduleJson.command_enums,
                command_types: moduleJson.command_types,
            },
            {
                default_metadata: mdTemplateFiles.readFileAsString('commands/default_metadata.mustache'),
            }
        );
        const summaryOutputFilePath = path.join(outputDirectory, `commands.md`);
        fs.mkdirSync(path.dirname(summaryOutputFilePath), { recursive: true });
        fs.writeFileSync(summaryOutputFilePath, summaryProcessedData);
    }

    private generateBlockFiles(blockJson: MinecraftBlock, mdTemplateFiles: FileLoader, outputDirectory: string): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('blocks/block.mustache');
        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, blockJson, {
            default_metadata: mdTemplateFiles.readFileAsString('blocks/default_metadata.mustache'),
        });
        const msdocsBlockFilePath = path.join(outputDirectory, 'blocks', `${blockJson.name}.md`);
        fs.mkdirSync(path.dirname(msdocsBlockFilePath), { recursive: true });
        fs.writeFileSync(msdocsBlockFilePath, msdocsProcessedData);
    }

    private generateBlockPropertyFiles(
        blockPropertyJson: MinecraftBlockProperty,
        mdTemplateFiles: FileLoader,
        outputDirectory: string
    ): void {
        const msdocsTemplateFileData = mdTemplateFiles.readFileAsString('blocks/block_property.mustache');
        const msdocsProcessedData = mustache.render(msdocsTemplateFileData, blockPropertyJson, {
            default_metadata: mdTemplateFiles.readFileAsString('blocks/default_metadata.mustache'),
        });

        const msdocsBlockPropertyFilePath = path.join(
            outputDirectory,
            'block_properties',
            `${blockPropertyJson.name}.md`
        );
        fs.mkdirSync(path.dirname(msdocsBlockPropertyFilePath), { recursive: true });
        fs.writeFileSync(msdocsBlockPropertyFilePath, msdocsProcessedData);
    }

    generateFiles(context: GeneratorContext, releases: MinecraftRelease[], outputDirectory: string): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }

        Logger.info(`Running filter group: ${MSDocsFilters.id}`);
        for (const filter of MSDocsFilters.filters) {
            Logger.info(`Running filter: ${filter[0]}`);
            try {
                filter[1](releases);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    Logger.error(`Filter ${filter[0]} threw an exception: ${e.message} @ ${e.stack}`);
                }
            }
        }

        const { msdocs: mdTemplateFiles, tsdef: tsTemplateFiles } = context.getTemplates(...this.templates);

        const commandsMSDocsOutputPath = path.join(outputDirectory, 'commands');
        const blocksMSDocsOutputPath = path.join(outputDirectory, 'blocks');

        ///
        // Script
        ///
        const modules = releases[0].getLatestScriptModulesByMajorVersion();

        for (const moduleJson of modules) {
            const scriptModuleOutputFolder = path.join(
                outputDirectory,
                moduleJson.from_module.folder_path,
                moduleJson.from_module.filepath_name
            );

            this.generateScriptModuleFile(moduleJson, mdTemplateFiles, tsTemplateFiles, scriptModuleOutputFolder);

            if (
                moduleHasChangelog(moduleJson) &&
                moduleJson.changelog.length > 0 &&
                moduleJson.display_changelog_in_toc
            ) {
                this.generateScriptModuleChangelogFile(
                    moduleJson,
                    mdTemplateFiles,
                    tsTemplateFiles,
                    scriptModuleOutputFolder
                );
            }

            for (const classJson of moduleJson.classes ?? []) {
                this.generateScriptClassFiles(classJson, mdTemplateFiles, tsTemplateFiles, scriptModuleOutputFolder);
            }

            for (const interfaceJson of moduleJson.interfaces ?? []) {
                this.generateScriptClassFiles(
                    interfaceJson,
                    mdTemplateFiles,
                    tsTemplateFiles,
                    scriptModuleOutputFolder
                );
            }

            for (const errorJson of moduleJson.errors ?? []) {
                this.generateScriptClassFiles(errorJson, mdTemplateFiles, tsTemplateFiles, scriptModuleOutputFolder);
            }

            for (const enumJson of moduleJson.enums ?? []) {
                this.generateScriptEnumFiles(enumJson, mdTemplateFiles, tsTemplateFiles, scriptModuleOutputFolder);
            }

            for (const typeAliasJson of moduleJson.type_aliases ?? []) {
                this.generateScriptTypeAliasFiles(typeAliasJson, mdTemplateFiles, scriptModuleOutputFolder);
            }
        }

        this.generateScriptTableOfContents(releases[0], mdTemplateFiles, outputDirectory);

        ///
        // Commands
        ///
        if (releases[0].command_modules.length > 0) {
            const moduleJson = releases[0].command_modules[0];

            for (const commandJson of moduleJson.commands ?? []) {
                this.generateCommandFiles(commandJson, mdTemplateFiles, commandsMSDocsOutputPath);
            }

            for (const enumJson of moduleJson.command_enums ?? []) {
                this.generateCommandEnumFiles(enumJson, mdTemplateFiles, commandsMSDocsOutputPath);
            }

            this.generateCommandsSummaryFile(moduleJson, mdTemplateFiles, commandsMSDocsOutputPath);

            this.generateCommandsTableOfContents(moduleJson.commands, mdTemplateFiles, commandsMSDocsOutputPath);
        }

        ///
        // Blocks
        ///
        if (releases[0].block_modules.length > 0) {
            const moduleJson = releases[0].block_modules[0];

            for (const dataItemsJson of moduleJson.data_items ?? []) {
                this.generateBlockFiles(dataItemsJson, mdTemplateFiles, blocksMSDocsOutputPath);
            }

            for (const blockPropertyJson of moduleJson.block_properties ?? []) {
                this.generateBlockPropertyFiles(blockPropertyJson, mdTemplateFiles, blocksMSDocsOutputPath);
            }
        }

        return Promise.resolve();
    }

    readonly id: string = 'msdocs';
    readonly name: string = 'MS Docs';
    readonly outputDirectoryName: string = 'msdocs';

    readonly templates: string[] = ['msdocs', 'tsdef'];
    readonly filterGroups: FilterGroup[] = [CommonFilters, MarkdownFilters, TypeScriptFilters];
}
