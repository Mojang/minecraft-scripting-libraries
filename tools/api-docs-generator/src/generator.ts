// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';
import { ValidationError } from 'runtypes';
import semver from 'semver';

import * as log from './Logger';
import * as utils from './utilities';

import { GenerateOptions } from './Config';
import { GeneratorContext } from './Context';
import { GetLatestScriptModulesOptions, MinecraftRelease } from './MinecraftRelease';
import { ChangelogGenerator } from './changelog';
import { CommonFilters, Filter, FilterGroup } from './filters';
import { CommonModuleDataValidator, CoreVanillaDataFieldsRecord } from './modules/IMinecraftModule';
import { MinecraftAfterEventsOrderModuleRecord } from './modules/MinecraftAfterEventsOrderModule';
import { MinecraftBlockModule, MinecraftBlockModuleRecord } from './modules/MinecraftBlockModule';
import { MinecraftCommandModule, MinecraftCommandModuleRecord } from './modules/MinecraftCommandModule';
import { MinecraftEngineDataModule } from './modules/MinecraftEngineDataModules';
import { MinecraftJsonSchemaMap, MinecraftSchemaObject } from './modules/MinecraftSchemaObject';
import {
    MinecraftFunction,
    MinecraftProperty,
    MinecraftScriptCoreExports,
    MinecraftScriptModule,
    MinecraftScriptModuleRecord,
    PrivilegeValueType,
} from './modules/MinecraftScriptModule';
import { MinecraftVanillaDataModule } from './modules/MinecraftVanillaDataModules';
import { Complete, mergeOptionalArrays } from './utilities';

/**
 * Generate outputs for each initialized generator.
 */
async function generateMarkupFiles(
    context: GeneratorContext,
    filteredReleases: MinecraftRelease[],
    unfilteredReleases: MinecraftRelease[]
): Promise<void> {
    log.info(`Running Generators: [${context.getGeneratorIds().join(', ')}]`);

    fs.rmSync(context.rootOutputDirectory, { recursive: true, force: true });
    fs.mkdirSync(context.rootOutputDirectory, { recursive: true });

    for (const generator of context.getGenerators()) {
        if (generator.dependencies && !context.hasGenerators(...generator.dependencies)) {
            log.error(
                `'${generator.name}' has generator dependencies that have not been imported. Required generators: [${generator.dependencies.join(', ')}]`
            );
            continue;
        }
        if (generator.templates && !context.hasTemplates(...generator.templates)) {
            log.error(
                `'${generator.name}' is missing required templates. Required templates: [${generator.templates.join(', ')}]`
            );
            continue;
        }

        const options = context.getGeneratorOptions(generator.id);

        const releasesToCopy =
            !generator.filterGroups || generator.filterGroups.length === 0 ? unfilteredReleases : filteredReleases;
        const releasesCopy: MinecraftRelease[] = [];
        for (const release of releasesToCopy) {
            releasesCopy.push(release.copy());
        }

        const outputDirectory = path.resolve(context.rootOutputDirectory, generator.outputDirectoryName);

        log.info(`Generating output for '${generator.name}'`);
        try {
            await generator.generateFiles(context, releasesCopy, outputDirectory, options);
        } catch (e) {
            if (e instanceof Error) {
                log.error(`Generator '${generator.name}' threw an exception: ${e.message} @ ${e.stack}`);
            }
        }
    }
}

/**
 * Performs metadata schema upgrades to support backwards compatibility with metadata generated from older Minecraft releases.
 */
