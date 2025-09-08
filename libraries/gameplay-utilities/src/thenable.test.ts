// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { assert, describe, expect, it } from 'vitest';
import { PromiseState, Thenable } from './thenable.js';

describe('Thenable', () => {
    it('successfully create thenable', () => {
        const t = new Thenable(() => {});
        expect(t.state()).toBe(PromiseState.PENDING);
    });

    it('successfully fulfill', () => {
        const t = new Thenable((res, _) => {
            res(undefined);
        });
        expect(t.state()).toBe(PromiseState.FULFILLED);
    });

    it('successfully reject', () => {
        const t = new Thenable((_, rej) => {
            rej(undefined);
        });
        t.catch(() => {});
        expect(t.state()).toBe(PromiseState.REJECTED);
    });

    it('successfully chain resolve', async () => {
        let finished = false;
        const t = new Thenable((res, _) => {
            res(12);
        })
            .then(val => {
                expect(val).toBe(12);
            })
            .catch(_ => {
                assert.fail('should not have rejected');
            })
            .finally(() => {
                finished = true;
            });
        await t;
        expect(finished).toBe(true);
    });

    it('successfully chain reject', async () => {
        let finished = false;
        const t = new Thenable((_, rej) => {
            rej('rejection');
        })
            .then(
                _ => {
                    assert.fail('should not have fulfilled');
                },
                reason => {
                    expect(reason).toBe('rejection');
                }
            )
            .finally(() => {
                finished = true;
            });
        await t;
        expect(finished).toBe(true);
    });

    it('successfully fulfill through external api', async () => {
        let resolved = false;
        const t = new Thenable(() => {});
        const t2 = t.then(val => {
            expect(val).toBe(9);
            resolved = true;
            return val;
        });
        t.fulfill(9);
        const v = await t2;
        expect(v).toBe(9);
        expect(resolved).toBe(true);
    });

    it('successfully reject through external api', async () => {
        let resolved = false;
        const t = new Thenable(() => {});
        const t2 = t.catch(reason => {
            expect(reason).toBe(9);
            resolved = true;
            return reason;
        });
        t.reject(9);
        const v = await t2;
        expect(v).toBe(9);
        expect(resolved).toBe(true);
    });
});
