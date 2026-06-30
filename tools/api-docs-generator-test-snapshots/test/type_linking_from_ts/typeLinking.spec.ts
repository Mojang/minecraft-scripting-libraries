// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';
import { join } from 'path';

describe('Type Linking', () => {
    it('Properly generates documentation for types that are linked', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
        });
    });

    it('Properly generates documentation for types that are linked with including base module', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
            additionalArgs: '--include-base',
            outDir: join(__dirname, 'include_base_output'),
        });
    });
});