function upgradeScriptModuleMetadataFormat(documentationJson: MinecraftScriptModule): void {
    const upgradePropertyPrivilegeFormat = (properties?: MinecraftProperty[]) => {
        for (const prop of properties ?? []) {
            if ('privilege' in prop) {
                prop.get_privilege = [{ name: 'read_only' }];
                if (typeof prop.privilege === 'string') {
                    prop.set_privilege = [{ name: prop.privilege }];
                } else {
                    prop.set_privilege = prop.privilege as PrivilegeValueType[];
                }
                delete prop.privilege;
            }
        }
    };
    const upgradeFunctionPrivilegeFormat = (functions?: MinecraftFunction[]) => {
        for (const func of functions ?? []) {
            if ('privilege' in func) {
                if (typeof func.privilege === 'string') {
                    func.call_privilege = [{ name: func.privilege }];
                } else {
                    func.call_privilege = func.privilege as PrivilegeValueType[];
                }
                delete func.privilege;
            }
        }
    };
    for (const c of documentationJson.classes ?? []) {
        upgradePropertyPrivilegeFormat(c.properties);
        upgradeFunctionPrivilegeFormat(c.functions);
    }
    for (const e of documentationJson.errors ?? []) {
        upgradePropertyPrivilegeFormat(e.properties);
    }
    upgradeFunctionPrivilegeFormat(documentationJson.functions);

    interface DependencyLayout {
        dependencies?: { versions?: { version: string }[]; version?: string }[];
        peer_dependencies?: {
            versions?: { version: string }[];
            version?: string;
        }[];
    }

    const upgradeFormat = documentationJson as DependencyLayout;
    for (const dependency of upgradeFormat.dependencies ?? []) {
        if (dependency.version) {
            dependency.versions = [{ version: dependency.version }];
            delete dependency.version;
        }
    }

    for (const dependency of upgradeFormat.peer_dependencies ?? []) {
        if (dependency.version) {
            dependency.versions = [{ version: dependency.version }];
            delete dependency.version;
        }
    }
}

/**
 * Merges 'base' and 'parent', keeping the name and UUID of 'base' in the resulting module.
 */
function mergeScriptModule(base: MinecraftScriptModule, parent: MinecraftScriptModule): MinecraftScriptModule {
    const exports: Complete<MinecraftScriptCoreExports> = {
        classes: mergeOptionalArrays(parent.classes, base.classes),
        constants: mergeOptionalArrays(parent.constants, base.constants),
        enums: mergeOptionalArrays(parent.enums, base.enums),
        functions: mergeOptionalArrays(parent.functions, base.functions),
        errors: mergeOptionalArrays(parent.errors, base.errors),
        interfaces: mergeOptionalArrays(parent.interfaces, base.interfaces),
        objects: mergeOptionalArrays(parent.objects, base.objects),
        type_aliases: mergeOptionalArrays(parent.type_aliases, base.type_aliases),
    };

    Object.keys(exports).forEach(
        (key: keyof MinecraftScriptCoreExports) => exports[key] === undefined && delete exports[key]
    );

    return {
        ...parent,
        name: base.name,
        uuid: base.uuid,
        ...exports,
    };
}

/**
 * Merges each script module that specifies a 'parentModule' with it's parent, returning the list of all modules after merging.
 *
 * If 'includeBaseModules' is true, base modules will be generated on their own in addition to the merged modules.
 */
