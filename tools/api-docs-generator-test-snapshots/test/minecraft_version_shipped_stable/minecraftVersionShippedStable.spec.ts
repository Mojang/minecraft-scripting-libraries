// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';
import path from 'path';

describe('Minecraft Version Shipped Stable', () => {
    it('Generates correct output for module with stable shipped version and beta in a new version in stable', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_output', 'stable'),
            generators: ['ts', 'msdocs', 'npm', 'changelog-json'],
            minecraftVersion: '1.2.3',
        });
    });
});

describe('Minecraft Version Shipped Stable', () => {
    it('Generates correct output for module with stable shipped version and beta in a new version in preview', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_output', 'preview'),
            generators: ['ts', 'msdocs', 'npm', 'changelog-json'],
            minecraftVersion: '1.2.3-preview.5',
        });
    });
});
