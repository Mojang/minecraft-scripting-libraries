// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Static Functions', () => {
    it('Properly generates documentation for modules with static functions', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
        });
    });
});