export function getMergedScriptModules(
    includeBaseModules: boolean,
    scriptModules: MinecraftScriptModule[]
): MinecraftScriptModule[] {
    const standardModules = new Map<string, MinecraftScriptModule>();
    const modulesToParent: MinecraftScriptModule[] = [];
    for (const module of scriptModules) {
        if (module.parentModule) {
            modulesToParent.push(module);
        } else {
            standardModules.set(`${module.name}_${module.version}_${module.minecraft_version}`, module);
        }
    }

    if (modulesToParent.length + standardModules.size < scriptModules.length) {
        throw new Error(
            'Incorrect number of modules found, missing standard modules for parenting. Please inspect metadata input.'
        );
    }

    for (const moduleToParent of modulesToParent) {
        const parentName =
            typeof moduleToParent.parentModule === 'object'
                ? moduleToParent.parentModule.name
                : moduleToParent.parentModule;
        const parentVersion =
            typeof moduleToParent.parentModule === 'object'
                ? (moduleToParent.parentModule.version ?? moduleToParent.version)
                : moduleToParent.version;

        if (!parentName) {
            throw new Error('Module to parent has no parent, this is a bug in the generator.');
        }

        const minecraftVersion = moduleToParent.minecraft_version;
        const parent = standardModules.get(`${parentName}_${parentVersion}_${minecraftVersion}`);
        if (!parent) {
            throw new Error(
                `Module '${parentName}' does not exist, cannot parent '${moduleToParent.name}'. Please inspect metadata input.`
            );
        }

        log.info(
            `Merging parent module '${parentName}@${parentVersion}' into '${moduleToParent.name}@${moduleToParent.version}'.`
        );
        const mergedModule = mergeScriptModule(moduleToParent, parent);
        mergedModule.parentModule = moduleToParent.parentModule;
        parent.base_module = {
            name: moduleToParent.name,
            version: moduleToParent.version,
        };

        if (!includeBaseModules) {
            standardModules.delete(`${parentName}_${parentVersion}_${minecraftVersion}`);
        }

        standardModules.set(
            `${mergedModule.name}_${mergedModule.version}_${mergedModule.minecraft_version}`,
            mergedModule
        );
    }

    return Array.from(standardModules.values());
}

/**
 * Adds a stub engine module if only one exists during a PR changelog generation.
 *
 * This is to ensure that the PR changelog is able to properly report full addition or full removal of engine data.
 */
function tryAddStubEngineModel(
    generatorsList: string[],
    allMinecraftReleases: { [version: string]: MinecraftRelease },
    engineModuleFiles: MinecraftEngineDataModule[]
): void {
    if (generatorsList.some(val => val === 'pr') && engineModuleFiles.length === 1) {
        const existingRelease = engineModuleFiles[0].minecraft_version;
        const otherVersions = Object.keys(allMinecraftReleases).filter(val => val !== existingRelease);

        if (otherVersions.length <= 1) {
            engineModuleFiles.push({
                ...engineModuleFiles[0],
                minecraft_version:
                    otherVersions.length === 1
                        ? otherVersions[0]
                        : engineModuleFiles[0].minecraft_version.startsWith('999')
                          ? '0.0.1'
                          : '999.999.999',
                after_events_order_by_version: [],
            });
        }
    }
}

type MinecraftReleasesByVersion = { [version: string]: MinecraftRelease };

/**
 * Loads input metadata and processes modules into MinecraftRelease objects by Minecraft version.
 */
