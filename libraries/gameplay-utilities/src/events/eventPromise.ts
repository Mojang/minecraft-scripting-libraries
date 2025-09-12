// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { world, system } from '@minecraft/server';

/**
 * A promise wrapper utility which returns a new promise that will resolve when the next
 * event is raised.
 * 
 * @public
 */
export interface EventPromise {
    /**
     * Cancels the promise and unsubscribes from the event signal. Cancellation is done
     * by fulfilling with undefined.
     * 
     * @public
     */
    cancel(): void;
}

/**
 * Helper to create a new EventPromise from an after event signal.
 *
 * @public
 */
export function nextEvent<U>(signal: (typeof world.afterEvents[keyof typeof world.afterEvents]) | (typeof system.afterEvents[keyof typeof system.afterEvents]), filter?: U) : EventPromise {
    return new EventPromiseImpl(signal, filter);
}

/**
 * A promise wrapper utility which returns a new promise that will resolve when the next
 * event is raised.
 *
 * @private
 */
class EventPromiseImpl<T, U = undefined> extends Promise<T | undefined> {
    private onCancel?: () => void;

    constructor(signal: typeof world.afterEvents[keyof typeof world.afterEvents], filter?: U) {
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
        this.onCancel?.();
    }
}
