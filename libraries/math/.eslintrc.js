module.exports = {
    root: true,
    // This tells ESLint to load the config from the package `eslint-config-minecraft-scripting`
    extends: ['minecraft-scripting'],
    parserOptions: {
        tsconfigRootDir: __dirname,
    },
};
