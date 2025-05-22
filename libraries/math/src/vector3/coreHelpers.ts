// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Vector2, Vector3 } from '@minecraft/server';
import { clampNumber } from '../general/clamp.js';

/**
 * Utilities operating on Vector3 objects. All methods are static and do not modify the input objects.
 *
 * @public
 */
export class Vector3Utils {
    /**
     * equals
     *
     * Check the equality of two vectors
     */
    static equals(v1: Vector3, v2: Vector3): boolean {
        return v1.x === v2.x && v1.y === v2.y && v1.z === v2.z;
    }

    /**
     * add
     *
     * Add two vectors to produce a new vector
     */
    static add(v1: Vector3, v2: Partial<Vector3>): Vector3 {
        return { x: v1.x + (v2.x ?? 0), y: v1.y + (v2.y ?? 0), z: v1.z + (v2.z ?? 0) };
    }

    /**
     * subtract
     *
     * Subtract two vectors to produce a new vector (v1-v2)
     */
    static subtract(v1: Vector3, v2: Partial<Vector3>): Vector3 {
        return { x: v1.x - (v2.x ?? 0), y: v1.y - (v2.y ?? 0), z: v1.z - (v2.z ?? 0) };
    }

    /** scale
     *
     * Multiple all entries in a vector by a single scalar value producing a new vector
     */
    static scale(v1: Vector3, scale: number): Vector3 {
        return { x: v1.x * scale, y: v1.y * scale, z: v1.z * scale };
    }

    /**
     * dot
     *
     * Calculate the dot product of two vectors
     */
    static dot(a: Vector3, b: Vector3): number {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }

    /**
     * cross
     *
     * Calculate the cross product of two vectors. Returns a new vector.
     */
    static cross(a: Vector3, b: Vector3): Vector3 {
        return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
    }

    /**
     * magnitude
     *
     * The magnitude of a vector
     */
    static magnitude(v: Vector3): number {
        return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
    }

    /**
     * distance
     *
     * Calculate the distance between two vectors
     */
    static distance(a: Vector3, b: Vector3): number {
        return Vector3Utils.magnitude(Vector3Utils.subtract(a, b));
    }

    /**
     * normalize
     *
     * Takes a vector 3 and normalizes it to a unit vector
     */
    static normalize(v: Vector3): Vector3 {
        const mag = Vector3Utils.magnitude(v);
        return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
    }

    /**
     * floor
     *
     * Floor the components of a vector to produce a new vector
     */
    static floor(v: Vector3): Vector3 {
        return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
    }

    /**
     * toString
     *
     * Create a string representation of a vector3
     */
    static toString(v: Vector3, options?: { decimals?: number; delimiter?: string }): string {
        const decimals = options?.decimals ?? 2;
        const str: string[] = [v.x.toFixed(decimals), v.y.toFixed(decimals), v.z.toFixed(decimals)];
        return str.join(options?.delimiter ?? ', ');
    }

    /**
     * fromString
     *
     * Gets a Vector3 from the string representation produced by {@link Vector3Utils.toString}. If any numeric value is not a number
     * or the format is invalid, undefined is returned.
     * @param str - The string to parse
     * @param delimiter - The delimiter used to separate the components. Defaults to the same as the default for {@link Vector3Utils.toString}
     */
    static fromString(str: string, delimiter: string = ','): Vector3 | undefined {
        const parts = str.split(delimiter);
        if (parts.length !== 3) {
            return undefined;
        }

        const output = parts.map(part => parseFloat(part));
        if (output.some(part => isNaN(part))) {
            return undefined;
        }
        return { x: output[0], y: output[1], z: output[2] };
    }

    /**
     * clamp
     *
     * Clamps the components of a vector to limits to produce a new vector
     */
    static clamp(v: Vector3, limits?: { min?: Partial<Vector3>; max?: Partial<Vector3> }): Vector3 {
        return {
            x: clampNumber(v.x, limits?.min?.x ?? Number.MIN_SAFE_INTEGER, limits?.max?.x ?? Number.MAX_SAFE_INTEGER),
            y: clampNumber(v.y, limits?.min?.y ?? Number.MIN_SAFE_INTEGER, limits?.max?.y ?? Number.MAX_SAFE_INTEGER),
            z: clampNumber(v.z, limits?.min?.z ?? Number.MIN_SAFE_INTEGER, limits?.max?.z ?? Number.MAX_SAFE_INTEGER),
        };
    }

    /**
     * lerp
     *
     * Constructs a new vector using linear interpolation on each component from two vectors.
     */
    static lerp(a: Vector3, b: Vector3, t: number): Vector3 {
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
    }

    /**
     * slerp
     *
     * Constructs a new vector using spherical linear interpolation on each component from two vectors.
     */
    static slerp(a: Vector3, b: Vector3, t: number): Vector3 {
        const theta = Math.acos(Vector3Utils.dot(a, b));
        const sinTheta = Math.sin(theta);
        const ta = Math.sin((1.0 - t) * theta) / sinTheta;
        const tb = Math.sin(t * theta) / sinTheta;
        return Vector3Utils.add(Vector3Utils.scale(a, ta), Vector3Utils.scale(b, tb));
    }

    /**
     * multiply
     *
     * Element-wise multiplication of two vectors together.
     * Not to be confused with {@link Vector3Utils.dot} product or {@link Vector3Utils.cross} product
     */
    static multiply(a: Vector3, b: Vector3): Vector3 {
        return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
    }

