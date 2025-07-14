// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    DEFAULT_CLEAN_DIRECTORIES,
    cleanTask,
    coreLint,
    publishReleaseTask,
    vitestTask,
} from '@minecraft/core-build-tasks';
import { execSync } from 'child_process';
import fs from 'fs';
import { argv, series, task, tscTask } from 'just-scripts';
import path from 'path';

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

// Package and upload release zip
task(
    'postpublish',
    series('package', () => {
        if (!fs.existsSync('./dist')) {
            throw new Error(
                `NPM tarball package has not not been generated, check './dist' and run 'npm run package' first.`
            );
        }
        const tarballPath = fs.readdirSync('./dist').filter(p => p.endsWith('.tgz'));
        if (tarballPath.length !== 1) {
            throw new Error(`Expected one NPM tarball package in './dist', found ${tarballPath.length}.`);
        }
        return publishReleaseTask({
            repoOwner: 'Mojang',
            repoName: 'minecraft-scripting-libraries',
            message: 'Core Minecraft API Docs Generator package for generating API markup and documentation',
            artifact: { path: path.resolve('./dist', tarballPath[0]), sourceFormat: 'archive' },
        });
    })
);
