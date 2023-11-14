import { execSync } from 'child_process';
import { argv, series, task, tscTask } from 'just-scripts';
import { apiExtractorTask, cleanTask, coreLint, vitestTask } from '@minecraft/core-build-tasks';

const isOnlyBuild = argv()._.findIndex(arg => arg === 'test') === -1;

// Lint
task('lint', coreLint(['src/**/*.ts'], argv().fix));

// Build
task('typescript', tscTask());
task('api-extractor-local', apiExtractorTask('./api-extractor.json', isOnlyBuild /* localBuild */));
task('bundle', () => {
    execSync(
        'npx esbuild ./lib/index.js --bundle --outfile=dist/minecraft-math.js --format=esm --sourcemap --external:@minecraft/server',
    );
});
task('build', series('typescript', 'api-extractor-local', 'bundle'));

// Test
task('api-extractor-validate', apiExtractorTask('./api-extractor.json', isOnlyBuild /* localBuild */));
task('vitest', vitestTask());
task('test', series('api-extractor-validate', 'vitest'));

// Clean
task('clean', cleanTask([]));
