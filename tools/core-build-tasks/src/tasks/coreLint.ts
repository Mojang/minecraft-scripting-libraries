// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { TaskFunction, condition, logger, prettierCheckTask, prettierTask, series, task } from 'just-scripts';
import path from 'path';
import process from 'process';

const POSSIBLE_CONFIG_FILES = ['.eslintrc.js', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs'];

function getConfigFilePath(): string | undefined {
    for (const file of POSSIBLE_CONFIG_FILES) {
        const configPath = path.resolve(process.cwd(), file);
        if (existsSync(configPath)) {
            return configPath;
        }
    }

    return undefined;
}

export function eslintTask(files: string[], fix?: boolean): TaskFunction {
    return () => {
        const cmd = ['eslint', ...files, '--config', getConfigFilePath(), ...(fix ? ['--fix'] : []), '--color'].join(
            ' '
        );
        logger.info(`Running command: ${cmd}`);
        return execSync(cmd, { stdio: 'inherit' });
    };
}

export function coreLint(files: string[], fix?: boolean): TaskFunction {
    task('verify-lint', () => {
        // If the process working directory does not have an eslint configuration file, fail the build:
        // https://eslint.org/docs/latest/use/configure/configuration-files-new
        if (!getConfigFilePath()) {
            throw new Error(
                `ESLint config file not found at ${process.cwd()}. Possible values: [${POSSIBLE_CONFIG_FILES.join(
                    ', '
                )}]`
            );
        }
    });
    task('eslint', eslintTask(files, fix));
    task('prettier-fix', prettierTask({ files }));
    task('prettier-check', prettierCheckTask({ files }));

    return series(
        'verify-lint',
        'eslint',
        condition('prettier-check', () => !fix),
        condition('prettier-fix', () => !!fix)
    );
}
