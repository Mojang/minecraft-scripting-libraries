// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export default {
    plugins: [['test-plugin', { path: 'api-docs-generator-test-snapshots/plugin' }]],
    generators: {
        'test-1': { message: 'This string is defined in the config file' },
    },
};
