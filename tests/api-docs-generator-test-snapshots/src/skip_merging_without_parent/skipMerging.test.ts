// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Skip Merging Without Parent', () => {
    it('Properly skips merging if skip merging is set to true', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts'],
            skipMerging: true,
        });
    });
});
