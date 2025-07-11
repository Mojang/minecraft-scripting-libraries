// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import headerPlugin from 'eslint-plugin-header';
import minecraftLinting from 'eslint-plugin-minecraft-linting';
import unicornPlugin from 'eslint-plugin-unicorn';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

// Workaround for eslint-plugin-header not properly adhering to ESLint v9 requirements
headerPlugin.rules.header.meta.schema = false;

export default tsEslint.config(
    eslint.configs.recommended,
    tsEslint.configs.recommendedTypeChecked,
    prettierConfig,
    {
        ignores: ['build', 'dist', 'lib', 'lib-cjs', 'temp'],
    },
    {
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                project: './tsconfig.json',
            },
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            header: headerPlugin,
            '@typescript-eslint': tsPlugin,
            unicorn: unicornPlugin,
            'minecraft-linting': minecraftLinting,
        },
        rules: {
            '@typescript-eslint/naming-convention': [
                'error',
                { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
            ],
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-unsafe-enum-comparison': 'off',
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
            eqeqeq: ['error', 'always'],
            'header/header': [
                2,
                'line',
                [' Copyright (c) Microsoft Corporation.', ' Licensed under the MIT License.'],
                1,
            ],
            'minecraft-linting/avoid-unnecessary-command': 'error',
            'unicorn/no-abusive-eslint-disable': 'error',
            'unicorn/no-null': ['error', { checkStrictEquality: true }],
        },
    },
    // Disable type checked rules for workspace root JS and config files
    {
        files: ['**/*.{js,cjs,mjs}', '*.config.{ts,cts,mts}'],
        extends: [tsEslint.configs.disableTypeChecked],
    }
);
