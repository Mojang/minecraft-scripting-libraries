// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import semver from 'semver';

import { IMinecraftModule, RuntimeDataModule } from './modules/IMinecraftModule';
import { MinecraftBlockModule } from './modules/MinecraftBlockModule';
import { MinecraftCommandModule } from './modules/MinecraftCommandModule';
import { MinecraftEngineDataModule } from './modules/MinecraftEngineDataModules';
import { MinecraftScriptModule } from './modules/MinecraftScriptModule';
import { MinecraftVanillaDataModule } from './modules/MinecraftVanillaDataModules';
import * as utils from './utilities';
import { MinecraftJsonSchemaMap } from './modules/MinecraftSchemaObject';

export enum GetLatestScriptModulesOptions {
    OnlyStable,
    OnlyPrerelease,
    StableAndPrerelease,
}

export function getLatestScriptModules(
    modules: MinecraftScriptModule[],
    options?: GetLatestScriptModulesOptions
): MinecraftScriptModule[] {
    const result: MinecraftScriptModule[] = [];

    const modulesByUUID: Record<string, MinecraftScriptModule[]> = {};
    for (const module of modules) {
        if (
            (options === GetLatestScriptModulesOptions.OnlyStable && semver.prerelease(module.version)) ||
            (options === GetLatestScriptModulesOptions.OnlyPrerelease && !semver.prerelease(module.version))
        ) {
            continue;
        }

        if (modulesByUUID[module.uuid] === undefined) {
            modulesByUUID[module.uuid] = [];
        }

        modulesByUUID[module.uuid].push(module);
    }

    for (const uuid in modulesByUUID) {
        modulesByUUID[uuid] = modulesByUUID[uuid].sort(utils.reverseSemVerSortComparer('version'));

        for (const module of modulesByUUID[uuid]) {
            result.push(module);

            if (
                options !== GetLatestScriptModulesOptions.StableAndPrerelease ||
                (options === GetLatestScriptModulesOptions.StableAndPrerelease && !semver.prerelease(module.version))
            ) {
                break;
            }
        }
    }

    return result;
}

export class MinecraftRelease {
    script_modules: RuntimeDataModule<MinecraftScriptModule>[] = [];
    command_modules: RuntimeDataModule<MinecraftCommandModule>[] = [];
    block_modules: RuntimeDataModule<MinecraftBlockModule>[] = [];
    vanilla_data_modules: RuntimeDataModule<MinecraftVanillaDataModule>[] = [];
    engine_data_modules: RuntimeDataModule<MinecraftEngineDataModule>[] = [];
    json_schemas: MinecraftJsonSchemaMap = {};

    constructor(public minecraft_version: string) {}

    copy(): MinecraftRelease {
        const result = new MinecraftRelease(this.minecraft_version);

        for (const module of this.script_modules) {
            result.script_modules.push(JSON.parse(JSON.stringify(module)) as MinecraftScriptModule);
        }
        for (const module of this.command_modules) {
            result.command_modules.push(JSON.parse(JSON.stringify(module)) as MinecraftCommandModule);
        }
        for (const module of this.block_modules) {
            result.block_modules.push(JSON.parse(JSON.stringify(module)) as MinecraftBlockModule);
        }
        for (const module of this.vanilla_data_modules) {
            result.vanilla_data_modules.push(JSON.parse(JSON.stringify(module)) as MinecraftVanillaDataModule);
        }
        for (const module of this.engine_data_modules) {
            result.engine_data_modules.push(JSON.parse(JSON.stringify(module)) as MinecraftEngineDataModule);
        }
        result.json_schemas = JSON.parse(JSON.stringify(this.json_schemas)) as MinecraftJsonSchemaMap;

        return result;
    }

    getAllModules(): IMinecraftModule[] {
        let result: IMinecraftModule[] = [];
        result = result
            .concat(this.script_modules)
            .concat(this.command_modules)
            .concat(this.block_modules)
            .concat(this.vanilla_data_modules)
            .concat(this.engine_data_modules);
        return result;
    }

    /**
     * Gets only the latest version of each script module. This prioritizes pre-release modules if they exist.
     *
     * @param options Provides options to only get the latest stable versions, or the latest pre-release versions, of each module.
     */
    getLatestScriptModules(options?: GetLatestScriptModulesOptions): MinecraftScriptModule[] {
        return getLatestScriptModules(this.script_modules, options);
    }

    /**
     * Gets the latest version of each major release of each script module. This prioritizes pre-release modules if they exist.
     *
     * @param options Provides options to only get the latest stable versions, or the latest pre-release versions, of each major release.
     */
    getLatestScriptModulesByMajorVersion(options?: GetLatestScriptModulesOptions): MinecraftScriptModule[] {
        const result: MinecraftScriptModule[] = [];

        const modulesByUUIDAndMajorVersion: Record<string, Record<number, MinecraftScriptModule[]>> = {};
        for (const module of this.script_modules) {
            if (
                (options === GetLatestScriptModulesOptions.OnlyStable && semver.prerelease(module.version)) ||
                (options === GetLatestScriptModulesOptions.OnlyPrerelease && !semver.prerelease(module.version))
            ) {
                continue;
            }

            const majorVersion = semver.major(module.version);
            if (modulesByUUIDAndMajorVersion[module.uuid] === undefined) {
                modulesByUUIDAndMajorVersion[module.uuid] = {};
            }
            if (modulesByUUIDAndMajorVersion[module.uuid][majorVersion] === undefined) {
                modulesByUUIDAndMajorVersion[module.uuid][majorVersion] = [];
            }

            modulesByUUIDAndMajorVersion[module.uuid][majorVersion].push(module);
        }

        for (const uuid in modulesByUUIDAndMajorVersion) {
            for (const majorVersion in modulesByUUIDAndMajorVersion[uuid]) {
                modulesByUUIDAndMajorVersion[uuid][majorVersion] = modulesByUUIDAndMajorVersion[uuid][
                    majorVersion
                ].sort(utils.reverseSemVerSortComparer('version'));

                for (const module of modulesByUUIDAndMajorVersion[uuid][majorVersion]) {
                    result.push(module);

                    // If we're getting latest stable and prerelease, then stop copying once we land on the first stable version
                    if (
                        options !== GetLatestScriptModulesOptions.StableAndPrerelease ||
                        (options === GetLatestScriptModulesOptions.StableAndPrerelease &&
                            !semver.prerelease(module.version))
                    ) {
                        break;
                    }
                }
            }
        }

        return result;
    }
}
