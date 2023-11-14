import { Vector3 } from '@minecraft/server';
import { describe, expect, it } from 'vitest';
import { add, clamp, cross, dot, equals, floor, magnitude, normalize, scale, subtract, toString } from './coreHelpers';

describe('Vector3 operations', () => {
    const v1: Vector3 = { x: 1, y: 2, z: 3 };
    const v2: Vector3 = { x: 4, y: 5, z: 6 };

    it('successfully compares vectors', () => {
        const v3: Vector3 = { x: 1, y: 2, z: 3 };
        expect(equals(v1, v3)).toBe(true);
        expect(equals(v1, v2)).toBe(false);
    });

    it('successfully adds vectors and returns a new vector', () => {
        const result: Vector3 = add(v1, v2);
        expect(result).toEqual({ x: 5, y: 7, z: 9 });
        expect(result).not.toBe(v1);
    });

    it('successfully subtracts vectors and returns a new vector', () => {
        const result: Vector3 = subtract(v1, v2);
        expect(result).toEqual({ x: -3, y: -3, z: -3 });
        expect(result).not.toBe(v1);
    });

    it('successfully scales a vector and returns a new vector', () => {
        const result: Vector3 = scale(v1, 2);
        expect(result).toEqual({ x: 2, y: 4, z: 6 });
        expect(result).not.toBe(v1);
    });

    it('successfully computes the dot product of a vector', () => {
        const result: number = dot(v1, v2);
        expect(result).toBe(32);
    });

    it('successfully computes the dot product of a vector with a 0 vector', () => {
        const result: number = dot(v1, { x: 0, y: 0, z: 0 });
        expect(result).toBe(0);
    });

    it('successfully computes the cross product of a vector and returns a new vector', () => {
        const result: Vector3 = cross(v1, v2);
        expect(result).toEqual({ x: -3, y: 6, z: -3 });
        expect(result).not.toBe(v1);
        expect(result).not.toBe(v2);
    });

    it('returns a zero vector for a cross product of parallel vectors', () => {
        const result: Vector3 = cross({ x: 3, y: 0, z: 0 }, { x: 7, y: 0, z: 0 });
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('returns a zero vector for a cross product of with a zero vector', () => {
        const result: Vector3 = cross(v1, { x: 0, y: 0, z: 0 });
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
        expect(result).not.toBe(v1);
    });

    it('returns the unit z vector for a cross product of unit x and unit y vectors', () => {
        const result: Vector3 = cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
        expect(result).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('calculates the magnitude', () => {
        const result: number = magnitude(v1);
        expect(result).toBeCloseTo(3.74, 2);
    });

    it('computes the floor of the vector', () => {
        const input: Vector3 = { x: 1.33, y: 2.14, z: 3.55 };
        const expected: Vector3 = { x: 1, y: 2, z: 3 };
        expect(floor(input)).toEqual(expected);
    });

    it('computes the floor of negative vectors', () => {
        const input: Vector3 = { x: -1.33, y: -2.14, z: -3.55 };
        const expected: Vector3 = { x: -2, y: -3, z: -4 };
        expect(floor(input)).toEqual(expected);
    });

    it('normalizes the vector', () => {
        const result: Vector3 = normalize(v1);
        expect(result.x).toBeCloseTo(0.27, 2);
        expect(result.y).toBeCloseTo(0.53, 2);
        expect(result.z).toBeCloseTo(0.8, 2);
    });

    it('converts a vector to a string with default options', () => {
        const vector: Vector3 = { x: 1, y: 2, z: 3 };
        const expectedString = '1.00, 2.00, 3.00';
        expect(toString(vector)).toBe(expectedString);
        expect(toString(vector, undefined)).toBe(expectedString);
        expect(toString(vector, { decimals: undefined, delimiter: undefined })).toBe(expectedString);
    });

    it('converts a vector to a string with overridden options', () => {
        const vector: Vector3 = { x: 1.23456789, y: 2.99, z: 3 };
        const expectedString1 = '1.2346|2.9900|3.0000'; // toFixed performs rounding
        expect(toString(vector, { decimals: 4, delimiter: '|' })).toBe(expectedString1);
        const expectedString2 = '1|3|3';
        expect(toString(vector, { decimals: 0, delimiter: '|' })).toBe(expectedString2);
        const expectedString3 = '1, 3, 3';
        expect(toString(vector, { decimals: 0 })).toBe(expectedString3);
        const expectedString4 = '1.23|2.99|3.00';
        expect(toString(vector, { delimiter: '|' })).toBe(expectedString4);
    });

    describe('clamp', () => {
        const v: Vector3 = { x: 1, y: 1, z: 3 };
        const minVec: Partial<Vector3> = { x: 0, y: 1.5 };
        const maxVec: Partial<Vector3> = { x: 2, z: 2.5 };

        it('clamps with defaults (no min or max)', () => {
            const result: Vector3 = clamp(v);
            expect(result).toEqual({ x: 1, y: 1, z: 3 });
        });

        it('clamps properly with both min and max', () => {
            const result: Vector3 = clamp(v, { min: minVec, max: maxVec });
            expect(result).toEqual({ x: 1, y: 1.5, z: 2.5 });
        });

        it('clamps with min only', () => {
            const result: Vector3 = clamp(v, { min: minVec });
            expect(result).toEqual({ x: 1, y: 1.5, z: 3 });
        });

        it('clamps with max only', () => {
            const result: Vector3 = clamp(v, { max: maxVec });
            expect(result).toEqual({ x: 1, y: 1, z: 2.5 });
        });

        it('clamp with zero vector and positive mins and negative max', () => {
            const vZero: Vector3 = { x: 0, y: 0, z: 0 };
            const min: Partial<Vector3> = { y: 1.5 };
            const max: Partial<Vector3> = { z: -2.5 };
            const result: Vector3 = clamp(vZero, { min, max });
            expect(result).toEqual({ x: 0, y: 1.5, z: -2.5 });
        });

        // Test clamp function with large vector
        const vLarge: Vector3 = { x: 1e6, y: 1e6, z: 1e6 };
        it('clamp with large vector', () => {
            const result: Vector3 = clamp(vLarge, { min: minVec, max: maxVec });
            expect(result).toEqual({ x: 2, y: 1e6, z: 2.5 });
        });
    });
});
