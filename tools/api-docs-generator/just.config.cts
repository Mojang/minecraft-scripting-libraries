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
        execSync('npm pack --pack-destination ./dist');
    })
);

// Package and upload release zip
task(
    'postpublish',
    series('package', () => {
        return publishReleaseTask({
            repoOwner: 'Mojang',
            repoName: 'minecraft-scripting-libraries',
            artifact: { files: ['./dist'], sourceFormat: 'npm-tarball' },
        });
    })
);
