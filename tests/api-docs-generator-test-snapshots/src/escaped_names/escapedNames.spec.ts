// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Escaped Names', () => {
    it('Properly generates documentation for names which need escaping', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts'],
        });
    });
});
