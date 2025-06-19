// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('General', () => {
    it('Properly generates documentation for the input', () => {
        runGeneratorForTest({
            testDir: __dirname,
            // Don't provide any generators to use all the default generators
            excludedFiles: ['hierarchy.js', 'navigation.js', 'search.js', 'main.js'],
        });
    });
});
