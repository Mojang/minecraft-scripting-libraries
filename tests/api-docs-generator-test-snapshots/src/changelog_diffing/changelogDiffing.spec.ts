// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Changelog Diffing', () => {
    it('Generates correct output for changelog diffs', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['msdocs', 'ts', 'changelog', 'changelog-json'],
        });
    });
});
