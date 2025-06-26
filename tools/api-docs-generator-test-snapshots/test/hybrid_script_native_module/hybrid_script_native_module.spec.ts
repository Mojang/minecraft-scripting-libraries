// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';
import { join } from 'path';

describe('Hybrid Script and Native Module', () => {
    it('Properly generates documentation for modules generated from a hybrid of script and native bindings', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'npm', 'msdocs'],
            outDir: join(__dirname, 'standard_output'),
        });
    });
    it('Generates documentation for both the base and derived modules if the flag is explicitly set', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'npm', 'msdocs'],
            outDir: join(__dirname, 'extended_output'),
            additionalArgs: '-b',
        });
    });
});
