// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type { TaskFunction } from 'just-scripts';
import { condition, logger, series, task } from 'just-scripts';
import path from 'path';
import process from 'process';

const LEGACY_CONFIG_FILES = ['.eslintrc.js'];
const FLAT_CONFIG_FILES = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs'];
const POSSIBLE_CONFIG_FILES = [...LEGACY_CONFIG_FILES, ...FLAT_CONFIG_FILES];

function getConfigFilePath(): string | undefined {
    for (const file of POSSIBLE_CONFIG_FILES) {
        const configPath = path.resolve(process.cwd(), file);
        if (existsSync(configPath)) {
            return configPath;
        }
    }

    return undefined;
}

function eslintTask(fix?: boolean): TaskFunction {
    return () => {
        const configFilePath = getConfigFilePath();
        if (!configFilePath) {
            // No-op if the config file does not exist.
            return Promise.resolve();
        }

        // Setting ESLINT_USE_FLAT_CONFIG environment variable to indicate if the config file is flat or not.
        // ESLint is not able to determine the type in all the cases, so we need to help it.
        process.env['ESLINT_USE_FLAT_CONFIG'] = FLAT_CONFIG_FILES.some(file => configFilePath.endsWith(file))
            ? 'true'
            : 'false';

        const cmd = [
            'npx',
            'eslint',
            '.',
            '--config',
            `"${configFilePath}"`,
            ...(fix ? ['--fix'] : []),
            '--color',
        ].join(' ');
        logger.info(`Running command: ${cmd}`);
        return execSync(cmd, { stdio: 'inherit' });
    };
}

function prettierTask(files?: string[], fix?: boolean): TaskFunction {
    return () => {
        if (!files || files.length === 0) {
            // No-op if no files specified for prettier.
            return Promise.resolve();
        }

        const cmd = ['npx', 'prettier', fix ? '--write' : '--check', ...files].join(' ');
        return execSync(cmd, { stdio: 'inherit' });
    };
}

export function coreLint(prettierFiles?: string[], fix?: boolean): TaskFunction {
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
    task('eslint', eslintTask(fix));
    task('prettier', prettierTask(prettierFiles, fix));

    return series(
        'verify-lint',
        'eslint',
        condition('prettier', () => !!prettierFiles && prettierFiles.length > 0)
    );
}
