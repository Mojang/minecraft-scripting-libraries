// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Vector2, Vector3 } from '@minecraft/server';
import { Vector2Utils, Vector3Utils } from './coreHelpers.js';

/**
 * Vector3 wrapper class which can be used as a Vector3 for APIs on \@minecraft/server which require a Vector,
 * but also contain additional helper methods. This is an alternative to using the core Vector 3 utility
 * methods directly, for those who prefer a more object-oriented approach. This version of the class is mutable
 * and changes state inline.
 *
 * For an immutable version of the build, use ImmutableVector3Builder.
 *
 * @public
 */
export class Vector3Builder implements Vector3 {
    x: number;
    y: number;
    z: number;

    constructor(vecStr: string, delim?: string, arg2?: never);
    constructor(vec: Vector3, arg?: never, arg2?: never);
    constructor(x: number, y: number, z: number);
    constructor(first: number | Vector3 | string, second?: number | string, z?: number) {
        if (typeof first === 'object') {
            this.x = first.x;
            this.y = first.y;
            this.z = first.z;
        } else if (typeof first === 'string') {
            const parsed = Vector3Utils.fromString(first, (second as string | undefined) ?? ',');
            if (!parsed) {
                this.x = 0;
                this.y = 0;
                this.z = 0;

                return;
            }
            this.x = parsed.x;
            this.y = parsed.y;
            this.z = parsed.z;
        } else {
            this.x = first;
            this.y = (second as number) ?? 0;
            this.z = z ?? 0;
        }
    }

    /**
     * Assigns the values of the passed in vector to this vector. Returns itself.
     */
    assign(vec: Vector3): this {
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
        return this;
    }

    /**
     * equals
     *
     * Check the equality of two vectors
     */
    equals(v: Vector3): boolean {
        return Vector3Utils.equals(this, v);
    }

    /**
     * add
     *
     * Adds the vector v to this, returning itself.
     */
    add(v: Partial<Vector3>): this {
        return this.assign(Vector3Utils.add(this, v));
    }

    /**
     * subtract
     *
     * Subtracts the vector v from this, returning itself.
     */
    subtract(v: Partial<Vector3>): this {
        return this.assign(Vector3Utils.subtract(this, v));
    }

    /** scale
     *
     * Scales this by the passed in value, returning itself.
     */
    scale(val: number): this {
        return this.assign(Vector3Utils.scale(this, val));
    }

    /**
     * dot
     *
     * Computes the dot product of this and the passed in vector.
     */
    dot(vec: Vector3): number {
        return Vector3Utils.dot(this, vec);
    }

    /**
     * cross
     *
     * Computes the cross product of this and the passed in vector, returning itself.
     */
    cross(vec: Vector3): this {
        return this.assign(Vector3Utils.cross(this, vec));
    }

    /**
     * magnitude
     *
     * The magnitude of the vector
     */
    magnitude(): number {
        return Vector3Utils.magnitude(this);
    }

    /**
     * distance
     *
     * Calculate the distance between two vectors
     */
    distance(vec: Vector3): number {
        return Vector3Utils.distance(this, vec);
    }

    /**
     * normalize
     *
     * Normalizes this vector, returning itself.
     */
    normalize(): this {
        return this.assign(Vector3Utils.normalize(this));
    }

    /**
     * floor
     *
     * Floor the components of a vector to produce a new vector
     */
    floor(): this {
        return this.assign(Vector3Utils.floor(this));
    }

    /**
     * toString
     *
     * Create a string representation of a vector
     */
    toString(options?: { decimals?: number; delimiter?: string }): string {
        return Vector3Utils.toString(this, options);
    }

    /**
     * clamp
     *
     * Clamps the components of a vector to limits to produce a new vector
     */
    clamp(limits: { min?: Partial<Vector3>; max?: Partial<Vector3> }): this {
        return this.assign(Vector3Utils.clamp(this, limits));
    }

    /**
     * lerp
     *
     * Constructs a new vector using linear interpolation on each component from two vectors.
     */
    lerp(vec: Vector3, t: number): this {
        return this.assign(Vector3Utils.lerp(this, vec, t));
    }

    /**
     * slerp
     *
     * Constructs a new vector using spherical linear interpolation on each component from two vectors.
     */
    slerp(vec: Vector3, t: number): this {
        return this.assign(Vector3Utils.slerp(this, vec, t));
    }

    /**
     * multiply
     *
     * Element-wise multiplication of two vectors together.
     * Not to be confused with {@link Vector3Builder.dot} product or {@link Vector3Builder.cross} product
     */
    multiply(vec: Vector3): this {
        return this.assign(Vector3Utils.multiply(this, vec));
    }

    /**
     * rotateX
     *
     * Rotates the vector around the x axis counterclockwise (left hand rule)
     * @param a - Angle in radians
     */
    rotateX(a: number): this {
        return this.assign(Vector3Utils.rotateX(this, a));
    }

    /**
     * rotateY
     *
     * Rotates the vector around the y axis counterclockwise (left hand rule)
     * @param a - Angle in radians
     */
    rotateY(a: number): this {
        return this.assign(Vector3Utils.rotateY(this, a));
    }

    /**
     * rotateZ
     *
     * Rotates the vector around the z axis counterclockwise (left hand rule)
     * @param a - Angle in radians
     */
    rotateZ(a: number): this {
        return this.assign(Vector3Utils.rotateZ(this, a));
    }
}

/**
 * Vector2 wrapper class which can be used as a Vector2 for APIs on \@minecraft/server which require a Vector2.
 * @public
 */
export class Vector2Builder implements Vector2 {
    x: number;
    y: number;

    constructor(vecStr: string, delim?: string);
    constructor(vec: Vector2, arg?: never);
    constructor(x: number, y: number);
    constructor(first: number | Vector2 | string, second?: number | string) {
        if (typeof first === 'object') {
            this.x = first.x;
            this.y = first.y;
        } else if (typeof first === 'string') {
            const parsed = Vector2Utils.fromString(first, (second as string | undefined) ?? ',');
            if (!parsed) {
                this.x = 0;
                this.y = 0;

                return;
            }

            this.x = parsed.x;
            this.y = parsed.y;
        } else {
            this.x = first;
            this.y = (second as number) ?? 0;
        }
    }

    toString(options?: { decimals?: number; delimiter?: string }): string {
        return Vector2Utils.toString(this, options);
    }
}
