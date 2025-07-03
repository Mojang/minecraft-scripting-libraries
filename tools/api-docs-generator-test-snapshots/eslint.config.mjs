// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import configMinecraftScripting from 'eslint-config-minecraft-scripting';

export default [
    ...configMinecraftScripting,
    {
        ignores: ['test/**/*.{js,mjs}', 'test/**/docs', 'test/**/*_output'],
    },
    {
        files: ['test/**', 'plugin/**'],
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.plugin.json'],
            },
        },
        rules: {
            // Turn off naming-convention rule due to API metadata JSON format using snake_case
            '@typescript-eslint/naming-convention': 'off',
        },
    },
];
