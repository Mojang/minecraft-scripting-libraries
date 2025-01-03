// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import AvoidUnnecessaryCommand from './Rules/AvoidUnnecessaryCommand.js';

module.exports = {
    meta: {
        name: 'eslint-plugin-minecraft-linting',
    },
    rules: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'avoid-unnecessary-command': AvoidUnnecessaryCommand,
    },
};
