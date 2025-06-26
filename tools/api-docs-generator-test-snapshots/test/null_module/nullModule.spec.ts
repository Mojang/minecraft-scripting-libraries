// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Null Module', () => {
    it('Correctly processes null module member categories when changelogged', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs', 'changelog-json'],
        });
    });
});