function loadMinecraftReleases(context: GeneratorContext): MinecraftReleasesByVersion {
    const allMinecraftReleases: MinecraftReleasesByVersion = {};

    const allScriptModules: MinecraftScriptModule[] = [];
    const allCommandModules: MinecraftCommandModule[] = [];
    const allBlockModules: MinecraftBlockModule[] = [];
    const allVanillaModules: MinecraftVanillaDataModule[] = [];
    const allEngineModules: MinecraftEngineDataModule[] = [];
    const allJsonSchemas: MinecraftJsonSchemaMap = {};

    const inputFiles = utils.getFilesRecursively(context.inputDirectory);
    const parseErrors: string[] = [];

    for (const inputFilePath of inputFiles) {
        const documentationFileData = fs.readFileSync(inputFilePath).toString();
        try {
            const documentationJsonRaw = JSON.parse(documentationFileData) as Record<string, unknown>;
            if (!documentationJsonRaw) {
                log.warn(`File '${inputFilePath}' could not be parsed as JSON.`);
                continue;
            }

            if ('$schema' in documentationJsonRaw) {
                const ajv = new Ajv();
                try {
                    if (ajv.validateSchema(documentationJsonRaw)) {
                        allJsonSchemas[inputFilePath] = documentationJsonRaw as MinecraftSchemaObject;
                    } else {
                        log.warn(`Skipping invalid JSON schema: ${inputFilePath}`);
                    }
                } catch (e) {
                    if (e instanceof Error) {
                        log.error(`Failed to validate schema '${inputFilePath}': ${e.message} @ ${e.stack}`);
                    }
                }
            } else {
                const documentationJson = CommonModuleDataValidator.check(documentationJsonRaw);
                switch (documentationJson.module_type) {
                    case 'script': {
                        upgradeScriptModuleMetadataFormat(documentationJson as MinecraftScriptModule);
                        const scriptModule = MinecraftScriptModuleRecord.check(documentationJson);
                        allScriptModules.push(scriptModule);
                        break;
                    }
                    case 'commands': {
                        const commandModule = MinecraftCommandModuleRecord.check(documentationJson);
                        allCommandModules.push(commandModule);
                        break;
                    }
                    case 'vanilla_data': {
                        const vanillaDataModule = CoreVanillaDataFieldsRecord.check(documentationJson);
                        if (vanillaDataModule.vanilla_data_type === 'block') {
                            const blockModule = MinecraftBlockModuleRecord.check(vanillaDataModule);
                            allBlockModules.push(blockModule);
                        }
                        allVanillaModules.push(vanillaDataModule);
                        break;
                    }
                    case 'after_events_ordering': {
                        const afterEventsOrderModule = MinecraftAfterEventsOrderModuleRecord.check(documentationJson);
                        allEngineModules.push(afterEventsOrderModule);
                        break;
                    }
                    default: {
                        log.warn(
                            `New module type '${documentationJson.module_type as string}' found, ignoring for processing. Check whether types should be updated!`
                        );
                    }
                }
            }
        } catch (e: unknown) {
            if (e instanceof ValidationError) {
                parseErrors.push(`Failure for ${inputFilePath}: ${e.message}`);
            }
        }
    }

    if (parseErrors.length > 0) {
        throw new Error(`\nMultiple parse errors occurred:\n${parseErrors.join('\n')}`);
    }

    const scriptModulesToProcess = context.skipMerging
        ? allScriptModules
        : getMergedScriptModules(context.includeBaseModules, allScriptModules);

    for (const scriptModule of scriptModulesToProcess) {
        const moduleMinecraftVersion = scriptModule.minecraft_version;

        if (!allMinecraftReleases[moduleMinecraftVersion]) {
            allMinecraftReleases[moduleMinecraftVersion] = new MinecraftRelease(moduleMinecraftVersion);
        }

        allMinecraftReleases[moduleMinecraftVersion].script_modules.push(scriptModule);
    }

    for (const commandModule of allCommandModules) {
        const moduleMinecraftVersion = commandModule.minecraft_version;

        if (!allMinecraftReleases[moduleMinecraftVersion]) {
            allMinecraftReleases[moduleMinecraftVersion] = new MinecraftRelease(moduleMinecraftVersion);
        }

        allMinecraftReleases[moduleMinecraftVersion].command_modules.push(commandModule);
    }

    for (const blockModule of allBlockModules) {
        const moduleMinecraftVersion = blockModule.minecraft_version;

        if (!allMinecraftReleases[moduleMinecraftVersion]) {
            allMinecraftReleases[moduleMinecraftVersion] = new MinecraftRelease(moduleMinecraftVersion);
        }

        allMinecraftReleases[moduleMinecraftVersion].block_modules.push(blockModule);
    }

    for (const vanillaModule of allVanillaModules) {
        const moduleMinecraftVersion = vanillaModule.minecraft_version;

        if (!allMinecraftReleases[moduleMinecraftVersion]) {
            allMinecraftReleases[moduleMinecraftVersion] = new MinecraftRelease(moduleMinecraftVersion);
        }

        allMinecraftReleases[moduleMinecraftVersion].vanilla_data_modules.push(vanillaModule);
    }

    tryAddStubEngineModel(context.getGeneratorIds(), allMinecraftReleases, allEngineModules);
    for (const engineModule of allEngineModules) {
        const moduleMinecraftVersion = engineModule.minecraft_version;

        if (!allMinecraftReleases[moduleMinecraftVersion]) {
            allMinecraftReleases[moduleMinecraftVersion] = new MinecraftRelease(moduleMinecraftVersion);
        }

        allMinecraftReleases[moduleMinecraftVersion].engine_data_modules.push(engineModule);
    }

    const unversionedJsonSchemas: MinecraftJsonSchemaMap = {};
    for (const path in allJsonSchemas) {
        const jsonSchema = allJsonSchemas[path];
        const schemaMinecraftVersion = jsonSchema['x-minecraft-version'];
        if (!schemaMinecraftVersion) {
            unversionedJsonSchemas[path] = jsonSchema;
            continue;
        }

        if (!allMinecraftReleases[schemaMinecraftVersion]) {
            allMinecraftReleases[schemaMinecraftVersion] = new MinecraftRelease(schemaMinecraftVersion);
        }

        allMinecraftReleases[schemaMinecraftVersion].json_schemas[path] = jsonSchema;
    }

    const allMinecraftReleaseVersions = Object.keys(allMinecraftReleases);
    const earliestAvailableMinecraftVersion =
        allMinecraftReleaseVersions.length > 0
            ? allMinecraftReleaseVersions.sort((a, b) => semver.compare(a, b)).at(0)
            : '1.0.0';

    if (!allMinecraftReleases[earliestAvailableMinecraftVersion]) {
        allMinecraftReleases[earliestAvailableMinecraftVersion] = new MinecraftRelease(
            earliestAvailableMinecraftVersion
        );
    }

    for (const path in unversionedJsonSchemas) {
        const jsonSchema = unversionedJsonSchemas[path];
        allMinecraftReleases[earliestAvailableMinecraftVersion].json_schemas[path] = jsonSchema;
    }

    if (Object.keys(allMinecraftReleases).length === 0) {
        throw new Error('No input files were detected.');
    }

    return allMinecraftReleases;
}

