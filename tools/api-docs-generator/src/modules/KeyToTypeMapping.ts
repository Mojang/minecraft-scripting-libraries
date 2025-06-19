// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ModuleNameData } from './IMinecraftModule';
import { MinecraftBlockProperty } from './MinecraftBlockModule';
import {
    MinecraftClassChangelogEntry,
    MinecraftConstantChangelogEntry,
    MinecraftEnumChangelogEntry,
    MinecraftErrorChangelogEntry,
    MinecraftFunctionChangelogEntry,
    MinecraftInterfaceChangelogEntry,
    MinecraftObjectChangelogEntry,
    MinecraftPropertyChangelogEntry,
    MinecraftTypeAliasChangelogEntry,
} from './MinecraftChangelogTypes';
import {
    MinecraftClass,
    MinecraftClosureType,
    MinecraftConstant,
    MinecraftEnum,
    MinecraftError,
    MinecraftFunction,
    MinecraftFunctionArgument,
    MinecraftFunctionArgumentDetails,
    MinecraftGeneratorType,
    MinecraftInterface,
    MinecraftModuleDescription,
    MinecraftProperty,
    MinecraftType,
    MinecraftTypeAlias,
    NameMarkupType,
    VersionMarkupType,
} from './MinecraftScriptModule';

/**
 * Object property keys -> The type of the property
 */
export type KeyToTypeMapping = {
    // Common Properties
    name: string;
    version: string;
    minecraft_version: string;
    from_module: MinecraftModuleDescription;
    module: MinecraftModuleDescription;

    // Script Module Categories
    classes: MinecraftClass[];
    constants: MinecraftConstant[];
    enums: MinecraftEnum[];
    errors: MinecraftError[];
    functions: MinecraftFunction[];
    interfaces: MinecraftInterface[];
    properties: MinecraftProperty[];
    type_aliases: MinecraftTypeAlias[];

    // Function Properties
    details: MinecraftFunctionArgumentDetails;
    default_value: unknown;
    supported_values: unknown;

    // Constant/Property Properties
    get_privilege: string[];
    set_privilege: string[];
    call_privilege: string[];
    value: string;
    is_static: boolean;
    runtime_conditions: string[];

    // Type Properties
    type: MinecraftType;
    argument_types: MinecraftType[];
    base_types: MinecraftType[];
    closure_type: MinecraftClosureType;
    derived_types: MinecraftType[];
    element_type: MinecraftType;
    error_types: MinecraftType[];
    iterator: MinecraftType;
    iterator_type: MinecraftType;
    key_type: MinecraftType;
    optional_type: MinecraftType;
    promise_type: MinecraftType;
    return_type: MinecraftType;
    value_type: MinecraftType;
    variant_types: MinecraftType[];
    generator_type: MinecraftGeneratorType;
    yield_type: MinecraftType;
    next_type: MinecraftType;

    // Changelog Properties
    changelog: never; // Don't scan for the root changelog, this always exists at the top level of a script module!
    class_changelog: MinecraftClassChangelogEntry[];
    interface_changelog: MinecraftInterfaceChangelogEntry[];
    error_changelog: MinecraftErrorChangelogEntry[];
    object_changelog: MinecraftObjectChangelogEntry[];
    function_changelog: MinecraftFunctionChangelogEntry[];
    constant_changelog: MinecraftConstantChangelogEntry[];
    property_changelog: MinecraftPropertyChangelogEntry[];
    enum_changelog: MinecraftEnumChangelogEntry[];
    alias_changelog: MinecraftTypeAliasChangelogEntry[];
    $added: boolean;
    $removed: boolean;
    $changed: boolean;

    // Vanilla Data Modules
    data_items: ModuleNameData[];

    // Block Module Mappings
    block_properties: MinecraftBlockProperty[];
};

/**
 * Object property keys -> The type of the parent containing this property
 *
 * If a key exists in this map, scanObject functions will return this type instead of a Record containing only the property.
 * Useful for when a filter needs to add other properties based on the presence of this key.
 */
export type KeyToParentTypeMapping = {
    // Common Properties
    name: NameMarkupType;
    version: VersionMarkupType;

    // Class Properties
    iterator: MinecraftClass;

    // Function Properties
    details: MinecraftFunctionArgument;

    // Constant/Property Properties
    is_static: MinecraftConstant;
};
