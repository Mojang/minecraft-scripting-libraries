// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Array, Boolean, Intersect, Literal, Optional, Record, Runtype, Static, String, Union } from 'runtypes';

/**
 * The supported module types for documentation generation.
 */
export const ModuleTypesValidator = Union(
    Literal('script'),
    Literal('commands'),
    Literal('after_events_ordering'),
    Literal('vanilla_data')
);
export type ModuleTypes = Static<typeof ModuleTypesValidator>;

/**
 * Most common piece of data for generation, a name field.
 */
export const ModuleNameDataValidator = Record({
    name: String,
});
export type ModuleNameData = Static<typeof ModuleNameDataValidator>;

/**
 * Common module data for all types of modules
 */
export const CommonModuleDataValidator = Record({
    name: String,
    minecraft_version: String,
    module_type: ModuleTypesValidator,
    module_name: Optional(String),
});
export type IMinecraftModule = Static<typeof CommonModuleDataValidator>;

/**
 * Common data for runtime comment flags
 */
export const CommonCommentFlagsValidator = Record({
    has_comments: Optional(Boolean),
});

/**
 * Standardized Vanilla Name Record and optional states
 */
export const StandardizedVanillaNameRecord = Record({
    namespace: Optional(String),
    no_namespace_name: Optional(String),
    standardized_name: Optional(String),
});

/**
 * Additional data that may be associated with data_items
 */
export const DataStateRecord = Record({
    properties: Optional(Array(ModuleNameDataValidator)),
    state_union: Optional(String),
    value: Optional(String),
});

/**
 * Runtime specific fields for module name data in vanilla data modules
 */
export const VanillaModuleNameDataValidator =
    ModuleNameDataValidator.And(StandardizedVanillaNameRecord).And(DataStateRecord);
export type VanillaModuleNameData = Static<typeof VanillaModuleNameDataValidator>;

export const CoreVanillaDataFieldsRecord = Intersect(
    Record({
        data_items: Array(VanillaModuleNameDataValidator),
        vanilla_data_type: Optional(String),
        module_type: Literal('vanilla_data'),

        // Runtime Markup
        display_type: Optional(String),
        display_name: Optional(String),
        has_properties: Optional(Boolean),
    }),
    CommonModuleDataValidator
);
export type CoreVanillaDataFields = Static<typeof CoreVanillaDataFieldsRecord>;

/**
 * Common vanilla data fields for all types of modules
 */
export function getCommonVanillaDataFieldsRecord<T extends Runtype>(base: T, literalType: string) {
    return Intersect(
        CoreVanillaDataFieldsRecord,
        Record({
            data_items: Array(base),
            vanilla_data_type: Optional(Literal(literalType)),
        })
    );
}
export type CommonVanillaDataFields = Static<ReturnType<typeof getCommonVanillaDataFieldsRecord>>;

export type RuntimeDataModule<T> = T extends IMinecraftModule ? T : never;
