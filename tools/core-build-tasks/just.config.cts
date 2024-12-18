import { argv, task, tscTask } from 'just-scripts';
import { cleanTask } from './src/tasks/clean';
import { coreLint } from './src/tasks/coreLint';
import { vitestTask } from './src/tasks/vitest';

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));

// Build
task('build-tools', tscTask());

// Test
task('test', vitestTask());

// Cleans the actual code that is used for build. After running this, build-tools is needed
// to run any command in the workspace
task('clean-tools', cleanTask(['lib', 'publish']));
