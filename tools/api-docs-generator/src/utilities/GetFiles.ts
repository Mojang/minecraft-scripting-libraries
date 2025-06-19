// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';

export function readFile(filePath: string): Buffer | undefined {
    try {
        const fileData = fs.readFileSync(filePath);
        return fileData;
    } catch {
        return undefined;
    }
}

export function getFiles(dir: string): string[] {
    try {
        const files = fs.readdirSync(dir);
        return files;
    } catch {
        return [];
    }
}

export function getFilesRecursively(dir: string): string[] {
    try {
        const dirents = fs.readdirSync(dir, { withFileTypes: true });
        const files = dirents.map(dirent => {
            const res = path.resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFilesRecursively(res) : res;
        });
        return Array.prototype.concat(...files) as string[];
    } catch {
        return [];
    }
}
