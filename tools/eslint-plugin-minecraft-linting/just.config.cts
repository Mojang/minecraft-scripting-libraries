import { cleanTask, coreLint, DEFAULT_CLEAN_DIRECTORIES, vitestTask } from '@minecraft/core-build-tasks';
import { argv, series, task, tscTask } from 'just-scripts';

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));

// Build
task('typescript', tscTask());
task('build', series('typescript'));

// Test
task('vitest', vitestTask());
task('test', series('vitest'));

// Clean
task('clean', cleanTask(DEFAULT_CLEAN_DIRECTORIES));
