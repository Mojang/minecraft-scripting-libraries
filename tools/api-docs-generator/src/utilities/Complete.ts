// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Small helper that makes every field in a struct non-optional, but re-adds undefined in the explicit type.
 * This allows us to ensure we don't miss any fields on generation update, but still allow for undefined values
 */
export type Complete<T> = {
    [P in keyof Required<T>]: T[P] extends Required<T>[P] ? T[P] : T[P] | undefined;
};
