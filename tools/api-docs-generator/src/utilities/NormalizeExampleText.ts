// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Removes a leading BOM, normalizes CRLF/CR to LF, and removes one final newline
 * without trimming other whitespace.
 */
export function normalizeExampleText(text: string): string {
    return text
        .replace(/^\uFEFF/, '')
        .replace(/\r\n?/g, '\n')
        .replace(/\n$/, '');
}
