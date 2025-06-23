// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Minecraft Version Stable', () => {
    it('Generates correct output for stable minecraft versions', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs', 'npm'],
            minecraftVersion: '1.2.3',
        });
    });
});