/**
 * Marks up module versions with the minecraft release version if they are unpublished
 */
function markupReleaseVersions(context: GeneratorContext, allMinecraftReleases: MinecraftReleasesByVersion) {
    const { minecraftReleaseVersion, preexistingModuleReleases } = context;

    if (minecraftReleaseVersion) {
        for (const releaseVersion in allMinecraftReleases) {
            const currentRelease = allMinecraftReleases[releaseVersion];
            const minecraftReleaseVersionSemVer = semver.parse(minecraftReleaseVersion);

            for (const scriptModule of currentRelease.script_modules) {
                const appendMinecraftReleaseVersion = (jsonObject: { version: string }, name: string) => {
                    if (
                        preexistingModuleReleases &&
                        preexistingModuleReleases[name] &&
                        preexistingModuleReleases[name].includes(jsonObject.version)
                    ) {
                        log.info(
                            `Version already released on NPMJS, skipping version mangling for '${name}@${jsonObject.version}' in module '${scriptModule.name}@${jsonObject.version}'.`
                        );
                        return;
                    }

                    jsonObject.version = utils.appendMinecraftVersion(
                        semver.parse(jsonObject.version),
                        semver.parse(minecraftReleaseVersionSemVer)
                    );
                };

                utils.scanObjectForMembersWithNames(scriptModule, 'version', 'name', jsonObject => {
                    appendMinecraftReleaseVersion(jsonObject, jsonObject.name);
                });

                for (const dep of scriptModule.dependencies ?? []) {
                    for (const version of dep.versions) {
                        appendMinecraftReleaseVersion(version, dep.name);
                    }
                }

                for (const dep of scriptModule.peer_dependencies ?? []) {
                    if (dep.name !== '@minecraft/vanilla-data') {
                        for (const version of dep.versions) {
                            appendMinecraftReleaseVersion(version, dep.name);
                        }
                    } else if (minecraftReleaseVersionSemVer.prerelease.length > 0) {
                        const minecraftReleaseVersionStr = minecraftReleaseVersionSemVer.format();
                        if (!dep.versions.some(v => v.version === minecraftReleaseVersionStr)) {
                            dep.versions.push({
                                version: minecraftReleaseVersionStr,
                            });
                        }
                    }
                }
            }

            for (const vanillaDataModule of currentRelease.vanilla_data_modules) {
                vanillaDataModule.minecraft_version = utils.appendMinecraftVersion(
                    semver.parse(vanillaDataModule.minecraft_version),
                    semver.parse(minecraftReleaseVersionSemVer),
                    true /* onlyUsePrereleaseInfo */
                );
            }
        }
    }
}

