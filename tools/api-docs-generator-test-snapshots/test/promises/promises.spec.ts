// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Promises', () => {
    it('Properly generates promises documentation and definitions', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
        });
    });
});
