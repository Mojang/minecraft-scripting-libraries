// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Molang Module', () => {
    it('Can process molang metadata JSON', () => {
        runGeneratorForTest({
            testDir: __dirname,
        });
    });
});
