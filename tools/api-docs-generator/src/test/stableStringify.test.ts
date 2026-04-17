// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';
import { stableStringify } from '../utilities';

describe('stableStringify', () => {
    it('serializes primitives like JSON.stringify', () => {
        expect(stableStringify(42)).toBe('42');
        expect(stableStringify('hello')).toBe('"hello"');
        expect(stableStringify(true)).toBe('true');
        // eslint-disable-next-line unicorn/no-null
        expect(stableStringify(null)).toBe('null');
    });

    it('returns undefined for undefined input (matches JSON.stringify)', () => {
        expect(stableStringify(undefined)).toBe(undefined);
    });

    it('produces identical output for objects with keys in different insertion orders', () => {
        const a = { b: 1, a: 2, c: 3 };
        const b = { a: 2, c: 3, b: 1 };
        expect(stableStringify(a)).toBe(stableStringify(b));
    });

    it('sorts keys at every nesting level', () => {
        const value = {
            z: { y: 1, x: 2 },
            a: { c: { b: 1, a: 2 }, b: 3 },
        };
        expect(stableStringify(value)).toBe('{"a":{"b":3,"c":{"a":2,"b":1}},"z":{"x":2,"y":1}}');
    });

    it('preserves array element order', () => {
        expect(stableStringify([3, 1, 2])).toBe('[3,1,2]');
        expect(
            stableStringify([
                { b: 1, a: 2 },
                { d: 4, c: 3 },
            ])
        ).toBe('[{"a":2,"b":1},{"c":3,"d":4}]');
    });

    it('omits properties whose keys are listed in ignoredSubmembers', () => {
        const value = { a: 1, b: 2, c: 3 };
        expect(stableStringify(value, ['b'])).toBe('{"a":1,"c":3}');
    });

    it('omits ignored submember keys at any nesting depth', () => {
        const value = {
            keep: 1,
            drop: 'top',
            nested: { drop: 'inner', keep: 2 },
        };
        expect(stableStringify(value, ['drop'])).toBe('{"keep":1,"nested":{"keep":2}}');
    });

    it('treats an empty ignoredSubmembers list as no filtering', () => {
        const value = { a: 1, b: 2 };
        expect(stableStringify(value, [])).toBe(stableStringify(value));
    });

    it('produces equal output for semantically equal objects with different key order and ignored noise', () => {
        const a = { name: 'foo', debugId: 1, payload: { x: 1, y: 2 } };
        const b = { payload: { y: 2, x: 1 }, name: 'foo', debugId: 999 };
        expect(stableStringify(a, ['debugId'])).toBe(stableStringify(b, ['debugId']));
    });

    it('distinguishes objects that differ in values', () => {
        expect(stableStringify({ a: 1 })).not.toBe(stableStringify({ a: 2 }));
    });
});
