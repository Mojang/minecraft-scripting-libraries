// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Array, Intersect, Literal, Number, Optional, Record, Static, String } from 'runtypes';

import { CommonModuleDataValidator, IMinecraftModule } from './IMinecraftModule';

/**
 * A version range for a Molang query which includes change description and pertinent query sets
 */
export const MinecraftMolangVersionRangeRecord = Record({
    first_version: String,
    last_version: Optional(String),
    query_sets: Optional(Array(String)),
    version_change_description: Optional(String),
});

/**
 * A Molang query function
 */
export const MinecraftMolangQueryRecord = Record({
    name: String,
    description: Optional(String),
    return_type: String,
    min_args: Number,
    max_args: Optional(Number),
    experiments: Array(String),
    version_ranges: Array(MinecraftMolangVersionRangeRecord),
});
export type MinecraftMolangQuery = Static<typeof MinecraftMolangQueryRecord>;

/**
 * Molang module containing queries, variables, and math functions
 */
export const MinecraftMolangModuleRecord = Intersect(
    CommonModuleDataValidator,
    Record({
        module_type: Literal('molang'),

        // Molang query functions (e.g., query.is_sneaking)
        queries: Optional(Array(MinecraftMolangQueryRecord)),
    })
);
export type MinecraftMolangModule = Static<typeof MinecraftMolangModuleRecord>;
