// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Variants', () => {
    it('Properly generates documentation for modules which contain variants', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
        });
    });
});
