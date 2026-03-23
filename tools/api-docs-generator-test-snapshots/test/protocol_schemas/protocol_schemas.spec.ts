// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Protocol Schemas', () => {
    it('Properly generates HTML pages and index for game protocol packets', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['protocol'],
        });
    });
});
