// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';

import { MinecraftRelease, MinecraftScriptModule } from '..';
import * as Filters from '../filters/CommonFilters';
import { getMergedScriptModules } from '../generator';

function callFilter(name: string, releases: MinecraftRelease[]) {
    for (const filter of Filters.CommonFilters.filters) {
        if (filter[0] === name) {
            filter[1](releases);
            return;
        }
    }
    throw new Error(`Could not find filter '${name}'.`);
}

const SERVER_NAME = '@minecraft/server';
const SERVER_UUID = '1234';
const SERVER_BINDING_NAME = '@minecraft/server-binding';
const SERVER_BINDING_UUID = '5678';
const GAMETEST_UUID = '9101';

const makeScriptModule = (version: string): MinecraftScriptModule => {
    const module_type: 'script' | 'command' = 'script';
    return {
        name: SERVER_NAME,
        uuid: SERVER_UUID,
        parentModule: {
            name: SERVER_BINDING_NAME,
            version: version,
        },
        version: version,
        minecraft_version: '0.1.0',
        module_type: module_type,
        from_module: {
            name: '',
            folder_path: '',
            filepath_name: '',
            version: '1.0.0',
        },
    };
};

const makeScriptBindingModule = (version: string): MinecraftScriptModule => {
    const module_type: 'script' | 'command' = 'script';
    return {
        name: SERVER_BINDING_NAME,
        uuid: SERVER_BINDING_UUID,
        version: version,
        minecraft_version: '0.1.0',
        module_type: module_type,
        from_module: {
            name: '',
            folder_path: '',
            filepath_name: '',
            version: '1.0.0',
        },
    };
};

const makeScriptDependentModule = (version: string): MinecraftScriptModule => {
    const module_type: 'script' | 'command' = 'script';
    return {
        name: '@minecraft/server-gametest',
        uuid: GAMETEST_UUID,
        version: version,
        minecraft_version: '0.1.0',
        module_type: module_type,
        from_module: {
            name: '',
            folder_path: '',
            filepath_name: '',
            version: '1.0.0',
        },
        dependencies: [
            {
                uuid: SERVER_BINDING_UUID,
                name: SERVER_BINDING_NAME,
                versions: [
                    {
                        version: version,
                    },
                ],
            },
        ],
    };
};

