// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Array, Boolean, Intersect, Literal, Number, Optional, Record, Static, String } from 'runtypes';
import { CommonModuleDataValidator, IMinecraftModule } from './IMinecraftModule';

export const MinecraftCommandEnumValueRecord = Record({
    value: String,

    // Runtime Markup
    has_comments: Optional(Boolean),
    value_description: Optional(Array(String)),
});
export type MinecraftCommandEnumValue = Static<typeof MinecraftCommandEnumValueRecord>;

export const MinecraftCommandEnumRecord = Record({
    name: String,
    values: Array(MinecraftCommandEnumValueRecord),

    // Runtime Markup
    enum_name: Optional(String),
    command_references: Optional(
        Array(
            Record({
                command_name: String,
                command_index: Number,
            })
        )
    ),

    has_comments: Optional(Boolean),
    enum_description: Optional(Array(String)),
});
export type MinecraftCommandEnum = Static<typeof MinecraftCommandEnumRecord>;

export const MinecraftCommandAliasRecord = Record({
    name: String,

    // Runtime Markup
    alias_name: Optional(String),
});
export type MinecraftCommandAlias = Static<typeof MinecraftCommandAliasRecord>;

export const MinecraftCommandArgumentTypeRecord = Record({
    name: String,

    // Runtime Markup
    type_name: Optional(String),
    keyword_name: Optional(String),
    is_enum: Optional(Boolean),
    is_keyword: Optional(Boolean),
    has_link: Optional(Boolean),
    syntax: Optional(String),

    has_comments: Optional(Boolean),
    type_description: Optional(Array(String)),
});
export type MinecraftCommandArgumentType = Static<typeof MinecraftCommandArgumentTypeRecord>;

export const MinecraftCommandArgumentRecord = Record({
    name: String,
    is_optional: Boolean,
    type: MinecraftCommandArgumentTypeRecord,

    // Runtime Markup
    param_name: Optional(String),
    directory_name: Optional(String),

    has_comments: Optional(Boolean),
    argument_description: Optional(Array(String)),
});
export type MinecraftCommandArgument = Static<typeof MinecraftCommandArgumentRecord>;

export const MinecraftCommandOverloadRecord = Record({
    name: String,
    params: Array(MinecraftCommandArgumentRecord),

    // Runtime Markup
    has_comments: Optional(Boolean),
    overload_description: Optional(Array(String)),
    overload_header: Optional(String),
});
export type MinecraftCommandOverload = Static<typeof MinecraftCommandOverloadRecord>;

export const MinecraftCommandRecord = Record({
    name: String,
    permission_level: Number,
    requires_cheats: Boolean,

    description: Optional(String),
    aliases: Optional(Array(MinecraftCommandAliasRecord)),
    overloads: Optional(Array(MinecraftCommandOverloadRecord)),

    // Runtime Markup
    command_name: Optional(String),
    permission_level_name: Optional(String),

    arguments: Optional(Array(MinecraftCommandArgumentRecord)),
    command_enums: Optional(Array(MinecraftCommandEnumRecord)),

    has_comments: Optional(Boolean),
    command_description: Optional(Array(String)),
});
export type MinecraftCommand = Static<typeof MinecraftCommandRecord>;

export const MinecraftCommandModuleRecord = Intersect(
    CommonModuleDataValidator,
    Record({
        module_type: Literal('commands'),

        commands: Optional(Array(MinecraftCommandRecord)),
        command_enums: Optional(Array(MinecraftCommandEnumRecord)),

        // Runtime Markup
        command_types: Optional(Array(MinecraftCommandArgumentTypeRecord)),
    })
);
export type MinecraftCommandModule = Static<typeof MinecraftCommandModuleRecord>;

export function isCommandModule(module: IMinecraftModule): module is MinecraftCommandModule {
    return module !== undefined && module.module_type === 'commands';
}
