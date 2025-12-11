// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { AABB, Vector3 } from '@minecraft/server';
import { BlockVolume } from '@minecraft/server';
import { Vector3Utils } from '../vector3/coreHelpers.js';

/**
 * Utilities operating on AABB objects. All methods are static and do not modify the input objects.
 *
 * @public
 */
export class AABBUtils {
    private constructor() {}

    /**
     * createFromCornerPoints
     *
     * Gets an AABB from points defining it's corners, the order doesn't matter.
     * @param pointA - The first corner point.
     * @param pointB - The second corner point.
     * @returns - The resulting AABB.
     */
    static createFromCornerPoints(pointA: Vector3, pointB: Vector3): AABB {
        const min: Vector3 = {
            x: Math.min(pointA.x, pointB.x),
            y: Math.min(pointA.y, pointB.y),
            z: Math.min(pointA.z, pointB.z),
        };
        const max: Vector3 = {
            x: Math.max(pointA.x, pointB.x),
            y: Math.max(pointA.y, pointB.y),
            z: Math.max(pointA.z, pointB.z),
        };

        const extent = Vector3Utils.multiply(Vector3Utils.subtract(max, min), { x: 0.5, y: 0.5, z: 0.5 });
        const aabb: AABB = { center: Vector3Utils.add(min, extent), extent: extent };
        return aabb;
    }

    /**
     * isValid
     *
     * Determines if the AABB has non-zero extent on all axes.
     * @param box - The AABB to test for validity.
     * @returns - True if all extent axes are non-zero, otherwise false.
     */
    static isValid(box: AABB): boolean {
        return box.extent.x > 0.0 && box.extent.y > 0.0 && box.extent.z > 0.0;
    }

    /**
     * equals
     *
     * Compares the equality of two AABBs.
     * @param aabb - The first AABB in the comparison.
     * @param other - The second AABB in the comparison.
     * @returns - True if the center and extent of both AABBs are equal.
     */
    static equals(aabb: AABB, other: AABB): boolean {
        return Vector3Utils.equals(aabb.center, other.center) && Vector3Utils.equals(aabb.extent, other.extent);
    }

    /**
     * getMin
     *
     * Gets the minimum corner of an AABB.
     * @param aabb - The AABB to retrieve the minimum corner of.
     * @returns - The minimum corner of the AABB.
     */
    static getMin(aabb: AABB): Vector3 {
        return Vector3Utils.subtract(aabb.center, aabb.extent);
    }

    /**
     * getMax
     *
     * Gets the maximum corner of an AABB.
     * @param aabb - The AABB to retrieve the maximum corner of.
     * @returns - The maximum corner of the AABB.
     */
    static getMax(aabb: AABB): Vector3 {
        return Vector3Utils.add(aabb.center, aabb.extent);
    }

    /**
     * getSpan
     *
     * Gets the span of an AABB.
     * @param aabb - The AABB to retrieve the span of.
     * @returns - The span of the AABB.
     */
    static getSpan(aabb: AABB): Vector3 {
        return Vector3Utils.multiply(aabb.extent, { x: 2.0, y: 2.0, z: 2.0 });
    }

    /**
     * Creates the smallest BlockVolume that includes all of a source AABB.
     *
     * @param aabb - The source AABB.
     * @returns - The BlockVolume containing the source AABB.
     */
    static getBlockVolume(aabb: AABB): BlockVolume {
        const epsilon = 0.00001;
        const epsilonVec: Vector3 = { x: epsilon, y: epsilon, z: epsilon };
        const from = Vector3Utils.floor(Vector3Utils.add(this.getMin(aabb), epsilonVec));
        const to = Vector3Utils.ceil(Vector3Utils.subtract(this.getMax(aabb), epsilonVec));
        return new BlockVolume(from, to);
    }

    /**
     * translate
     *
     * Creates a translated AABB given a source AABB and translation vector.
     * @param aabb - The source AABB.
     * @param delta - The translation vector to add to the AABBs center.
     * @returns - The resulting translated AABB.
     */
    static translate(aabb: AABB, delta: Vector3): AABB {
        return { center: Vector3Utils.add(aabb.center, delta), extent: aabb.extent };
    }

