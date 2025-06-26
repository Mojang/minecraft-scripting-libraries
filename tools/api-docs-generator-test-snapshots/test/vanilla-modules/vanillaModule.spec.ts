// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { join } from 'path';
import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Vanilla Modules', () => {
    it('Generates correct typescript source and npm modules for all vanilla modules', () => {
        runGeneratorForTest({
            generators: ['ts', 'ts-source', 'npm'],
            testDir: __dirname,
            outDir: join(__dirname, 'stable_output'),
        });
    });

    it('Generates correct typescript source and npm modules for vanilla modules in a pre-release version', () => {
        runGeneratorForTest({
            generators: ['ts', 'ts-source', 'npm'],
            testDir: __dirname,
            minecraftVersion: '1.2.3-preview.5',
            outDir: join(__dirname, 'preview_output'),
        });
    });
});
