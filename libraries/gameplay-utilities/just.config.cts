// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from 'child_process';
import { argv, series, task, tscTask } from 'just-scripts';
import {
    DEFAULT_CLEAN_DIRECTORIES,
    apiExtractorTask,
    cleanTask,
    coreLint,
    publishReleaseTask,
    vitestTask,
} from '@minecraft/core-build-tasks';
import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const isOnlyBuild = argv()._.findIndex(arg => arg === 'test') === -1;

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));

// Build
task('typescript', tscTask());
task('api-extractor-local', apiExtractorTask('./api-extractor.json', isOnlyBuild /* localBuild */));
task('bundle', () => {
    execSync(
        'npx esbuild ./lib/src/index.js --bundle --outfile=dist/minecraft-gameplay-utilities.js --format=esm --sourcemap --external:@minecraft/server'
    );
    // Copy over type definitions and rename
    const officialTypes = JSON.parse(readFileSync('./package.json', 'utf-8'))['types'];
    if (!officialTypes) {
        // Has the package.json been restructured?
        throw new Error('The package.json file does not contain a "types" field. Unable to copy types to bundle.');
    }
    const officialTypesPath = resolve(officialTypes);
    copyFileSync(officialTypesPath, './dist/minecraft-gameplay-utilities.d.ts');
});
task('build', series('typescript', 'api-extractor-local', 'bundle'));

// Test
task('api-extractor-validate', apiExtractorTask('./api-extractor.json', isOnlyBuild /* localBuild */));
task('vitest', vitestTask({ test: argv().test, update: argv().update }));
task('test', series('api-extractor-validate', 'vitest'));

// Clean
task('clean', cleanTask(DEFAULT_CLEAN_DIRECTORIES));

// Post-publish
task('postpublish', () => {
    return publishReleaseTask({
        repoOwner: 'Mojang',
        repoName: 'minecraft-scripting-libraries',
        message: 'See attached zip for pre-built minecraft-gameplay-utilities bundle with type declarations.',
    });
});
