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
            const fileDestinationPath = path.resolve(destinationPath, filename);
            console.log(`Copying file ${inputPath} to ${fileDestinationPath}`);
            try {
                const destFileStats = FileSystem.getStatistics(fileDestinationPath);
                if (destFileStats.size === pathStats.size) {
                    continue;
                }
            } catch (e) {
                // If getStatistics throws, destination likely doesn't exist — proceed to copy
            }

            FileSystem.copyFiles({
                sourcePath: inputPath,
                destinationPath: fileDestinationPath,
            });
            continue;
        }

        FileSystem.copyFiles({
            sourcePath: inputPath,
            destinationPath: destinationPath,
        });
    }
}
