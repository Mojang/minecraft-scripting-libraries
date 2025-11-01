// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SystemAfterEvents, WorldAfterEvents } from '@minecraft/server';

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
 * The keys of after event signals that exist in Minecraft's API that EventPromise can use.
 *
 * @public
 */
export type MinecraftAfterEventSignalKeys = keyof WorldAfterEvents | keyof SystemAfterEvents;
/**
 * The types of after event signals that exist in Minecraft's API that EventPromise can use.
 *
 * @public
 */
export type MinecraftAfterEventSignals<K extends MinecraftAfterEventSignalKeys> = K extends keyof WorldAfterEvents
    ? WorldAfterEvents[K]
    : K extends keyof SystemAfterEvents
      ? SystemAfterEvents[K]
      : never;

/**
 * Helper to create a new EventPromise from an after event signal.
 *
 * @public
 */
export function nextEvent<T extends MinecraftAfterEventSignals<MinecraftAfterEventSignalKeys>>(
    signal: T,
    filter?: Parameters<T['subscribe']>[1]
): EventPromise<Parameters<ReturnType<T['subscribe']>>[0]> {
    return new EventPromiseImpl(signal, filter);
}

/**
 * A promise wrapper utility which returns a new promise that will resolve when the next
 * event is raised.
 *
 * @private
 */
class EventPromiseImpl<
    K extends MinecraftAfterEventSignalKeys,
    Signal extends MinecraftAfterEventSignals<K>,
    T = Parameters<ReturnType<Signal['subscribe']>>[0],
    U = Parameters<Signal['subscribe']>[1],
> implements EventPromise<T | undefined>
{
    [Symbol.toStringTag] = 'Promise';
    private promise: Promise<T | undefined>;
    private onCancel?: () => void;

    constructor(signal: Signal, filter?: U) {
        this.promise = new Promise<T | undefined>((resolve, _) => {
            if (signal === undefined || signal.subscribe === undefined || signal.unsubscribe === undefined) {
                resolve(undefined);
                return;
            }

            const sub = (event: Parameters<ReturnType<Signal['subscribe']>>[0]) => {
                this.onCancel = undefined;
                signal.unsubscribe(sub);
                resolve(event as T);
            };
            if (filter === undefined) {
                signal.subscribe(sub);
            } else {
                (signal.subscribe as (handler: Parameters<Signal['subscribe']>[0], filter: U) => void)(sub, filter);
            }

            this.onCancel = () => {
                signal.unsubscribe(sub);
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
