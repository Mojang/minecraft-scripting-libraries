// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Examples', () => {
    it('Properly generates examples documentation and definitions', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['msdocs'],
        });
    });
});
