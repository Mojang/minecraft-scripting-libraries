import configMinecraftScripting from 'eslint-config-minecraft-scripting';

export default [
    ...configMinecraftScripting,
    {
        rules: {
            // Turn off naming-convention rule due to API metadata JSON format using snake_case
            '@typescript-eslint/naming-convention': 'off',
        },
    },
];
