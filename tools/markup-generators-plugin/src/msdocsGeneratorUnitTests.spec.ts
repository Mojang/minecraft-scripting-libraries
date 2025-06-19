// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';

import { MinecraftRelease } from '@minecraft/api-docs-generator';
import { MSDocsMarkdownGenerator } from './generators';

describe('MSDocsMarkdownGenerator Unit Tests', () => {
    it('Returns correctly sorted modules', () => {
        const gen = new MSDocsMarkdownGenerator();
        const release = new MinecraftRelease('0.1.0');
        const makeServerType = (version: string) => {
            const module_type: 'script' | 'command' = 'script';
            return {
                name: '@minecraft/server',
                uuid: '1234',
                version: version,
                minecraft_version: '0.1.0',
                module_type: module_type,
            };
        };

        const makeServerUIType = (version: string) => {
            const module_type: 'script' | 'command' = 'script';
            return {
                name: '@minecraft/server-ui',
                uuid: '12345',
                version: version,
                minecraft_version: '0.1.0',
                module_type: module_type,
            };
        };

        release.script_modules = [
            makeServerType('1.0.0'),
            makeServerType('1.3.0'),
            makeServerType('1.4.0'),
            makeServerUIType('2.0.0'),
            makeServerUIType('2.1.0'),
            makeServerUIType('2.2.0'),
            makeServerUIType('3.0.0'),
            makeServerUIType('3.1.0-beta'),
            makeServerType('1.1.0'),
            makeServerType('2.0.0'),
            makeServerType('2.1.0'),
            makeServerType('3.0.0'),
            makeServerType('3.1.0'),
            makeServerType('3.2.0-beta'),
            makeServerUIType('1.0.0'),
            makeServerUIType('1.1.0'),
        ];

        const { latest, prior } = gen.getSortedModules(release);
        expect(latest.length).toEqual(2);
        expect(latest[0].name).toEqual('@minecraft/server');
        expect(latest[0].version).toEqual('3.2.0-beta');
        expect(latest[1].name).toEqual('@minecraft/server-ui');
        expect(latest[1].version).toEqual('3.1.0-beta');

        expect(prior.length).toEqual(4);
        expect(prior[0].name).toEqual('@minecraft/server');
        expect(prior[0].version).toEqual('2.1.0');
        expect(prior[1].name).toEqual('@minecraft/server');
        expect(prior[1].version).toEqual('1.4.0');
        expect(prior[2].name).toEqual('@minecraft/server-ui');
        expect(prior[2].version).toEqual('2.2.0');
        expect(prior[3].name).toEqual('@minecraft/server-ui');
        expect(prior[3].version).toEqual('1.1.0');
    });
});
