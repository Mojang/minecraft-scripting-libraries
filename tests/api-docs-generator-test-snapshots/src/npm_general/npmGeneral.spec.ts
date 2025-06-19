// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('NPM General', () => {
    it('Properly generates documentation for the NPM', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'npm'],
        });
    });
});
