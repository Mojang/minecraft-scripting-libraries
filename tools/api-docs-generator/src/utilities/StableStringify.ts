// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Serialize a value to JSON with object keys emitted in sorted order at every
 * level of the structure. This makes the result suitable for order-insensitive
 * equality comparisons (two objects with the same keys/values in different
 * insertion orders produce identical strings).
 *
 * Optionally, a list of submember keys to ignore can be supplied; any property
 * whose key matches will be omitted from the output (at any depth).
 */
export function stableStringify(value: unknown, ignoredSubmembers?: readonly string[]): string | undefined {
    const hasIgnored = ignoredSubmembers !== undefined && ignoredSubmembers.length > 0;

    const replacer = (key: string, val: unknown): unknown => {
        if (hasIgnored && ignoredSubmembers.includes(key)) {
            return undefined;
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            const source = val as Record<string, unknown>;
            const sorted: Record<string, unknown> = {};
            for (const k of Object.keys(source).sort()) {
                sorted[k] = source[k];
            }
            return sorted;
        }
        return val;
    };

    return JSON.stringify(value, replacer);
}
