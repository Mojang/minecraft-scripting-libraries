// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Only Generate Latest Script Module Versions', () => {
    it('Generates correct output containing only the latest module for each major release', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs', 'changelog', 'changelog-json'],
            additionalArgs: `--include-modules latest`,
        });
    });
});
