import { Vector3 } from '@minecraft/server';
import { add, clamp, cross, dot, equals, floor, magnitude, normalize, scale, subtract, toString } from './coreHelpers';

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

    constructor(vec: Vector3, arg?: never, arg2?: never);
    constructor(x: number, y: number, z: number);
    constructor(first: number | Vector3, y?: number, z?: number) {
        if (typeof first === 'object') {
            this.x = first.x;
            this.y = first.y;
            this.z = first.z;
        } else {
            this.x = first;
            this.y = y ?? 0;
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
        return equals(this, v);
    }

    /**
     * add
     *
     * Adds the vector v to this, returning itself.
     */
    add(v: Vector3): this {
        return this.assign(add(this, v));
    }

    /**
     * subtract
     *
     * Subtracts the vector v from this, returning itself.
     */
    subtract(v: Vector3): this {
        return this.assign(subtract(this, v));
    }

    /** scale
     *
     * Scales this by the passed in value, returning itself.
     */
    scale(val: number): this {
        return this.assign(scale(this, val));
    }

    /**
     * dot
     *
     * Computes the dot product of this and the passed in vector.
     */
    dot(vec: Vector3): number {
        return dot(this, vec);
    }

    /**
     * cross
     *
     * Computes the cross product of this and the passed in vector, returning itself.
     */
    cross(vec: Vector3): this {
        return this.assign(cross(this, vec));
    }

    /**
     * magnitude
     *
     * The magnitude of the vector
     */
    magnitude(): number {
        return magnitude(this);
    }

    /**
     * normalize
     *
     * Normalizes this vector, returning itself.
     */
    normalize(): this {
        return this.assign(normalize(this));
    }

    /**
     * floor
     *
     * Floor the components of a vector to produce a new vector
     */
    floor(): this {
        return this.assign(floor(this));
    }

    /**
     * toString
     *
     * Create a string representation of a vector
     */
    toString(options?: { decimals?: number; delimiter?: string }): string {
        return toString(this, options);
    }

    /**
     * clamp
     *
     * Clamps the components of a vector to limits to produce a new vector
     */
    clamp(limits: { min?: Partial<Vector3>; max?: Partial<Vector3> }): this {
        return this.assign(clamp(this, limits));
    }
}
