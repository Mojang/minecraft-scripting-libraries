// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Additive Beta Change', () => {
    it('Generates correct output when a stable API has an additive change in beta', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
            minecraftVersion: '1.2.3-preview.5',
        });
    });
});
