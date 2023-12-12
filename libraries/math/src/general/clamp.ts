// Copyright (c) Mojang AB.  All rights reserved.

/**
 * Clamps the passed in number to the passed in min and max values.
 *
 * @public
 */
export function clamp_number(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}
