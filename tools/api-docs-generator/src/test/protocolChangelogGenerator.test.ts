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
            $metaProperties: { '[cereal:packet]': includeChanges ? 10 : 1 },
            properties: {
                Value: {
                    title: 'Value',
                    type: 'integer',
                    'x-underlying-type': 'uint32',
                    'x-ordinal-index': 0,
                },
                State: {
                    $ref: './ExampleState.json',
                    title: 'State',
                    'x-ordinal-index': 1,
                },
                ...(includeChanges
                    ? {
                          Enabled: {
                              title: 'Enabled',
                              type: 'boolean',
                              'x-ordinal-index': 2,
                          },
                      }
                    : {}),
            },
            required: ['Value', 'State'],
        },
        [path.join(schemaDirectory, 'OtherPacket.json')]: {
            'x-protocol-version': '100',
            title: 'OtherPacket',
            type: 'object',
            $metaProperties: { '[cereal:packet]': 2 },
            properties: {
                State: {
                    $ref: './ExampleState.json',
                    title: 'State',
                    'x-ordinal-index': 0,
                },
            },
            required: ['State'],
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
    it('only applies compression to integer widths supported by BinarySchemaWriter', () => {
        const release = createRelease('1.2.0', true);
        const packet = release.protocol_schemas[path.resolve('protocol', 'ExamplePacket.json')];
        packet.properties!.CompressedBool = {
            title: 'CompressedBool',
            type: 'boolean',
            'x-underlying-type': 'boolean',
            'x-serialization-options': 'Compression',
        };
        packet.properties!.CompressedInt16 = {
            title: 'CompressedInt16',
            type: 'integer',
            'x-underlying-type': 'int16',
            'x-serialization-options': 'Compression',
        };
        packet.properties!.CompressedUint8 = {
            title: 'CompressedUint8',
            type: 'integer',
            'x-underlying-type': 'uint8',
            'x-serialization-options': 'Compression',
        };
        packet.properties!.CompressedInt32 = {
            title: 'CompressedInt32',
            type: 'integer',
            'x-underlying-type': 'int32',
            'x-serialization-options': 'Compression',
        };

        const metadata = new ProtocolChangelogGenerator().generateReleaseMetadata(release);
        const fields = metadata.packets.find(document => document.title === 'ExamplePacket')?.fields;

        expect(fields?.slice(-4).map(field => field.type)).toEqual(['boolean', 'int16', 'uint8', 'varint32']);
        expect(metadata.primitives.map(primitive => primitive.title)).not.toEqual(
            expect.arrayContaining(['varboolean', 'varint8', 'varint16', 'varuint8'])
        );
    });

    it('generates linked variants for arrays of unions', () => {
        const release = createRelease('1.2.0', true);
        const schemaDirectory = path.resolve('protocol');
        release.protocol_schemas[path.join(schemaDirectory, 'OtherState.json')] = {
            'x-protocol-version': '100',
            title: 'OtherState',
            type: 'integer',
            enum: ['None'],
            'x-underlying-type': 'uint8',
        };
        release.protocol_schemas[path.join(schemaDirectory, 'ExamplePacket.json')].properties!.States = {
            title: 'States',
            type: 'array',
            items: {
                title: 'State',
                oneOf: [
                    { $ref: './ExampleState.json', title: 'ExampleState' },
                    { $ref: './OtherState.json', title: 'OtherState' },
                ],
            },
            'x-ordinal-index': 3,
        };

        const metadata = new ProtocolChangelogGenerator().generateReleaseMetadata(release);
        const states = metadata.packets.find(packet => packet.title === 'ExamplePacket')?.fields[3];

        expect(states).toMatchObject({
            type: 'array<oneOf<ExampleState, OtherState>>',
            variants: [
                { index: 0, target: 'example-state', title: 'ExampleState', type: 'ExampleState' },
                { index: 1, target: 'other-state', title: 'OtherState', type: 'OtherState' },
            ],
        });
    });

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
            releaseDate: '2026-08-18',
            totalChanges: 2,
            versionDidChange: false,
            version: 'pr-head',
        });
        expect(changelog[0].packets.changed).toEqual([
            {
                changes: [
                    { fieldAdded: { path: 'Enabled', type: 'Enabled' } },
                    {
                        changedType: { slug: 'example-state', title: 'ExampleState' },
                        typeEnumValueAdded: { ordinal: 1, value: 'Ready' },
                    },
                ],
                packetId: 10,
                previousPacketId: 1,
                slug: 'example-packet',
                title: 'ExamplePacket',
            },
            {
                changes: [
                    {
                        changedType: { slug: 'example-state', title: 'ExampleState' },
                        typeEnumValueAdded: { ordinal: 1, value: 'Ready' },
                    },
                ],
                packetId: 2,
                slug: 'other-packet',
                title: 'OtherPacket',
            },
        ]);
        expect(changelog[0]).not.toHaveProperty('types');
    });

    it('does not add shared type changes to added or removed packets', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);
        const schemaDirectory = path.resolve('protocol');
        current.protocol_schemas[path.join(schemaDirectory, 'AddedPacket.json')] = {
            'x-protocol-version': '100',
            title: 'AddedPacket',
            type: 'object',
            $metaProperties: { '[cereal:packet]': 3 },
            properties: {
                State: {
                    $ref: './ExampleState.json',
                    title: 'State',
                    'x-ordinal-index': 0,
                },
            },
            required: ['State'],
        };
        previous.protocol_schemas[path.join(schemaDirectory, 'RemovedPacket.json')] = {
            'x-protocol-version': '100',
            title: 'RemovedPacket',
            type: 'object',
            $metaProperties: { '[cereal:packet]': 4 },
            properties: {
                State: {
                    $ref: './ExampleState.json',
                    title: 'State',
                    'x-ordinal-index': 0,
                },
            },
            required: ['State'],
        };

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, previous]);

        expect(changelog[0].packets.added).toEqual([
            {
                changes: [],
                packetId: 3,
                slug: 'added-packet',
                title: 'AddedPacket',
            },
        ]);
        expect(changelog[0].packets.removed).toEqual([
            {
                changes: [],
                packetId: 4,
                slug: 'removed-packet',
                title: 'RemovedPacket',
            },
        ]);
    });

    it('includes previous-release link metadata when an affected type is removed', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);
        delete current.protocol_schemas[path.resolve('protocol', 'ExampleState.json')];

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, previous]);
        const removedTypeChanges = changelog[0].packets.changed.flatMap(packet =>
            packet.changes.filter(change => change.removedType)
        );

        expect(removedTypeChanges).not.toHaveLength(0);
        expect(removedTypeChanges.every(change => change.removedType?.slug === 'example-state')).toBe(true);
    });

    it('reports enum values shifted by an insertion', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);
        current.protocol_schemas[path.resolve('protocol', 'ExampleState.json')].enum = ['Ready', 'None'];

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, previous]);

        expect(changelog[0].packets.changed[0].changes).toContainEqual({
            changedType: { slug: 'example-state', title: 'ExampleState' },
            typeEnumValueOrdinalChanged: { ordinal: 1, previousOrdinal: 0, value: 'None' },
        });
    });

    it('includes enum ordinals when values are added or removed', () => {
        const expanded = createRelease('1.2.0', true);
        const original = createRelease('1.1.0', false);

        const added = new ProtocolChangelogGenerator().generateChangelogs([expanded, original]);
        const removed = new ProtocolChangelogGenerator().generateChangelogs([original, expanded]);

        expect(added[0].packets.changed[0].changes).toContainEqual({
            changedType: { slug: 'example-state', title: 'ExampleState' },
            typeEnumValueAdded: { ordinal: 1, value: 'Ready' },
        });
        expect(removed[0].packets.changed[0].changes).toContainEqual({
            changedType: { slug: 'example-state', title: 'ExampleState' },
            typeEnumValueRemoved: { ordinal: 1, value: 'Ready' },
        });
    });

    it('includes supporting type targets in field changes', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);
        current.protocol_schemas[path.resolve('protocol', 'ExamplePacket.json')].properties!.State[
            'x-serialization-options'
        ] = 'Allow unknown enum values';

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, previous]);

        expect(changelog[0].packets.changed[0].changes).toContainEqual({
            fieldSerializationOptionAdded: {
                option: 'Allow unknown enum values',
                path: 'State',
                target: 'example-state',
            },
        });
    });

    it('includes current and previous targets when referenced fields change', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);
        const schemaDirectory = path.resolve('protocol');
        current.protocol_schemas[path.join(schemaDirectory, 'OtherState.json')] = {
            'x-protocol-version': '100',
            title: 'OtherState',
            type: 'integer',
            enum: ['None'],
            'x-underlying-type': 'uint8',
        };
        current.protocol_schemas[path.join(schemaDirectory, 'ExamplePacket.json')].properties!.State.$ref =
            './OtherState.json';

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, previous]);

        expect(changelog[0].packets.changed[0].changes).toContainEqual({
            fieldTypeChanged: {
                path: 'State',
                previousTarget: 'example-state',
                previousType: 'ExampleState',
                target: 'other-state',
                type: 'OtherState',
            },
        });
    });

    it('includes targets when referenced fields are added or removed', () => {
        const current = createRelease('1.2.0', true);
        const previous = createRelease('1.1.0', false);
        const schemaDirectory = path.resolve('protocol');
        current.protocol_schemas[path.join(schemaDirectory, 'ExamplePacket.json')].properties!.AddedState = {
            $ref: './ExampleState.json',
            title: 'AddedState',
            'x-ordinal-index': 3,
        };
        previous.protocol_schemas[path.join(schemaDirectory, 'ExamplePacket.json')].properties!.RemovedState = {
            $ref: './ExampleState.json',
            title: 'RemovedState',
            'x-ordinal-index': 3,
        };

        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, previous]);

        expect(changelog[0].packets.changed[0].changes).toContainEqual({
            fieldAdded: { path: 'AddedState', target: 'example-state', type: 'ExampleState' },
        });
        expect(changelog[0].packets.changed[0].changes).toContainEqual({
            fieldRemoved: { path: 'RemovedState', target: 'example-state', type: 'ExampleState' },
        });
    });

    it('accepts Minecraft releases directly', () => {
        const current = createRelease('1.2.0', true);
        for (const schema of Object.values(current.protocol_schemas)) schema['x-protocol-version'] = '101';
        const changelog = new ProtocolChangelogGenerator().generateChangelogs([current, createRelease('1.1.0', false)]);

        expect(changelog[0].version).toBe('1.2.0');
        expect(changelog[0].previousVersion).toBe('1.1.0');
        expect(changelog[0].versionDidChange).toBe(true);
    });
});
