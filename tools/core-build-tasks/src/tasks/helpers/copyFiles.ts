// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FileSystem } from '@rushstack/node-core-library';
import path from 'path';

export function copyFiles(originPaths: string[], outputPath: string) {
    let destinationPath = path.resolve(outputPath);
    for (const originPath of originPaths) {
        const inputPath = path.resolve(originPath);
        const pathStats = FileSystem.getLinkStatistics(inputPath);
        if (pathStats.isDirectory()) {
            console.log(`Copying folder ${inputPath} to ${destinationPath}`);
        } else {
            const filename = path.parse(inputPath).base;
            destinationPath = path.resolve(destinationPath, filename);
            console.log(`Copying file ${inputPath} to ${destinationPath}`);
        }

        FileSystem.copyFiles({
            sourcePath: inputPath,
            destinationPath: destinationPath,
        });
    }
}
