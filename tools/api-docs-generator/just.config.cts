// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { DEFAULT_CLEAN_DIRECTORIES, cleanTask, coreLint, vitestTask } from '@minecraft/core-build-tasks';
import { execSync } from 'child_process';
import fs from 'fs';
import { argv, series, task, tscTask } from 'just-scripts';

// Build
task('build', tscTask());

// Clean
task('clean', cleanTask(DEFAULT_CLEAN_DIRECTORIES));

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));

// Test
task('test', vitestTask({ test: argv().test }));

// Package
task(
    'package',
    series('clean', 'build', () => {
        if (fs.existsSync('./dist')) {
            fs.rmSync('./dist', { recursive: true, force: true });
        }
        fs.mkdirSync('./dist');
        return execSync('npm pack --pack-destination ./dist');
    })
);
