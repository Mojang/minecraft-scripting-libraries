// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Vector3 } from '@minecraft/server';
import { describe, expect, it } from 'vitest';
import { VECTOR2_ZERO, Vector2Utils, VECTOR3_ZERO, Vector3Utils } from './coreHelpers.js';
import { Vector2Builder, Vector3Builder } from './vectorWrapper.js';

/**
 * Underlying functionality is validated by coreHelpers tests, primary concern here is consistency of results
 * between the two implementations
 */
describe('Vector3Builder', () => {
    it('should be able to be constructed from a Vector3 or three nunmbers', () => {
        const vectorA = new Vector3Builder({ x: 1, y: 2, z: 3 });
        const vectorB = new Vector3Builder(1, 2, 3);
        expect(vectorA.x).toBe(1);
        expect(vectorA.y).toBe(2);
        expect(vectorA.z).toBe(3);
        expect(vectorA).toEqual(vectorB);
    });

    it('should be able to assign a Vector3', () => {
        const vector = new Vector3Builder(1, 2, 3);
        const updated = vector.assign({ x: 4, y: 5, z: 6 });
        expect(updated.x).toBe(4);
        expect(updated.y).toBe(5);
        expect(updated.z).toBe(6);
        expect(updated).toBe(vector); // Referential equality must be preserved
    });

    it('should be able to check equality with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = new Vector3Builder(1, 2, 3);
        const vectorC = new Vector3Builder(4, 5, 6);

        expect(vectorA.equals(vectorB)).toBe(Vector3Utils.equals(vectorA, vectorB));
        expect(vectorA.equals(vectorC)).toBe(Vector3Utils.equals(vectorA, vectorC));
    });

    it('should be able to add a vector3 with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = new Vector3Builder(4, 5, 6);
        const vectorC = Vector3Utils.add(vectorA, vectorB);

        const result = vectorA.add(vectorB);
        expect(result).toEqual(vectorC);
        expect(vectorA).toBe(result); // Referential equality must be preserved

        // Subsequent chained adds should work as expected
        const toAdd: Vector3 = { x: 1, y: 1, z: 1 };
        const resultTwo = vectorA.add(toAdd).add(toAdd).add(toAdd);
        expect(resultTwo).toEqual({ x: 8, y: 10, z: 12 });
        expect(resultTwo).toBe(vectorA); // Referential equality must be preserved
    });

    it('should be able to add a partial vector3 with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB: Partial<Vector3> = { x: 4, z: 6 };
        const vectorC = Vector3Utils.add(vectorA, vectorB);

        const result = vectorA.add(vectorB);
        expect(result).toEqual(vectorC);
        expect(vectorA).toBe(result); // Referential equality must be preserved
    });

    it('should be able to subtract a vector3 with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 7, 9);
        const vectorB = new Vector3Builder(4, 5, 6);
        const vectorC = Vector3Utils.subtract(vectorA, vectorB);

        const result = vectorA.subtract(vectorB);
        expect(result).toEqual(vectorC);
        expect(vectorA).toBe(result); // Referential equality must be preserved

        // Subsequent chained subtracts should work as expected
        const toSubtract: Vector3 = { x: 1, y: 1, z: 1 };
        const resultTwo = vectorA.subtract(toSubtract).subtract(toSubtract).subtract(toSubtract);
        expect(resultTwo).toEqual({ x: -2, y: -1, z: 0 });
        expect(resultTwo).toBe(vectorA); // Referential equality must be preserved
    });

    it('should be able to subtract a partial vector3 with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB: Partial<Vector3> = { x: 4, z: 6 };
        const vectorC = Vector3Utils.subtract(vectorA, vectorB);

        const result = vectorA.subtract(vectorB);
        expect(result).toEqual(vectorC);
        expect(vectorA).toBe(result); // Referential equality must be preserved
    });

    it('should be able to scale a vector3 with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = Vector3Utils.scale(vectorA, 3);

        const result = vectorA.scale(3);
        expect(result).toEqual(vectorB);
        expect(vectorA).toBe(result); // Referential equality must be preserved

        // Subsequent chained subtracts should work as expected
        const resultTwo = vectorA.scale(3).scale(3);
        expect(resultTwo).toEqual({ x: 27, y: 54, z: 81 });
        expect(resultTwo).toBe(vectorA); // Referential equality must be preserved
    });

    it('should be able to compute the dot product with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = new Vector3Builder(4, 5, 6);
        const dotProduct = Vector3Utils.dot(vectorA, vectorB);

        const result = vectorA.dot(vectorB);
        expect(result).toEqual(dotProduct);
    });

    it('should be able to compute the cross product with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = new Vector3Builder(4, 5, 6);
        const vectorC = Vector3Utils.cross(vectorA, vectorB);

        const result = vectorA.cross(vectorB);
        expect(result).toEqual(vectorC);
        expect(vectorA).toBe(result); // Referential equality must be preserved

        // Subsequent chained subtracts should work as expected
        const toCross: Vector3 = { x: 1, y: 1, z: 1 };
        const resultTwo = vectorA.cross(toCross).cross(toCross);
        expect(resultTwo).toEqual({ x: 9, y: -18, z: 9 });
        expect(resultTwo).toBe(vectorA); // Referential equality must be preserved
    });

    it('should be able to compute the magnitude with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const mag = Vector3Utils.magnitude(vectorA);

        expect(vectorA.magnitude()).toEqual(mag);
    });

    it('should be able to compute the distance between two vectors with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = new Vector3Builder(4, 5, 6);
        const mag = Vector3Utils.distance(vectorA, vectorB);

        expect(vectorA.distance(vectorB)).toEqual(mag);
    });

    it('should be able to normalize the vector with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const vectorB = Vector3Utils.normalize(vectorA);

        const result = vectorA.normalize();
        expect(result).toEqual(vectorB);
        expect(vectorA).toBe(result); // Referential equality must be preserved
    });

    it('should be able to compute the floor of the vector with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1.33, 2.14, 3.55);
        const vectorB = Vector3Utils.floor(vectorA);

        const result = vectorA.floor();
        expect(result).toEqual(vectorB);
        expect(vectorA).toBe(result); // Referential equality must be preserved
    });

    it('should be able to clamp the vector with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1, 2, 3);
        const minVec: Partial<Vector3> = { x: 0, y: 1.5 };
        const maxVec: Partial<Vector3> = { x: 2, z: 2.5 };
        const vectorB = Vector3Utils.clamp(vectorA, { min: minVec, max: maxVec });

        const result = vectorA.clamp({ min: minVec, max: maxVec });
        expect(result).toEqual(vectorB);
        expect(vectorA).toBe(result); // Referential equality must be preserved
    });

    it('should be able to compute a string representation of the vector with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(1.33, 2.14, 3.55);
        const vectorB = Vector3Utils.toString(vectorA, { decimals: 1, delimiter: ' ' });

        const result = vectorA.toString({ decimals: 1, delimiter: ' ' });
        expect(result).toEqual(vectorB);
    });

    it('should be able to compute a string representation of the vector with the same result as the coreHelpers function using a string', () => {
        const regular = '1.33, 2.14, 3.55';
        const alternateDelimiter = '1.33+2.14+3.55';
        const vectorBuilderA = new Vector3Builder(regular);
        const vectorBuilderB = new Vector3Builder(alternateDelimiter, '+');

        const vectorA = Vector3Utils.fromString(regular);
        const vectorB = Vector3Utils.fromString(alternateDelimiter, '+');

        expect(vectorBuilderA).toEqual(vectorA);
        expect(vectorBuilderB).toEqual(vectorB);
    });

    it('makes a 0 vector for invalid string', () => {
        const regular = '1.33, sdfg, 3.55';
        expect(new Vector3Builder(regular)).toEqual(VECTOR3_ZERO);
    });

    it('should be able compute the lerp halfway between two vectors with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 6, 3);
        const vectorB = new Vector3Builder(4, 2, 6);
        const ratio: number = 0.4;
        const resultA = Vector3Utils.lerp(vectorA, vectorB, ratio);

        const resultB = vectorA.lerp(vectorB, ratio);
        expect(resultA).toEqual(resultB);
    });

    it('should be able compute the slerp halfway between two vectors with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 6, 3);
        const vectorB = new Vector3Builder(4, 2, 6);
        const ratio: number = 0.4;
        const resultA = Vector3Utils.slerp(vectorA, vectorB, ratio);

        const resultB = vectorA.slerp(vectorB, ratio);
        expect(resultA).toEqual(resultB);
    });

    it('should be able to multiply with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 6, 3);
        const vectorB = new Vector3Builder(4, 2, 6);

        const resultA = Vector3Utils.multiply(vectorA, vectorB);

        const resultB = vectorA.multiply(vectorB);
        expect(resultA).toEqual(resultB);
    });

    it('should be able to rotate over x with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 6, 3);
        const angle = Math.PI / 2;

        const resultA = Vector3Utils.rotateX(vectorA, angle);

        const resultB = vectorA.rotateX(angle);
        expect(resultA).toEqual(resultB);
    });

    it('should be able to rotate over y with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 6, 3);
        const angle = Math.PI / 2;

        const resultA = Vector3Utils.rotateY(vectorA, angle);

        const resultB = vectorA.rotateY(angle);
        expect(resultA).toEqual(resultB);
    });

    it('should be able to rotate over z with the same result as the coreHelpers function', () => {
        const vectorA = new Vector3Builder(5, 6, 3);
        const angle = Math.PI / 2;

        const resultA = Vector3Utils.rotateZ(vectorA, angle);

        const resultB = vectorA.rotateZ(angle);
        expect(resultA).toEqual(resultB);
    });
});

describe('Vector2Builder', () => {
    it('should be able to compute a string representation of the vector with the same result as the coreHelpers function', () => {
        const vectorA = new Vector2Builder(1.33, 2.14);
        const vectorB = Vector2Utils.toString(vectorA, { decimals: 1, delimiter: ' ' });

        const result = vectorA.toString({ decimals: 1, delimiter: ' ' });
        expect(result).toEqual(vectorB);
    });

    it('should be able to compute a string representation of the vector with the same result as the coreHelpers function using a string', () => {
        const regular = '1.33, 2.14';
        const alternateDelimiter = '1.33+2.14';
        const vectorBuilderA = new Vector2Builder(regular);
        const vectorBuilderB = new Vector2Builder(alternateDelimiter, '+');

        const vectorA = Vector2Utils.fromString(regular);
        const vectorB = Vector2Utils.fromString(alternateDelimiter, '+');

        expect(vectorBuilderA).toEqual(vectorA);
        expect(vectorBuilderB).toEqual(vectorB);
    });

    it('makes a 0 vector for invalid string', () => {
        const regular = '1.33, sdfg';
        expect(new Vector2Builder(regular)).toEqual(VECTOR2_ZERO);
    });
});
