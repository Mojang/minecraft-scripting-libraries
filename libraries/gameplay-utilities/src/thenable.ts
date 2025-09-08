// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * A promise's state which can be checked on the Thenable object's state function
 *
 * @public
 */
export enum PromiseState {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected',
}

/**
 * A generic promise-like object that can be used like a normal promise but
 * implement some additional functionality that promises do not have.
 *
 * @public
 */
export class Thenable<T> {
    private promiseState: PromiseState = PromiseState.PENDING;
    private dataValue?: unknown = undefined;
    private chainedPromise:
        | { onFulfilled: (value: T) => unknown; onRejected: (reason: unknown) => unknown }
        | undefined = undefined;

    /**
     * Rejects or fulfills a promise
     *
     * @param value - The data that will be passed to the next chained object
     * @param fulfilled - Whether or not the promise is being fulfilled (true) or rejected (false)
     */
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    private completePromise_ = (value: T | Thenable<unknown> | unknown, fulfilled: boolean) => {
        if (this.promiseState !== PromiseState.PENDING) {
            return;
        }

        // value is another promise, await
        if (
            value instanceof Thenable ||
            (typeof value === 'object' &&
                value !== undefined &&
                // eslint-disable-next-line unicorn/no-null
                value !== null &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                (value as any).then &&
                // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
                typeof (value as any).then === 'function')
        ) {
            return (value as Thenable<T>).then(
                (val: T) => {
                    this.fulfill(val);
                },
                (reason: unknown) => {
                    this.reject(reason);
                }
            );
        }

        this.dataValue = value;
        this.promiseState = fulfilled ? PromiseState.FULFILLED : PromiseState.REJECTED;
        if (this.chainedPromise) {
            if (fulfilled) {
                this.chainedPromise.onFulfilled(value as T);
            } else {
                this.chainedPromise.onRejected(value);
            }
        }
    };

    constructor(callback: (fulfill: (value: T) => void, reject: (reason: unknown) => void) => void) {
        try {
            callback(
                (value: T) => {
                    this.fulfill(value);
                },
                (reason: unknown) => {
                    this.reject(reason);
                }
            );
        } catch (error) {
            this.reject(error);
        }
    }

    /**
     * Fulfills the promise.
     *
     * @param value - The value to fulfill with.
     */
    fulfill(value: T | Thenable<unknown>) {
        this.completePromise_(value, true);
    }

    /**
     * Rejects the promise.
     *
     * @param error - The error to reject with.
     */
    reject(error: unknown) {
        this.completePromise_(error, false);
    }

    /**
     * Gets the current state of the promise.
     *
     * @returns The state of the promise.
     */
    state(): PromiseState {
        return this.promiseState;
    }

    /**
     * Constructs a new promise that will be chanined to execute after this promise is fulfilled or rejected.
     *
     * @param onFulfilled - Action to perform if the promise is fulfilled.
     * @param onRejected - Action to perform if the promise is rejected.
     * @returns A new promise.
     */
    then<U>(onFulfilled?: (val: T) => U, onRejected?: (reason: unknown) => unknown): Thenable<U> {
        return new Thenable((fulfill, reject) => {
            this.chainedPromise = {
                onFulfilled: function (value: T) {
                    if (!onFulfilled) {
                        fulfill(value as never);
                        return;
                    }

                    try {
                        fulfill(onFulfilled(value));
                    } catch (error) {
                        reject(error);
                    }
                },
                onRejected: function (value: unknown) {
                    if (!onRejected) {
                        reject(value);
                        return;
                    }

                    try {
                        fulfill(onRejected(value) as never);
                    } catch (error) {
                        reject(error);
                    }
                },
            };

            // if already resolved, just call the chained promise
            if (this.promiseState !== PromiseState.PENDING && this.chainedPromise) {
                if (this.promiseState === PromiseState.FULFILLED) {
                    this.chainedPromise.onFulfilled(this.dataValue as T);
                } else {
                    this.chainedPromise.onRejected(this.dataValue);
                }
            }
        });
    }

    /**
     * Similar to then, however only the rejection state is used.
     *
     * @param onRejected - Action to perform if the promise is rejected.
     * @returns A new promise.
     */
    catch(onRejected: (reason: unknown) => unknown) {
        return this.then(undefined, onRejected);
    }

    /**
     * Runs the provided function when the promise resolved, regardless if it was
     * fulfilled or rejected.
     *
     * @param onFinally - Action to perform if the promise is resolved.
     * @returns A new promise.
     */
    finally(onFinally: () => void) {
        return this.then(
            (value: T) => {
                onFinally();
                return value;
            },
            (error: unknown) => {
                onFinally();
                return error;
            }
        );
    }
}
