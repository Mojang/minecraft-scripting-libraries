// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { argv, series, task, watch, logger, TaskFunction, undertaker, option } from 'just-scripts';
import Undertaker from 'undertaker';

const WATCH_TASK_NAME = 'watch-task';

type WatchArgs = {
    watch?: boolean;
};

type UndertakerArgs = {
    name: string;
};

option('watch');

function executeTask(taskFunction: Undertaker.TaskFunction) {
    void taskFunction.call(undefined, () => {});
}

/**
 * If command line parameter `watch` is present, it watches for changes in the specified files and run the specified task.
 * Otherwise, just run the task.
 * @param globs The file globs to watch.
 * @param taskFunction The task to run when changes are detected.
 */
export function watchTask(globs: string | string[], taskFunction: TaskFunction): TaskFunction {
    return () => {
        const watchArgs = argv() as WatchArgs;
        if (!watchArgs.watch) {
            return taskFunction;
        }

        let taskInProgress = true;
        let pendingWork = false;

        const onFinished = (args: UndertakerArgs) => {
            if (args.name === WATCH_TASK_NAME) {
                if (pendingWork) {
                    logger.info('Processing pending changes...');
                    pendingWork = false;
                    executeTask(origTask);
                } else {
                    logger.info('Waiting for new changes...');
                    taskInProgress = false;
                }
            }
        };

        undertaker.on('start', function (args: UndertakerArgs) {
            if (args.name === WATCH_TASK_NAME) {
                taskInProgress = true;
            }
        });

        undertaker.on('stop', function (args: UndertakerArgs) {
            onFinished(args);
        });

        undertaker.on('error', function (args: UndertakerArgs) {
            onFinished(args);
        });

        task(WATCH_TASK_NAME, series(taskFunction));
        const origTask = series(WATCH_TASK_NAME);

        // Start execution.
        executeTask(origTask);

        watch(globs, () => {
            if (!taskInProgress) {
                executeTask(origTask);
            } else {
                pendingWork = true;
            }
        });
        return Promise.resolve();
    };
}
