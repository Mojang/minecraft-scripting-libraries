// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Config } from 'prettier';

export const PRETTIER_CONFIGURATION: Config = {
    arrowParens: 'avoid',
    bracketSpacing: true,
    endOfLine: 'crlf',
    parser: 'typescript',
    printWidth: 120,
    singleQuote: true,
    tabWidth: 4,
    trailingComma: 'es5',
    useTabs: false,
};
