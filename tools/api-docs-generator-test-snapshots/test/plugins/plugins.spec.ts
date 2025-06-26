// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';
import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Plugins', () => {
    it('Dynamically loads markup generator from a plugin module', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['test-1'],
            configPath: path.resolve(__dirname, 'api-docs-generator.config.mjs'),
        });
    });
});
