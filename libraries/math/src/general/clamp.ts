// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Clamps the passed in number to the passed in min and max values.
 *
 * @public
 */
export function clampNumber(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}
