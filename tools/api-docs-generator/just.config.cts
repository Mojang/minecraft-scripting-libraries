import {
    DEFAULT_CLEAN_DIRECTORIES,
    cleanTask,
    coreLint,
    publishReleaseTask,
    vitestTask,
} from '@minecraft/core-build-tasks';
import { execSync } from 'child_process';
import * as fs from 'fs';
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
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
        if (!packageJson?.description) {
            throw new Error('The package.json file does not contain a "description" field. Unable to create release.');
        }
        if (!fs.existsSync('./dist') || fs.readdirSync('./dist').length === 0) {
            throw new Error(
                'Packages to publish have not been generated, check "./dist" and run "npm run package" first.'
            );
        }
        return publishReleaseTask({
            repoOwner: 'Mojang',
            repoName: 'minecraft-scripting-libraries',
            message: packageJson.description,
        });
    })
);
