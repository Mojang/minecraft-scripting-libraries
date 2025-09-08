// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { assert, describe, expect, it } from 'vitest';
import { EventThenable } from './eventThenable.js';
import { PromiseState } from '../thenable.js';

describe('EventThenable', () => {
    class Event {
        num: number = 0;
    }

    describe('Non-Filtering Signals', () => {
        class Signal {
            public closure_: ((e: Event) => void) | undefined = undefined;

            public sendEvent(e: Event) {
                if (this.closure_ !== undefined) {
                    this.closure_(e);
                }
            }

            public subscribe(closure: (e: Event) => void) {
                this.closure_ = closure;
                return closure;
            }

            public unsubscribe(_: (e: Event) => void) {
                this.closure_ = undefined;
            }
        }
        const signal = new Signal();

        it('successfully resolve event', () => {
            const e = new EventThenable(signal);
            assert(signal.closure_ !== undefined);
            signal.sendEvent({ num: 4 });
            expect(e.state()).toBe(PromiseState.FULFILLED);
        });

        it('successfully use then on an EventThenable', () => {
            new EventThenable(signal).then((event?: Event) => {
                assert(event !== undefined);
                expect(event.num).toBe(5);
            });
            signal.sendEvent({ num: 5 });
        });

        it('successfully cancel an EventThenable', () => {
            const e = new EventThenable(signal);
            e.then((event?: Event) => {
                assert(event === undefined);
            });
            e.cancel();
            expect(e.state()).toBe(PromiseState.FULFILLED);
        });
    });

    describe('Filterable Signals', () => {
        class EventFilters {
            public someFilterValue: number = 0;
        }

        class Signal {
            public closure_: ((e: Event) => void) | undefined = undefined;
            public filters_: EventFilters | undefined = undefined;

            public sendEvent(e: Event) {
                if (this.closure_ !== undefined) {
                    this.closure_(e);
                }
            }

            public subscribe(closure: (e: Event) => void, options?: EventFilters) {
                this.closure_ = closure;
                this.filters_ = options;
                return closure;
            }

            public unsubscribe(_: (e: Event) => void) {
                this.closure_ = undefined;
            }
        }
        const signal = new Signal();

        // checking that the filters are being passed through to the signal properly
        it('successfully create EventThenable with filtered signal with filter', () => {
            const e = new EventThenable(signal, { someFilterValue: 18 });
            assert(signal.filters_ !== undefined);
            expect(signal.filters_.someFilterValue).toBe(18);
            signal.sendEvent({ num: 4 });
            expect(e.state()).toBe(PromiseState.FULFILLED);
        });

        it('successfully create EventThenable with filtered signal with no filter', () => {
            const e = new EventThenable(signal);
            assert(signal.filters_ === undefined);
            signal.sendEvent({ num: 4 });
            expect(e.state()).toBe(PromiseState.FULFILLED);
        });
    });
});
