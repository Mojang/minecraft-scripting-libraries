// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export function mergeOptionalArrays<T>(parent: T[] | undefined | null, merge: T[] | undefined | null): T[] | undefined {
    if (parent && merge) {
        return [...parent, ...merge];
    }

    if (parent) {
        return parent;
    }

    return merge;
}
