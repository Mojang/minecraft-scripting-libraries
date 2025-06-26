// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';

import * as log from './Logger';
import * as utils from './utilities';

export class FileLoader {
    private fileCache: Map<string, Buffer>;
    private filePathIsCached: Record<string, boolean>;
    private rootFilePath: string;
    private supportedExtensions: string[];

    constructor(rootFilePath: string, extensions?: string[]) {
        this.fileCache = new Map<string, Buffer>();
        this.rootFilePath = rootFilePath;
        this.supportedExtensions = extensions ?? [];

        this.filePathIsCached = {};
        let filePaths = utils.getFilesRecursively(this.rootFilePath);

        if (this.supportedExtensions.length > 0) {
            filePaths = filePaths.filter(p => this.supportedExtensions.includes(path.extname(p)));
        }

        for (const p of filePaths) {
            this.filePathIsCached[p.toLowerCase()] = false;
        }
    }

    loaded(): boolean {
        return Object.keys(this.filePathIsCached).length > 0;
    }

    canLoadFile(filePath: string): boolean {
        const realPath = path.resolve(path.join(this.rootFilePath, filePath));
        return Object.hasOwn(this.filePathIsCached, realPath.toLowerCase());
    }

    readFile(filePath: string): Buffer {
        const realPath = path.resolve(path.join(this.rootFilePath, filePath));

        const ext = path.extname(realPath);
        if (this.supportedExtensions.length > 0 && !this.supportedExtensions.includes(ext)) {
            throw new Error(
                `Attempted to read file of type '${ext}' not supported by this FileLoader.\nFile: ${realPath}`
            );
        }

        if (!Object.hasOwn(this.filePathIsCached, realPath.toLowerCase())) {
            throw new Error(
                `Attempted to read file outside of FileLoader input directory.\nFile: ${realPath}\nInput Directory: ${this.rootFilePath}`
            );
        }

        if (!this.fileCache.has(realPath)) {
            this.fileCache.set(realPath, utils.readFile(realPath));

            // Mark this file as having been read so we can log unused files
            this.filePathIsCached[realPath.toLowerCase()] = true;
        }

        return this.fileCache.get(realPath);
    }

    readFileAsString(filePath: string): string {
        return this.readFile(filePath).toString('utf-8');
    }

    joinToRoot(directory: string): string {
        return path.join(this.rootFilePath, directory);
    }

    logUnusedFiles(): void {
        for (const filePath in this.filePathIsCached) {
            if (!this.filePathIsCached[filePath]) {
                log.printOption(`Documentation file was not used: ${filePath}`, 'unusedDocumentation');
            }
        }
    }
}
