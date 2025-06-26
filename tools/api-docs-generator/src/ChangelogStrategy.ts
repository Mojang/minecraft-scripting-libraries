// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { prerelease } from 'semver';
import { MinecraftRelease } from './MinecraftRelease';
import { IMinecraftModule } from './modules/IMinecraftModule';
import { MinecraftScriptModule } from './modules/MinecraftScriptModule';

export type ChangelogVersionKey = 'version' | 'minecraft_version';

export interface ChangelogStrategy {
    getVersionKey(): ChangelogVersionKey;
    generateModuleGroupKey(module: IMinecraftModule): string;
    generateModuleGroups(releases: MinecraftRelease[]): IMinecraftModule[][];
    shouldGenerateChangelogs(releases: MinecraftRelease[]): boolean;
}

/**
 * Perform no diffing between modules, will not populate 'changelog' fields.
 */
export class DisabledChangelogStrategy implements ChangelogStrategy {
    getVersionKey(): 'version' {
        return 'version';
    }
    generateModuleGroupKey(): string {
        return 'na';
    }
    generateModuleGroups(): IMinecraftModule[][] {
        return [];
    }
    shouldGenerateChangelogs(): boolean {
        return false;
    }
}

/**
 * Buckets modules per module version to compare same module across multiple versions of its self regardless of Minecraft version.
 *
 * Only applies to Script modules, other module types are only versioned based on Minecraft version.
 */
export class ModuleVersionChangelogStrategy implements ChangelogStrategy {
    getVersionKey(): 'version' {
        return 'version';
    }

    generateModuleGroupKey(module: IMinecraftModule): string {
        if (module.module_type !== 'script') {
            return '';
        }
        const scriptModule = module as MinecraftScriptModule;
        return `${scriptModule.uuid}`;
    }

    generateModuleGroups(releases: MinecraftRelease[]): IMinecraftModule[][] {
        const allModulesByName: { [key: string]: IMinecraftModule[] } = {};
        for (const release of releases) {
            for (const moduleJson of release.script_modules) {
                const moduleName = moduleJson.name;
                if (!allModulesByName[moduleName]) {
                    allModulesByName[moduleName] = [];
                }
                allModulesByName[moduleName].push(moduleJson);
            }
        }
        return Object.values(allModulesByName);
    }

    shouldGenerateChangelogs(releases: MinecraftRelease[]): boolean {
        for (const release of releases) {
            const modulesByUUID: Record<string, boolean> = {};
            for (const moduleJson of release.script_modules) {
                const moduleKey = this.generateModuleGroupKey(moduleJson);
                if (!modulesByUUID[moduleKey]) {
                    modulesByUUID[moduleKey] = true;
                    const prereleaseTag = prerelease(moduleJson.version);
                    if (prereleaseTag) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
        return false;
    }
}

/**
 * Buckets modules per Minecraft version to compare same module versions across multiple Minecraft releases.
 */
export class MinecraftVersionChangelogStrategy implements ChangelogStrategy {
    getVersionKey(): 'minecraft_version' {
        return 'minecraft_version';
    }

    generateModuleGroupKey(module: IMinecraftModule): string {
        if (module.module_type === 'script') {
            const scriptModule = module as MinecraftScriptModule;
            return `${scriptModule.uuid}_${scriptModule.version}`;
        } else {
            return `${module.name}`;
        }
    }

    generateModuleGroups(releases: MinecraftRelease[]): IMinecraftModule[][] {
        const allModulesByUUIDAndVersion: { [key: string]: IMinecraftModule[] } = {};
        for (const release of releases) {
            for (const moduleJson of release.getAllModules()) {
                const moduleKey = this.generateModuleGroupKey(moduleJson);
                if (!allModulesByUUIDAndVersion[moduleKey]) {
                    allModulesByUUIDAndVersion[moduleKey] = [];
                }
                allModulesByUUIDAndVersion[moduleKey].push(moduleJson);
            }
        }
        return Object.values(allModulesByUUIDAndVersion);
    }

    shouldGenerateChangelogs(releases: MinecraftRelease[]): boolean {
        return releases.length > 1;
    }
}

export const CoreChangelogStrategies: [string, ChangelogStrategy][] = [
    ['module_version', new ModuleVersionChangelogStrategy()],
    ['minecraft_version', new MinecraftVersionChangelogStrategy()],
    ['disabled', new DisabledChangelogStrategy()],
];
