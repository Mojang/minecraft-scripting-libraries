import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import eslint from '@eslint/js';
import globals from 'globals';
import header from 'eslint-plugin-header';
import minecraftLinting from 'eslint-plugin-minecraft-linting';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
    eslintConfigPrettier,
    eslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,jsx}', '*.ts'],
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
            header,
            tsEslint,
            '@typescript-eslint': tsEslint,
            unicorn: eslintPluginUnicorn,
            'minecraft-linting': minecraftLinting,
        },
        rules: {
            ...tsEslint.configs['eslint-recommended'].rules,
            ...tsEslint.configs['recommended'].rules,
            'unicorn/no-abusive-eslint-disable': 'error',
            'unicorn/no-null': ['error', { checkStrictEquality: true }],
            '@typescript-eslint/no-empty-function': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/naming-convention': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true }],
            eqeqeq: ['error', 'always'],
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            'header/header': [
                2,
                'line',
                [' Copyright (c) Microsoft Corporation.', ` Licensed under the MIT License.`],
                1,
            ],
            'minecraft-linting/avoid-unnecessary-command': 'error',
        },
    },
];
