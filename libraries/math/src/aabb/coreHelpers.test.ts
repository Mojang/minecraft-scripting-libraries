// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it, vi } from 'vitest';
import { createMockServerBindings } from '../../__mocks__/minecraft-server.js';
vi.mock('@minecraft/server', () => createMockServerBindings());

import type { Vector3 } from '@minecraft/server';
import { VECTOR3_FORWARD, VECTOR3_ONE, VECTOR3_ZERO, Vector3Utils } from '../vector3/coreHelpers.js';
import { AABB, AABBUtils } from './coreHelpers.js';

describe('AABB factories', () => {
    it('successfully reports invalid AABB when created from identical corner points', () => {
        const aabb = AABBUtils.createFromCornerPoints(VECTOR3_ONE, VECTOR3_ONE);
        expect(AABBUtils.isValid(aabb)).toBe(false);
    });

    it('successfully reports expected AABB when corner point A is less than B', () => {
        const aabb = AABBUtils.createFromCornerPoints(VECTOR3_ZERO, VECTOR3_ONE);
        const expectedCenter = { x: 0.5, y: 0.5, z: 0.5 };
        const expectedextent = { x: 0.5, y: 0.5, z: 0.5 };
        expect(AABBUtils.isValid(aabb)).toBe(true);
        expect(Vector3Utils.equals(aabb.center, expectedCenter)).toBe(true);
        expect(Vector3Utils.equals(aabb.extent, expectedextent)).toBe(true);
    });

    it('successfully reports expected AABB when corner point B is less than A', () => {
        const aabb = AABBUtils.createFromCornerPoints(VECTOR3_ONE, VECTOR3_ZERO);
        const expectedCenter = { x: 0.5, y: 0.5, z: 0.5 };
        const expectedextent = { x: 0.5, y: 0.5, z: 0.5 };
        expect(AABBUtils.isValid(aabb)).toBe(true);
        expect(Vector3Utils.equals(aabb.center, expectedCenter)).toBe(true);
        expect(Vector3Utils.equals(aabb.extent, expectedextent)).toBe(true);
    });
});

describe('AABB operations', () => {
    const validAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
    const invalidAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ZERO };

    it('successfully reports zero extent AABB as invalid', () => {
        expect(AABBUtils.isValid(invalidAABB)).toBe(false);
    });

    it('successfully reports non-zero extent AABB as valid', () => {
        expect(AABBUtils.isValid(validAABB)).toBe(true);
    });

    it('successfully compares AABBs with different centers as not equal', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ONE, extent: VECTOR3_ONE };
        expect(AABBUtils.equals(firstAABB, secondAABB)).toBe(false);
    });

    it('successfully compares AABBs with different extent as not equal', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ZERO, extent: { x: 2.0, y: 2.0, z: 2.0 } };
        expect(AABBUtils.equals(firstAABB, secondAABB)).toBe(false);
    });

    it('successfully compares AABBs with different center and extent as not equal', () => {
        const firstAABB: AABB = { center: VECTOR3_ONE, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ZERO, extent: { x: 2.0, y: 2.0, z: 2.0 } };
        expect(AABBUtils.equals(firstAABB, secondAABB)).toBe(false);
    });

    it('successfully compares AABBs with same center and extent as equal', () => {
        const firstAABB: AABB = { center: VECTOR3_ONE, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ONE, extent: VECTOR3_ONE };
        expect(AABBUtils.equals(firstAABB, secondAABB)).toBe(true);
    });

    it('successfully returns expected min Vector3', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const min = AABBUtils.getMin(aabb);
        expect(Vector3Utils.equals(min, { x: -1.0, y: -1.0, z: -1.0 })).toBe(true);
    });

    it('successfully returns expected max Vector3', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const max = AABBUtils.getMax(aabb);
        expect(Vector3Utils.equals(max, { x: 1.0, y: 1.0, z: 1.0 })).toBe(true);
    });

    it('successfully returns expected span Vector3', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const span = AABBUtils.getSpan(aabb);
        expect(Vector3Utils.equals(span, { x: 2.0, y: 2.0, z: 2.0 })).toBe(true);
    });

    it('successfully translates AABB center not changing extent', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const translatedAABB = AABBUtils.translate(aabb, VECTOR3_FORWARD);
        expect(Vector3Utils.equals(translatedAABB.center, { x: 0.0, y: 0.0, z: 1.0 })).toBe(true);
        expect(Vector3Utils.equals(translatedAABB.extent, VECTOR3_ONE)).toBe(true);
    });

    it('successfully dilates AABB extent not changing center', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const dilatedAABB = AABBUtils.dilate(aabb, VECTOR3_ONE);
        expect(Vector3Utils.equals(dilatedAABB.center, VECTOR3_ZERO)).toBe(true);
        expect(Vector3Utils.equals(dilatedAABB.extent, { x: 2.0, y: 2.0, z: 2.0 })).toBe(true);
    });

    // TODO: This may need a matrix of tests for different situations
    it('successfully expands AABB with other AABB', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ONE, extent: VECTOR3_ONE };
        const expandedAABB = AABBUtils.expand(firstAABB, secondAABB);
        expect(Vector3Utils.equals(expandedAABB.center, { x: 0.5, y: 0.5, z: 0.5 })).toBe(true);
        expect(Vector3Utils.equals(expandedAABB.extent, { x: 1.5, y: 1.5, z: 1.5 })).toBe(true);
    });

    it('successfully reports non-overlapping AABBs as not intersecting', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: { x: 2.0, y: 2.0, z: 2.0 }, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        expect(AABBUtils.intersects(firstAABB, secondAABB)).toBe(false);
    });

    it('successfully reports overlapping AABBs as intersecting', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ONE, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        expect(AABBUtils.intersects(firstAABB, secondAABB)).toBe(true);
    });

    it('successfully reports Vector3 outside AABB as not inside', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const location: Vector3 = { x: 1.1, y: 1.0, z: 1.0 };
        expect(AABBUtils.isInside(aabb, location)).toBe(false);
    });

    it('successfully reports Vector3 inside of AABB as inside', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const location: Vector3 = { x: 1.0, y: 1.0, z: 1.0 };
        expect(AABBUtils.isInside(aabb, location)).toBe(true);
    });

    it('successfully reports correct intersecting AABB for overlapping AABBs', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: VECTOR3_ONE, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        const intersection = AABBUtils.getIntersection(firstAABB, secondAABB);
        expect(intersection).toBeDefined();
        if (intersection !== undefined) {
            expect(Vector3Utils.equals(intersection.center, { x: 0.75, y: 0.75, z: 0.75 })).toBe(true);
            expect(Vector3Utils.equals(intersection.extent, { x: 0.25, y: 0.25, z: 0.25 })).toBe(true);
        }
    });

    it('successfully reports undefined AABB for non-overlapping AABBs', () => {
        const firstAABB: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const secondAABB: AABB = { center: { x: 2.0, y: 2.0, z: 2.0 }, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        const intersection = AABBUtils.getIntersection(firstAABB, secondAABB);
        expect(intersection).toBeUndefined();
    });
});

