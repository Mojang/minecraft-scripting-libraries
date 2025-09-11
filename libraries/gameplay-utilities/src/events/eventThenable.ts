// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Thenable } from '../thenable.js';

/**
 * Interface representing the functions required to subscribe and unsubscribe to events.
 *
 * @public
 */
export interface EventSignal<T, U> {
    subscribe(closure: (event: T) => void, filter?: U): (event: T) => void;
    unsubscribe(closure: (event: T) => void): void;
}

/**
 * Helper to create a new EventThenable from an event signal.
 *
 * @public
 */
export function waitForNextEvent<T, U>(signal: EventSignal<T, U>, filter?: U) {
    return new EventThenable(signal, filter);
}

/**
 * A promise wrapper utility which returns a new promise that will resolve when the next
 * event is raised.
 *
 * @public
 */
export class EventThenable<T, U = undefined> extends Thenable<T | undefined> {
    private onCancel?: () => void;

    constructor(signal: EventSignal<T, U>, filter?: U) {
        let cancelFn: (() => void) | undefined = undefined;
        super((resolve, _) => {
            let sub: (event: T) => void;
            if (filter === undefined) {
                sub = signal.subscribe(event => {
                    this.onCancel = undefined;
                    signal.unsubscribe(sub);
                    resolve(event);
                });
            } else {
                sub = signal.subscribe(event => {
                    this.onCancel = undefined;
                    signal.unsubscribe(sub);
                    resolve(event);
                }, filter);
            }

            cancelFn = () => {
                signal.unsubscribe(sub);
                resolve(undefined);
            };
        });
        this.onCancel = cancelFn;
    }

    /**
     * Cancels the promise by resolving it with undefined and unsubscribing from the event signal.
     */
    cancel() {
        if (this.onCancel) {
            this.onCancel();
        }
    }
}
