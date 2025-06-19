// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as modules from '.';

export type ArrayChangelogEntry<T = unknown> = T & {
    $added?: boolean;
    $removed?: boolean;
    version?: string;
};

export type ValueChangelogEntry<T = unknown> = {
    $old: T;
    $new: T;
    $changed?: boolean;
    version?: string;
};

export type ModuleWithChangelog<T extends modules.IMinecraftModule> = T & {
    changelog: ArrayChangelogEntry<T>[];
};

export function isArrayChangelogEntry<T>(obj: object): obj is ArrayChangelogEntry<T> {
    return obj !== undefined && ('$added' in obj || '$removed' in obj);
}

export function isValueChangelogEntry<T>(obj: object): obj is ValueChangelogEntry<T> {
    return obj !== undefined && '$old' in obj && '$new' in obj;
}

export function moduleHasChangelog<T extends modules.IMinecraftModule>(module: T): module is ModuleWithChangelog<T> {
    return module !== undefined && 'changelog' in module;
}

///
// IMinecraftModule
///

export type IMinecraftModuleChangelogEntry = ArrayChangelogEntry<modules.IMinecraftModule>;
export type IMinecraftModuleWithChangelog = ModuleWithChangelog<modules.IMinecraftModule>;

///
// Script Module Changelog Types
///

export type ChangelogKey =
    | 'changelog'
    | 'class_changelog'
    | 'interface_changelog'
    | 'error_changelog'
    | 'object_changelog'
    | 'function_changelog'
    | 'constant_changelog'
    | 'property_changelog'
    | 'enum_changelog'
    | 'alias_changelog';

export type MinecraftDependencyChangelogEntry = ArrayChangelogEntry<modules.MinecraftModuleDescription>;

export type MinecraftScriptModuleChangelogEntry = ArrayChangelogEntry<modules.MinecraftScriptModule>;
export type MinecraftScriptModuleWithChangelog = ModuleWithChangelog<modules.MinecraftScriptModule>;

export type MinecraftClassChangelogEntry = ArrayChangelogEntry<modules.MinecraftClass>;
export type MinecraftClassWithChangelog = modules.MinecraftClass & {
    class_changelog?: MinecraftClassChangelogEntry[];
};

export type MinecraftInterfaceChangelogEntry = ArrayChangelogEntry<modules.MinecraftInterface>;
export type MinecraftInterfaceWithChangelog = modules.MinecraftInterface & {
    interface_changelog?: MinecraftInterfaceChangelogEntry[];
};

export type MinecraftErrorChangelogEntry = ArrayChangelogEntry<modules.MinecraftError>;
export type MinecraftErrorWithChangelog = modules.MinecraftError & {
    error_changelog?: MinecraftErrorChangelogEntry[];
};

export type MinecraftObjectChangelogEntry = ArrayChangelogEntry<modules.MinecraftObject>;
export type MinecraftObjectWithChangelog = modules.MinecraftObject & {
    object_changelog?: MinecraftObjectChangelogEntry[];
};

export type MinecraftFunctionChangelogEntry = ArrayChangelogEntry<modules.MinecraftFunction>;
export type MinecraftFunctionWithChangelog = modules.MinecraftFunction & {
    function_changelog?: MinecraftFunctionChangelogEntry[];
};

export type MinecraftConstantChangelogEntry = ArrayChangelogEntry<modules.MinecraftConstant>;
export type MinecraftConstantWithChangelog = modules.MinecraftConstant & {
    constant_changelog?: MinecraftConstantChangelogEntry[];
};

export type MinecraftPropertyChangelogEntry = ArrayChangelogEntry<modules.MinecraftProperty>;
export type MinecraftPropertyWithChangelog = modules.MinecraftProperty & {
    property_changelog?: MinecraftPropertyChangelogEntry[];
};

export type MinecraftEnumChangelogEntry = ArrayChangelogEntry<modules.MinecraftEnum>;
export type MinecraftEnumWithChangelog = modules.MinecraftEnum & {
    enum_changelog?: MinecraftEnumChangelogEntry[];
};

export type MinecraftTypeAliasChangelogEntry = ArrayChangelogEntry<modules.MinecraftTypeAlias>;
export type MinecraftTypeAliasWithChangelog = modules.MinecraftTypeAlias & {
    alias_changelog?: MinecraftTypeAliasChangelogEntry[];
};
