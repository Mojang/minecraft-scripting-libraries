import { cleanTask, coreLint, DEFAULT_CLEAN_DIRECTORIES } from '@minecraft/core-build-tasks';
import { argv, task, tscTask } from 'just-scripts';

// Build
task('build', tscTask());

// Clean
task('clean', cleanTask(DEFAULT_CLEAN_DIRECTORIES));

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));
