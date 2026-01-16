// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        exclude: [...configDefaults.exclude, '**/lib/**'],
        passWithNoTests: true,
        watch: false,
        testTimeout: 120000,
    },
});
