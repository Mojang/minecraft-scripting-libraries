// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import AvoidUnnecessaryCommand from './Rules/AvoidUnnecessaryCommand';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires
const { name, version }: { name: string; version: string } = require('../package.json');

module.exports = {
    meta: {
        name,
        version,
    },
    rules: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'avoid-unnecessary-command': AvoidUnnecessaryCommand,
    },
};
