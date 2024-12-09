// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';
import rimraf from 'rimraf';

export const DEFAULT_CLEAN_DIRECTORIES = ['temp', 'lib', 'dist'];

export function cleanTask(dirs: string[]) {
    return () => {
        for (const dir of dirs) {
            try {
                console.log(`Cleaning ${dir}`);
                rimraf.sync(path.resolve(process.cwd(), dir));
            } catch (_: unknown) {
                // File or directory did not exist, so we no-op
            }
        }
    };
}
