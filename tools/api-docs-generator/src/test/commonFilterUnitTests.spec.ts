// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';

import { MinecraftRelease, MinecraftScriptModule } from '..';
import * as Filters from '../filters/CommonFilters';

function callFilter(name: string, releases: MinecraftRelease[]) {
    for (const filter of Filters.CommonFilters.filters) {
        if (filter[0] === name) {
            filter[1](releases);
            return;
        }
    }
    throw new Error(`Could not find filter '${name}'.`);
}

const makeScriptModule = (version: string): MinecraftScriptModule => {
    const module_type: 'script' | 'command' = 'script';
    return {
        name: '@minecraft/server',
        uuid: '1234',
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
});