/**
 * Filters out modules from further processing based on specified --include-modules IncludeModulesMode option.
 */
function filterIncludedModules(context: GeneratorContext, allMinecraftReleases: MinecraftRelease[]): void {
    switch (context.includeModules) {
        default:
        case 'all':
            log.debug(`Will generate all module versions.`);
            break;
        case 'latest':
            log.debug('Will generate only latest stable and pre-release module versions.');
            for (const release of allMinecraftReleases) {
                release.script_modules = release.getLatestScriptModulesByMajorVersion(
                    GetLatestScriptModulesOptions.StableAndPrerelease
                );
            }
            break;
    }
}

/**
 * Run markup filters required by specified generators which manipulate and add to module metadata.
 */
function markupFilters(context: GeneratorContext, allMinecraftReleases: MinecraftRelease[]): MinecraftRelease[] {
    const filterGroupMap = new Map<string, FilterGroup>();
    let useCommonFilters = false;

    for (const generator of context.getGenerators()) {
        if (generator.filterGroups) {
            for (const filterGroup of generator.filterGroups) {
                if (filterGroup.id === 'common') {
                    useCommonFilters = true;
                } else if (!filterGroupMap.has(filterGroup.id)) {
                    filterGroupMap.set(filterGroup.id, filterGroup);
                }
            }
        }
    }

    const shouldRunFilters = filterGroupMap.size > 0 || useCommonFilters;
    const filteredReleases: MinecraftRelease[] = [];
    if (shouldRunFilters) {
        for (const release of allMinecraftReleases) {
            filteredReleases.push(release.copy());
        }

        const runFilters = (filters?: Filter[]) => {
            if (filters) {
                for (const filter of filters) {
                    log.info(`Running filter: ${filter[0]}`);
                    try {
                        filter[1](filteredReleases, context.documentationFileLoader);
                    } catch (e) {
                        if (e instanceof Error) {
                            log.error(`Filter ${filter[0]} threw an exception: ${e.message} @ ${e.stack}`);
                        }
                    }
                }
            }
        };

        const filterGroupsToRun = Array.from(filterGroupMap.values());
        for (const filterGroup of filterGroupsToRun) {
            runFilters(filterGroup.filtersBeforeCommon);
        }
        if (useCommonFilters) {
            runFilters(CommonFilters.filters);
        }
        for (const filterGroup of filterGroupsToRun) {
            runFilters(filterGroup.filters);
        }
    }

    return shouldRunFilters ? filteredReleases : allMinecraftReleases;
}

/**
 * Main logic of the Minecraft API Docs Generator.
 *
 * Processes API module JSON metadata files, transforming them with filter functions,
 * and renders them into output files with configured markup generators.
 */
export async function generate(options: GenerateOptions) {
    const context = await GeneratorContext.Init(options);

    const allMinecraftReleases = loadMinecraftReleases(context);

    if (context.minecraftReleaseVersion) {
        markupReleaseVersions(context, allMinecraftReleases);
    }

    const sortedMinecraftReleases = Object.values(allMinecraftReleases).sort(
        utils.reverseSemVerSortComparer('minecraft_version')
    );

    filterIncludedModules(context, sortedMinecraftReleases);

    if (context.changelogStrategy.shouldGenerateChangelogs(sortedMinecraftReleases)) {
        const changelogGenerator = new ChangelogGenerator(context.changelogStrategy);
        changelogGenerator.generateChangelogs(sortedMinecraftReleases);
    }

    const filteredMinecraftReleases = markupFilters(context, sortedMinecraftReleases);

    await generateMarkupFiles(context, filteredMinecraftReleases, sortedMinecraftReleases);

    context.shutdown();
}
