// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { argv, series, task, watch, logger, TaskFunction, undertaker, option } from 'just-scripts';

const WATCH_TASK_NAME = 'watch-task';

option('watch');

/**
 * If command line parameter `option` is present, watch for changes in the specified files and run the specified task.
 * Otherwise, just run the task.
 * @param globs The file globs to watch.
 * @param taskFunction The task to run when changes are detected.
 */
export function watchTask(globs: string | string[], taskFunction: TaskFunction): TaskFunction {
    return () => {
        if (!argv().watch) {
            return taskFunction;
        }

        let taskInProgress = true;
        let pendingWork = false;

        const onFinished = (args: any) => {
            if (args.name === WATCH_TASK_NAME) {
                if (pendingWork) {
                    logger.info('Processing pending changes...');
                    pendingWork = false;
                    (origTask as any).call();
                } else {
                    logger.info('Waiting for new changes...');
                    taskInProgress = false;
                }
            }
        };

        undertaker.on('start', function (args: any) {
            if (args.name === WATCH_TASK_NAME) {
                taskInProgress = true;
            }
        });

        undertaker.on('stop', function (args: any) {
            onFinished(args);
        });

        undertaker.on('error', function (args: any) {
            onFinished(args);
        });

        task(WATCH_TASK_NAME, series(taskFunction));
        let origTask = series(WATCH_TASK_NAME);

        // Start execution.
        (origTask as any).call();

        watch(globs, () => {
            if (!taskInProgress) {
                (origTask as any).call();
            } else {
                pendingWork = true;
            }
        });
        return Promise.resolve();
    };
}
