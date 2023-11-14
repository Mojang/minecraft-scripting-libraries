import path from 'path';
import rimraf from 'rimraf';

export const DEFAULT_CLEAN_DIRECTORIES = ['temp', 'lib', 'dist'];

export function cleanTask(dirs: string[]) {
    return () => {
        for (const dir of dirs) {
            console.log(`Cleaning ${dir}`);
            rimraf(path.resolve(process.cwd(), dir), () => {
                // no-op on unable to clean
            });
        }
    };
}
