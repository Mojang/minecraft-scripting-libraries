// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import AvoidUnnecessaryCommand from './Rules/AvoidUnnecessaryCommand.js';

module.exports = {
    meta: {
        name: 'eslint-plugin-minecraft-linting',
    },
    rules: {
        'avoid-unnecessary-command': AvoidUnnecessaryCommand,
    },
};