    /**
     * dilate
     *
     * Creates a dilated AABB given a source AABB and dilation vector.
     * @param aabb - The source AABB.
     * @param size - The dilation vector to add to the AABBs extent.
     * @returns - The resulting dilated AABB.
     */
    static dilate(aabb: AABB, size: Vector3): AABB {
        return { center: aabb.center, extent: Vector3Utils.add(aabb.extent, size) };
    }

    /**
     * expand
     *
     * Creates an expanded AABB given two source AABBs.
     * @param aabb - The first source AABB.
     * @param other - The second source AABB
     * @returns - The resulting expanded AABB.
     */
    static expand(aabb: AABB, other: AABB): AABB {
        const aabbMin = this.getMin(aabb);
        const otherMin = this.getMin(other);
        const min: Vector3 = {
            x: Math.min(aabbMin.x, otherMin.x),
            y: Math.min(aabbMin.y, otherMin.y),
            z: Math.min(aabbMin.z, otherMin.z),
        };
        const aabbMax = this.getMax(aabb);
        const otherMax = this.getMax(other);
        const max: Vector3 = {
            x: Math.max(aabbMax.x, otherMax.x),
            y: Math.max(aabbMax.y, otherMax.y),
            z: Math.max(aabbMax.z, otherMax.z),
        };
        return this.createFromCornerPoints(min, max);
    }

    /**
     * getIntersection
     *
     * Creates an AABB of the intersecting area of two source AABBs.
     * @param aabb - The first source AABB.
     * @param other - The second source AABB,
     * @returns - The resulting intersecting AABB if they intersect, otherwise returns undefined.
     */
    static getIntersection(aabb: AABB, other: AABB): AABB | undefined {
        if (!this.intersects(aabb, other)) {
            return undefined;
        }

        const aabbMin = this.getMin(aabb);
        const otherMin = this.getMin(other);
        const min: Vector3 = {
            x: Math.max(aabbMin.x, otherMin.x),
            y: Math.max(aabbMin.y, otherMin.y),
            z: Math.max(aabbMin.z, otherMin.z),
        };

        const aabbMax = this.getMax(aabb);
        const otherMax = this.getMax(other);
        const max: Vector3 = {
            x: Math.min(aabbMax.x, otherMax.x),
            y: Math.min(aabbMax.y, otherMax.y),
            z: Math.min(aabbMax.z, otherMax.z),
        };
        return this.createFromCornerPoints(min, max);
    }

    /**
     * intersects
     *
     * Calculates if two AABBs are intersecting.
     * @param aabb - The first AABB.
     * @param aabb - The second AABB.
     * @returns - True if the AABBs are intersecting, otherwise false.
     */
    static intersects(aabb: AABB, other: AABB): boolean {
        if (!this.isValid(aabb) || !this.isValid(other)) {
            return false;
        }

        const aabbMin = this.getMin(aabb);
        const aabbMax = this.getMax(aabb);
        const otherMin = this.getMin(other);
        const otherMax = this.getMax(other);

        if (otherMax.x < aabbMin.x || otherMin.x > aabbMax.x) {
            return false;
        }
        if (otherMax.y < aabbMin.y || otherMin.y > aabbMax.y) {
            return false;
        }
        if (otherMax.z < aabbMin.z || otherMin.z > aabbMax.z) {
            return false;
        }
        return true;
    }

    /**
     * isInside
     *
     * Calculates if a position is inside of an AABB.
     * @param aabb - The AABB to test against.
     * @param pos - The position to test.
     * @returns True if the position is inside of the AABB, otherwise returns false.
     */
    static isInside(aabb: AABB, pos: Vector3): boolean {
        const min = this.getMin(aabb);
        if (pos.x < min.x || pos.y < min.y || pos.z < min.z) {
            return false;
        }

        const max = this.getMax(aabb);
        if (pos.x > max.x || pos.y > max.y || pos.z > max.z) {
            return false;
        }

        return true;
    }
}