describe('Common Filters', () => {
    it('generate_available_module_lists does not crash on missing modules', () => {
        const release = new MinecraftRelease('0.1.0');

        const latest = makeScriptModule('3.2.0-beta');
        latest.is_latest_major = true;
        release.script_modules = [makeScriptModule('1.0.0'), makeScriptModule('1.1.0'), latest];

        callFilter('generate_available_module_lists', [release]);
        const module = release.script_modules.find(module => module.version === '3.2.0-beta');
        expect(module.previous_module_version_chunks[0].versions).toEqual(['1.1.0', '1.0.0']);
    });

    it('generate_available_module_lists does not crash on one beta module', () => {
        const release = new MinecraftRelease('0.1.0');

        const latest = makeScriptModule('3.2.0-beta');
        latest.is_latest_major = true;
        release.script_modules = [latest];

        callFilter('generate_available_module_lists', [release]);
        const module = release.script_modules.find(module => module.version === '3.2.0-beta');
        expect(module.previous_module_version_chunks.length).toBe(0);
    });

    it('generate_available_module_lists does not crash on one stable module', () => {
        const release = new MinecraftRelease('0.1.0');

        const latest = makeScriptModule('1.0.0');
        latest.is_latest_major = true;
        release.script_modules = [latest];

        callFilter('generate_available_module_lists', [release]);
        const module = release.script_modules.find(module => module.version === '1.0.0');
        expect(module.previous_module_version_chunks.length).toBe(0);
    });

    it('upgrade_from_module_to_base does not upgrade from_module to base if depending on parent', () => {
        const release = new MinecraftRelease('0.1.0');
        const server = makeScriptModule('1.0.0');
        const latestServer = makeScriptModule('1.1.0');
        const serverBinding = makeScriptBindingModule('1.0.0');
        const latestServerBinding = makeScriptBindingModule('1.1.0');
        const dependentModule = makeScriptDependentModule('1.0.0');
        const latestDependentModule = makeScriptDependentModule('1.1.0');

        for (const dep of [latestServerBinding, serverBinding]) {
            dep.classes = [
                {
                    name: 'ClassFoo',
                    type: {
                        name: 'ClassFoo',
                        is_errorable: false,
                        is_bind_type: false,
                    },
                },
            ];
        }

        for (const dep of [dependentModule, latestDependentModule]) {
            dep.functions = [
                {
                    name: 'Foo',
                    is_constructor: false,
                    arguments: [],
                    return_type: {
                        name: 'ClassFoo',
                        from_module: {
                            name: '@minecraft/server-bindings',
                            uuid: SERVER_BINDING_UUID,
                            version: '1.0.0',
                        },
                        is_errorable: false,
                        is_bind_type: false,
                    },
                },
            ];
        }

        release.script_modules = [
            latestDependentModule,
            server,
            latestServer,
            latestServerBinding,
            serverBinding,
            dependentModule,
        ];
        release.script_modules = getMergedScriptModules(true, release.script_modules);
        callFilter('upgrade_from_module_to_base', [release]);

        expect(
            release.script_modules.find(m => m.uuid === GAMETEST_UUID && m.version === '1.0.0').functions[0].return_type
                .from_module.name
        ).toBe('@minecraft/server-bindings');

        expect(
            release.script_modules.find(m => m.uuid === GAMETEST_UUID && m.version === '1.1.0').functions[0].return_type
                .from_module.name
        ).toBe('@minecraft/server-bindings');
    });

    it('upgrade_from_module_to_base successfully upgrades from_module to base', () => {
        const release = new MinecraftRelease('0.1.0');
        const server = makeScriptModule('1.0.0');
        const latestServer = makeScriptModule('1.1.0');
        const serverBinding = makeScriptBindingModule('1.0.0');
        const latestServerBinding = makeScriptBindingModule('1.1.0');
        const dependentModule = makeScriptDependentModule('1.0.0');
        dependentModule.dependencies[0].name = SERVER_NAME;
        dependentModule.dependencies[0].uuid = SERVER_UUID;
        const latestDependentModule = makeScriptDependentModule('1.1.0');
        latestDependentModule.dependencies[0].name = SERVER_NAME;
        latestDependentModule.dependencies[0].uuid = SERVER_UUID;

        for (const dep of [latestServerBinding, serverBinding]) {
            dep.classes = [
                {
                    name: 'ClassFoo',
                    type: {
                        name: 'ClassFoo',
                        is_errorable: false,
                        is_bind_type: false,
                    },
                },
            ];
        }

        for (const dep of [dependentModule, latestDependentModule]) {
            dep.functions = [
                {
                    name: 'Foo',
                    is_constructor: false,
                    arguments: [],
                    return_type: {
                        name: 'ClassFoo',
                        from_module: {
                            name: '@minecraft/server-bindings',
                            uuid: SERVER_BINDING_UUID,
                            version: '1.0.0',
                        },
                        is_errorable: false,
                        is_bind_type: false,
                    },
                },
            ];
        }

        release.script_modules = [
            latestDependentModule,
            server,
            latestServer,
            latestServerBinding,
            serverBinding,
            dependentModule,
        ];
        release.script_modules = getMergedScriptModules(true, release.script_modules);
        callFilter('upgrade_from_module_to_base', [release]);

        expect(
            release.script_modules.find(m => m.uuid === GAMETEST_UUID && m.version === '1.0.0').functions[0].return_type
                .from_module.name
        ).toBe('@minecraft/server');

        expect(
            release.script_modules.find(m => m.uuid === GAMETEST_UUID && m.version === '1.1.0').functions[0].return_type
                .from_module.name
        ).toBe('@minecraft/server');
    });
});
