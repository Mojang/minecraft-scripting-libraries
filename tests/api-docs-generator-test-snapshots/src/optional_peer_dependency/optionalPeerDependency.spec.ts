// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Optional Peer Dependency', () => {
    it('Properly generates types for module that has an optional types-only peer dependency', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'npm'],
        });
    });
});
