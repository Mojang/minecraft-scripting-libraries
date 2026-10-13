// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Converts LF/CRLF line breaks to HTML breaks and escapes unescaped table delimiters.
 */
export function formatMarkdownTableCell(text: string): string {
    return text.replace(/\r?\n/g, '<br>').replace(/(?<!\\)\|/g, '\\|');
}
