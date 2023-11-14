module.exports = {
    extends: [
        'prettier',
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: { project: ['./tsconfig.json'] },
    plugins: ['@typescript-eslint', 'unicorn', 'minecraft-linting'],
    overrides: [{ files: ['**/*.{ts,tsx,js,jsx}', '*.ts'] }],
    rules: {
        'unicorn/no-abusive-eslint-disable': 'error',
        'unicorn/no-null': ['error', { checkStrictEquality: true }],
        '@typescript-eslint/no-empty-function': 'off',
        'no-unused-vars': 'off',
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
        'minecraft-linting/avoid-unnecessary-command': 'error',
    },
};
