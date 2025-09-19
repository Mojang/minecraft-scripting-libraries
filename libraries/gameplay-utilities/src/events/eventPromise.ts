// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { world, system } from '@minecraft/server';

/**
 * A promise wrapper utility which returns a new promise that will resolve when the next
 * event is raised.
 *
 * @public
 */
export interface EventPromise<T> extends Promise<T | undefined> {
    /**
     * Cancels the promise and unsubscribes from the event signal. Cancellation is done
     * by fulfilling with undefined.
     *
     * @public
     */
    cancel(): void;

    /**
     * Promise-like interface then.
     *
     * @param onfulfilled - Called if the promise fulfills
     * @param onrejected - Called if the promise rejects
     * @public
     */
    then<TFulfill = T | undefined, TReject = never>(
        onfulfilled?: ((value: T | undefined) => TFulfill | PromiseLike<TFulfill>) | null,
        onrejected?: ((reason: unknown) => TReject | PromiseLike<TReject>) | null
    ): Promise<TFulfill | TReject>;

    /**
     * Promise-like interface catch.
     *
     * @param onrejected - Called if the promise rejects
     * @public
     */
    catch<TReject = never>(
        onrejected?: ((reason: unknown) => TReject | PromiseLike<TReject>) | null
    ): Promise<T | undefined | TReject>;

    /**
     * Promise-like interface finally.
     *
     * @param onfinally - Called when the promise resolves
     * @public
     */
    finally(onfinally?: (() => void) | null): Promise<T | undefined>;
}

/**
 * The types of after event signals that exist in Minecraft's API that EventPromise can use.
 *
 * @public
 */
export type MinecraftAfterEventSignals =
    | (typeof world.afterEvents)[keyof typeof world.afterEvents]
    | (typeof system.afterEvents)[keyof typeof system.afterEvents];

/**
 * Helper to create a new EventPromise from an after event signal.
 *
 * @public
 */
export function nextEvent<U>(
    signal: MinecraftAfterEventSignals,
    filter?: U
): EventPromise<Parameters<Parameters<typeof signal.subscribe>[0]>[0]> {
    return new EventPromiseImpl<Parameters<Parameters<typeof signal.subscribe>[0]>[0], U>(signal, filter);
}

/**
 * A promise wrapper utility which returns a new promise that will resolve when the next
 * event is raised.
 *
 * @private
 */
class EventPromiseImpl<T, U> implements Promise<T | undefined> {
    [Symbol.toStringTag] = 'Promise';
    private promise: Promise<T | undefined>;
    private onCancel?: () => void;

    constructor(signal: MinecraftAfterEventSignals, filter?: U) {
        this.promise = new Promise<T | undefined>((resolve, _) => {
            if (signal === undefined || signal.subscribe === undefined || signal.unsubscribe === undefined) {
                resolve(undefined);
                return;
            }

            const sub = (event: T) => {
                this.onCancel = undefined;
                signal.unsubscribe(sub as never);
                resolve(event);
            };
            if (filter === undefined) {
                signal.subscribe(sub as never);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (signal.subscribe as (listener: (event: T) => void, filter: U) => (...a: any) => void)(sub, filter);
            }

            this.onCancel = () => {
                signal.unsubscribe(sub as never);
                resolve(undefined);
            };
        });
    }

    cancel() {
        this.onCancel?.();
    }

    then<TFulfill = T | undefined, TReject = never>(
        onfulfilled?: ((value: T | undefined) => TFulfill | PromiseLike<TFulfill>) | null,
        onrejected?: ((reason: unknown) => TReject | PromiseLike<TReject>) | null
    ): Promise<TFulfill | TReject> {
        return this.promise.then(onfulfilled, onrejected);
    }

    catch<TReject = never>(
        onrejected?: ((reason: unknown) => TReject | PromiseLike<TReject>) | null
    ): Promise<T | undefined | TReject> {
        return this.promise.catch(onrejected);
    }

    finally(onfinally?: (() => void) | null): Promise<T | undefined> {
        return this.promise.finally(onfinally);
    }
}
