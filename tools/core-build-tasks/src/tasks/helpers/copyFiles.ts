// Copyright (c) Mojang AB.  All rights reserved.

import { FileSystem } from '@rushstack/node-core-library';
import path from 'path';

export function copyFiles(originPaths: string[], outputPath: string) {
    const destinationPath = path.resolve(outputPath);
    for (const originPath of originPaths) {
        const inputPath = path.resolve(originPath);
        const pathStats = FileSystem.getLinkStatistics(inputPath);
        if (pathStats.isDirectory()) {
            console.log(`Copying folder ${inputPath} to ${destinationPath}`);
            FileSystem.copyFiles({
                sourcePath: inputPath,
                destinationPath: destinationPath,
            });
        } else {
            const filename = path.parse(inputPath).base;
            const destinationFilePath = path.resolve(destinationPath, filename);
            console.log(`Copying file ${inputPath} to ${destinationPath}`);
            FileSystem.copyFiles({
                sourcePath: inputPath,
                destinationPath: destinationFilePath,
            });
        }
    }
}
