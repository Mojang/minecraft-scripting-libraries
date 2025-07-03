// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { cleanTask, coreLint, DEFAULT_CLEAN_DIRECTORIES, vitestTask } from '@minecraft/core-build-tasks';
import { argv, series, task, tscTask } from 'just-scripts';

// Build
task('build-plugin', tscTask({ project: './tsconfig.plugin.json' }));
task('build-snapshots', tscTask({ project: './tsconfig.json' }));
task('build', series('build-plugin', 'build-snapshots'));

// Clean
task('clean', cleanTask(DEFAULT_CLEAN_DIRECTORIES));

// Lint
task('lint', coreLint(['test/*.ts', 'test/**/*.spec.ts', 'plugin/*.ts'], argv().fix));

// Test
task('test', vitestTask({ update: argv().update, test: argv().test }));
