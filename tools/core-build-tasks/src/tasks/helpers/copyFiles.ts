// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FileSystem } from '@rushstack/node-core-library';
import path from 'path';

export function copyFiles(originPaths: string[], outputPath: string, skipIfPossible: boolean = true) {
    let destinationPath = path.resolve(outputPath);
    const MTIME_TOLERANCE_MS = 1000; // 1 second tolerance, avoid the case when file copying across system get delayed
    for (const originPath of originPaths) {
        const inputPath = path.resolve(originPath);
        const pathStats = FileSystem.getLinkStatistics(inputPath);
        if (pathStats.isDirectory()) {
            console.log(`Copying folder ${inputPath} to ${destinationPath}`);
        } else {
            const filename = path.parse(inputPath).base;
            const fileDestinationPath = path.resolve(destinationPath, filename);

            let shouldCopy = true;
            if (skipIfPossible) {
                try {
                    const destFileStats = FileSystem.getStatistics(fileDestinationPath);
                    // If sizes differ => must copy
                    if (destFileStats.size !== pathStats.size) {
                        shouldCopy = true;
                    } else {
                        // sizes equal -> check mtimes within tolerance
                        const srcMtime = (pathStats as any).mtimeMs ?? new Date((pathStats as any).mtime).getTime();
                        const destMtime = (destFileStats as any).mtimeMs ?? new Date((destFileStats as any).mtime).getTime();
                        if (Math.abs(srcMtime - destMtime) > MTIME_TOLERANCE_MS) {
                            shouldCopy = true;
                        } else {
                            // sizes equal and mtimes within tolerance -> skip copy
                            shouldCopy = false;
                        }
                    }
                } catch (e: any) {
                    shouldCopy = true;
                }
            }

            if (!shouldCopy) {
                console.log(`Skipping copy for ${inputPath}; no change detected`);
                continue;
            }

            console.log(`Copying file ${inputPath} to ${fileDestinationPath}`);
            FileSystem.copyFiles({
                sourcePath: inputPath,
                destinationPath: fileDestinationPath,
                preserveTimestamps: true,
            });
            continue;
        }

        FileSystem.copyFiles({
            sourcePath: inputPath,
            destinationPath: destinationPath,
            preserveTimestamps: true,
        });
    }
}
