// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';
import path from 'path';

describe('Module Version Mangling', () => {
    it('Stable Minecraft - No preexisting releases', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_output', 'stable_minecraft_no_preexisting_releases'),
            generators: ['ts', 'ts-source', 'npm'],
            minecraftVersion: '1.2.3',
        });
    });

    it('Preview Minecraft - No preexisting releases', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_output', 'preview_minecraft_no_preexisting_releases'),
            generators: ['ts', 'ts-source', 'npm'],
            minecraftVersion: '1.2.3-preview.5',
        });
    });

    it('Stable Minecraft - Preexisting releases', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_output', 'stable_minecraft_preexisting_releases'),
            generators: ['ts', 'ts-source', 'npm'],
            minecraftVersion: '1.2.3',
            additionalArgs: `--preexisting-release-versions ${__dirname}/preexisting_releases.json`,
        });
    });

    it('Preview Minecraft - Preexisting releases', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_output', 'preview_minecraft_preexisting_releases'),
            generators: ['ts', 'ts-source', 'npm'],
            minecraftVersion: '1.2.3-preview.5',
            additionalArgs: `--preexisting-release-versions ${__dirname}/preexisting_releases.json`,
        });
    });
});
