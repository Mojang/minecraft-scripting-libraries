// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';
import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';

describe('Protocol Schemas', () => {
    it('Properly generates HTML pages and index for game protocol packets', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['protocol'],
        });
    });

    it('Generates a complete Astro project with normalized protocol metadata', () => {
        runGeneratorForTest({
            testDir: __dirname,
            outDir: path.join(__dirname, 'actual_astro_output'),
            generators: ['protocol-astro'],
            excludedFiles: [
                'README.md',
                'astro.config.mjs',
                'tsconfig.json',
                path.join('src', 'components'),
                path.join('src', 'layouts'),
                path.join('src', 'pages'),
                path.join('src', 'styles'),
                path.join('src', 'types.ts'),
            ],
        });
    });
});