describe('AABB BlockVolume operations', () => {
    it('successfully creates a BlockVolume when AABB extent are VECTOR3_ONE', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: VECTOR3_ONE };
        const blockVolume = AABBUtils.getBlockVolume(aabb);
        expect(blockVolume.from).toEqual({ x: -1.0, y: -1.0, z: -1.0 });
        expect(blockVolume.to).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
    });

    it('successfully creates a BlockVolume when AABB extent coords are 0.5', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        const blockVolume = AABBUtils.getBlockVolume(aabb);
        expect(blockVolume.from).toEqual({ x: -1.0, y: -1.0, z: -1.0 });
        expect(blockVolume.to).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
    });

    it('successfully creates a BlockVolume when AABB center and extent coords are 0.5', () => {
        const aabb: AABB = { center: { x: 0.5, y: 0.5, z: 0.5 }, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        const blockVolume = AABBUtils.getBlockVolume(aabb);
        expect(blockVolume.from).toEqual({ x: 0.0, y: 0.0, z: 0.0 });
        expect(blockVolume.to).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
    });

    it('successfully creates a BlockVolume when AABB center coords are -0.5 and extent coords are 0.5', () => {
        const aabb: AABB = { center: { x: -0.5, y: -0.5, z: -0.5 }, extent: { x: 0.5, y: 0.5, z: 0.5 } };
        const blockVolume = AABBUtils.getBlockVolume(aabb);
        expect(blockVolume.from).toEqual({ x: -1.0, y: -1.0, z: -1.0 });
        expect(blockVolume.to).toEqual({ x: -0.0, y: -0.0, z: -0.0 });
    });

    it('successfully creates a BlockVolume when AABB extent are greater than VECTOR3_ZERO within epsilon', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: { x: 0.00001, y: 0.00001, z: 0.00001 } };
        const blockVolume = AABBUtils.getBlockVolume(aabb);
        expect(blockVolume.from).toEqual({ x: 0.0, y: 0.0, z: 0.0 });
        expect(blockVolume.to).toEqual({ x: 0.0, y: 0.0, z: 0.0 });
    });

    it('successfully creates a BlockVolume when AABB extent are greater than VECTOR3_ZERO exceeding epsilon', () => {
        const aabb: AABB = { center: VECTOR3_ZERO, extent: { x: 0.00002, y: 0.00002, z: 0.00002 } };
        const blockVolume = AABBUtils.getBlockVolume(aabb);
        expect(blockVolume.from).toEqual({ x: -1.0, y: -1.0, z: -1.0 });
        expect(blockVolume.to).toEqual({ x: 1.0, y: 1.0, z: 1.0 });
    });
});
