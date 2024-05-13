import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

export default [
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
        rules: {
            eqeqeq: ['error', 'always'],
        },
    },
];
