// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Core Build Tasks just configuration is special in that it depends on the pre-build tasks in the src
// directory. Thus, for this case we allow imports from the lib directory, because the build-tools script
// is just a direct invocation of tsc and doesn't use just
import { argv, task } from 'just-scripts';
import { coreLint, cleanTask, vitestTask } from './lib';

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));

// Test
task('test', vitestTask({ test: argv().test, update: argv().update }));

// Cleans the actual code that is used for build. After running this, build-tools is needed
// to run any command in the workspace
task('clean-tools', cleanTask(['lib', 'lib-cjs', 'publish']));
