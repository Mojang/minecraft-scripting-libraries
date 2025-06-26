// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Array, Boolean, Intersect, Literal, Number, Optional, Record, Static, String, Union } from 'runtypes';

import {
    getCommonVanillaDataFieldsRecord,
    ModuleNameDataValidator,
    StandardizedVanillaNameRecord,
    CommonCommentFlagsValidator,
} from './IMinecraftModule';

export const MinecraftBlockRecord = Intersect(
    ModuleNameDataValidator,
    StandardizedVanillaNameRecord,
    CommonCommentFlagsValidator,
    Record({
        properties: Array(
            Intersect(
                ModuleNameDataValidator,
                CommonCommentFlagsValidator,
                Record({ property_description: Optional(Array(String)) })
            )
        ),

        // Runtime Markup
        namespace: Optional(String),
        block_name: Optional(String),
        block_description: Optional(Array(String)),
        state_union: Optional(String),
    })
);
export type MinecraftBlock = Static<typeof MinecraftBlockRecord>;

export const MinecraftBlockPropertyValueRecord = Intersect(
    CommonCommentFlagsValidator,
    Record({
        value: Union(Number, String, Boolean),
        value_description: Optional(Array(String)),
    })
);
export type MinecraftBlockPropertyValue = Static<typeof MinecraftBlockPropertyValueRecord>;

export const MinecraftBlockPropertyRecord = Intersect(
    ModuleNameDataValidator,
    CommonCommentFlagsValidator,
    Record({
        type: String,
        values: Array(MinecraftBlockPropertyValueRecord),
        min_value: Optional(Number),
        max_value: Optional(Number),

        // Runtime Markup
        property_name: Optional(String),
        property_description: Optional(Array(String)),
        property_type: Optional(Literal('number').Or(Literal('string').Or(Literal('boolean')))),
        int_value_display_as_range: Optional(Boolean),
    })
);
export type MinecraftBlockProperty = Static<typeof MinecraftBlockPropertyRecord>;

export const MinecraftBlockModuleRecord = Intersect(
    Record({
        module_type: Literal('vanilla_data'),
        block_properties: Array(MinecraftBlockPropertyRecord),

        // Runtime Markup
        data_properties: Optional(Array(MinecraftBlockPropertyRecord)),
    }),
    getCommonVanillaDataFieldsRecord(MinecraftBlockRecord, 'block')
);
export type MinecraftBlockModule = Static<typeof MinecraftBlockModuleRecord>;
