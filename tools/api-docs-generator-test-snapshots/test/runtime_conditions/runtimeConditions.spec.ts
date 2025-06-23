// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Runtime Conditions', () => {
    it('Properly generates documentation for runtime conditions', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
        });
    });
});
