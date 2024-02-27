// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { TaskFunction, condition, series, task } from 'just-scripts';
import { cleanTask } from './clean';
import { copyFiles, getTargetWorldPath } from './helpers';
import { FileSystem } from '@rushstack/node-core-library';
import path from 'path';

export type UpdateWorldParameters = {
    /**
     * The path to the world backup directory.
     */
    backupPath: string;

    /**
     * The path to the development world directory.
     */
    devWorldPath: string;
};

/**
 * A just task which updates the world in the game from the development path. Original world is backed up.
 */
export function updateWorldTask(params: UpdateWorldParameters): TaskFunction {
    const targetWorldPath = path.resolve(getTargetWorldPath());
    task('clean_localmc_world_backup', cleanTask([params.backupPath]));
    task('backup_localmc_world', () => copyFiles([targetWorldPath], params.backupPath));
    task('clean_localmc_world', cleanTask([targetWorldPath]));
    task('deploy_localmc_world', () => copyFiles([params.devWorldPath], targetWorldPath));
    return series(
        'clean_localmc_world_backup',
        condition('backup_localmc_world', () => FileSystem.exists(targetWorldPath)),
        'clean_localmc_world',
        'deploy_localmc_world'
    );
}
