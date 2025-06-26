import configMinecraftScripting from 'eslint-config-minecraft-scripting';

export default [
    ...configMinecraftScripting,
    {
        languageOptions: {
            parserOptions: {
                project: ['./tsconfig.test.json', './tsconfig.plugin.json'],
            },
        },
        rules: {
            // Turn off naming-convention rule due to API metadata JSON format using snake_case
            '@typescript-eslint/naming-convention': 'off',
        },
    },
];
