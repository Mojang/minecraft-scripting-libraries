// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';

import { describe, expect, it } from 'vitest';

import { MinecraftRelease } from '../MinecraftRelease';
import { ProtocolChangelogGenerator } from '../ProtocolChangelogGenerator';

function createRelease(minecraftVersion: string, includeChanges: boolean): MinecraftRelease {
    const release = new MinecraftRelease(minecraftVersion);
    const schemaDirectory = path.resolve('protocol');
    release.protocol_schemas = {
        [path.join(schemaDirectory, 'ExamplePacket.json')]: {
            'x-protocol-version': '100',
            title: 'ExamplePacket',
            type: 'object',
            $metaProperties: { '[cereal:packet]': 1 },
            properties: {
                Value: {
                    title: 'Value',
                    type: 'integer',
                    'x-underlying-type': 'uint32',
                    'x-ordinal-index': 0,
                },
                ...(includeChanges
                    ? {
                          Enabled: {
                              title: 'Enabled',
                              type: 'boolean',
                              'x-ordinal-index': 1,
                          },
                      }
                    : {}),
            },
            required: ['Value'],
        },
        [path.join(schemaDirectory, 'ExampleState.json')]: {
            'x-protocol-version': '100',
            title: 'ExampleState',
            type: 'integer',
            enum: includeChanges ? ['None', 'Ready'] : ['None'],
            'x-underlying-type': 'uint8',
        },
    };
    return release;
}

describe('ProtocolChangelogGenerator', () => {
    it('generates a changelog from labeled releases supplied by another generator', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([
            { release: current, releaseDate: '2026-08-18', version: 'pr-head' },
            { release: previous, releaseDate: '2026-08-17', version: 'pr-base' },
        ]);

        expect(changelog).toHaveLength(1);
        expect(changelog[0]).toMatchObject({
            minecraftVersion: '1.2.0',
            previousProtocolVersion: '100',
            previousVersion: 'pr-base',
            protocolVersion: '100',
            protocolVersionShouldHaveChanged: true,
            releaseDate: '2026-08-18',
            totalChanges: 2,
            version: 'pr-head',
        });
        expect(changelog[0].packets.changed).toEqual([
            {
                details: ['Added field Enabled (Enabled).'],
                slug: 'example-packet',
                title: 'ExamplePacket',
            },
        ]);
        expect(changelog[0].types.changed).toEqual([
            {
                details: ['Added enum value Ready.'],
                slug: 'example-state',
                title: 'ExampleState',
            },
        ]);
    });

    it('accepts Minecraft releases directly', () => {
        const changelog = new ProtocolChangelogGenerator().generateChangelogs([
            createRelease('1.2.0', true),
            createRelease('1.1.0', false),
        ]);

        expect(changelog[0].version).toBe('1.2.0');
        expect(changelog[0].previousVersion).toBe('1.1.0');
    });
});