    /**
     * rotateX
     *
     * Rotates the vector around the x axis counterclockwise (left hand rule)
     * @param a - Angle in radians
     */
    static rotateX(v: Vector3, a: number): Vector3 {
        let cos = Math.cos(a);
        let sin = Math.sin(a);
        return { x: v.x, y: v.y * cos - v.z * sin, z: v.z * cos + v.y * sin };
    }

    /**
     * rotateY
     *
     * Rotates the vector around the y axis counterclockwise (left hand rule)
     * @param a - Angle in radians
     */
    static rotateY(v: Vector3, a: number): Vector3 {
        let cos = Math.cos(a);
        let sin = Math.sin(a);
        return { x: v.x * cos + v.z * sin, y: v.y, z: v.z * cos - v.x * sin };
    }

    /**
     * rotateZ
     *
     * Rotates the vector around the z axis counterclockwise (left hand rule)
     * @param a - Angle in radians
     */
    static rotateZ(v: Vector3, a: number): Vector3 {
        let cos = Math.cos(a);
        let sin = Math.sin(a);
        return { x: v.x * cos - v.y * sin, y: v.y * cos + v.x * sin, z: v.z };
    }
}

/**
 * Utilities operating on Vector2 objects. All methods are static and do not modify the input objects.
 *
 * @public
 */
export class Vector2Utils {
    /**
     * toString
     *
     * Create a string representation of a vector2
     */
    static toString(v: Vector2, options?: { decimals?: number; delimiter?: string }): string {
        const decimals = options?.decimals ?? 2;
        const str: string[] = [v.x.toFixed(decimals), v.y.toFixed(decimals)];
        return str.join(options?.delimiter ?? ', ');
    }

    /**
     * fromString
     *
     * Gets a Vector2 from the string representation produced by {@link Vector3Utils.toString}. If any numeric value is not a number
     * or the format is invalid, undefined is returned.
     * @param str - The string to parse
     * @param delimiter - The delimiter used to separate the components. Defaults to the same as the default for {@link Vector3Utils.toString}
     */
    static fromString(str: string, delimiter: string = ','): Vector2 | undefined {
        const parts = str.split(delimiter);
        if (parts.length !== 2) {
            return undefined;
        }

        const output = parts.map(part => parseFloat(part));
        if (output.some(part => isNaN(part))) {
            return undefined;
        }
        return { x: output[0], y: output[1] };
    }
}

/**
 * up
 *
 * A unit vector representing the world UP direction (0,1,0)
 *
 * @public
 */
export const VECTOR3_UP: Vector3 = { x: 0, y: 1, z: 0 };
/**
 * down
 *
 * A unit vector representing the world DOWN direction (0,-1,0)
 *
 * @public
 */
export const VECTOR3_DOWN: Vector3 = { x: 0, y: -1, z: 0 };
/**
 * left
 *
 * A unit vector representing the world LEFT direction (-1,0,0)
 *
 * @public
 */
export const VECTOR3_LEFT: Vector3 = { x: -1, y: 0, z: 0 };
/**
 * right
 *
 * A unit vector representing the world RIGHT direction (1,0,0)
 *
 * @public
 */
export const VECTOR3_RIGHT: Vector3 = { x: 1, y: 0, z: 0 };
/**
 * forward
 *
 * A unit vector representing the world FORWARD direction (0,0,1)
 *
 * @public
 */
export const VECTOR3_FORWARD: Vector3 = { x: 0, y: 0, z: 1 };
/**
 * back
 *
 * A unit vector representing the world BACK direction (0,0,-1)
 *
 * @public
 */
export const VECTOR3_BACK: Vector3 = { x: 0, y: 0, z: -1 };
/**
 * one
 *
 * A unit vector representing the value of 1 in all directions (1,1,1)
 *
 * @public
 */
export const VECTOR3_ONE: Vector3 = { x: 1, y: 1, z: 1 };
/**
 * zero
 *
 * A unit vector representing the value of 0 in all directions (0,0,0)
 *
 * @public
 */
export const VECTOR3_ZERO: Vector3 = { x: 0, y: 0, z: 0 };
/**
 * west
 *
 * A unit vector representing the world WEST direction (-1,0,0)
 *   (same as LEFT)
 *
 * @public
 */
export const VECTOR3_WEST: Vector3 = { x: -1, y: 0, z: 0 };
/**
 * east
 *
 * A unit vector representing the world EAST direction (-1,0,0)
 *   (same as RIGHT)
 *
 * @public
 */
export const VECTOR3_EAST: Vector3 = { x: 1, y: 0, z: 0 };
/**
 * north
 *
 * A unit vector representing the world NORTH direction (-1,0,0)
 *   (same as FORWARD)
 *
 * @public
 */
export const VECTOR3_NORTH: Vector3 = { x: 0, y: 0, z: 1 };
/**
 * south
 *
 * A unit vector representing the world SOUTH direction (-1,0,0)
 *   (same as BACK)
 *
 * @public
 */
export const VECTOR3_SOUTH: Vector3 = { x: 0, y: 0, z: -1 };
/**
 * half
 *
 * A unit vector representing the value of 0.5 in all directions (0.5,0.5,0.5)
 *
 * @public
 */
export const VECTOR3_HALF: Vector3 = { x: 0.5, y: 0.5, z: 0.5 };
/**
 * negative
 *
 * A unit vector representing the value of -1 in all directions (-1,-1,-1)
 *
 * @public
 */
export const VECTOR3_NEGATIVE_ONE: Vector3 = { x: -1, y: -1, z: -1 };
/**
 * negative
 *
 * A vector representing the value of 0 in all directions (0,0)
 *
 * @public
 */
export const VECTOR2_ZERO: Vector2 = { x: 0, y: 0 };
