// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Manifest Examples', () => {
    it('Properly generates using latest stable if possible', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['msdocs', 'ts'],
        });
    });
});
