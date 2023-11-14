import { existsSync } from 'fs';
import type { TaskFunction } from 'just-scripts';
import { condition, eslintTask, prettierCheckTask, prettierTask, series, task } from 'just-scripts';
import path from 'path';
import process from 'process';

export function coreLint(files: string[], fix?: boolean): TaskFunction {
    task('verify-lint', () => {
        // If the process working directory does not have an `.eslintrc.js` file, fail the build
        const lintConfig = path.resolve(process.cwd(), '.eslintrc.js');
        if (!existsSync(lintConfig)) {
            throw new Error(`.eslintrc.js not found at ${lintConfig}.`);
        }
    });
    task('eslint', eslintTask({ files, fix }));
    task('prettier-fix', prettierTask({ files }));
    task('prettier-check', prettierCheckTask({ files }));

    return series(
        'verify-lint',
        'eslint',
        condition('prettier-check', () => !fix),
        condition('prettier-fix', () => !!fix),
    );
}
