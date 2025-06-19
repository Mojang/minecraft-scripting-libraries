// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Minecraft Version Beta', () => {
    it('Generates correct output for beta minecraft versions', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs', 'npm'],
            minecraftVersion: '1.2.3-preview.5',
        });
    });
});
