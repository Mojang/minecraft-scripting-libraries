// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { MinecraftRelease } from '../MinecraftRelease';
import {
    MinecraftCommand,
    MinecraftCommandModule,
    MinecraftCommandArgument,
    MinecraftCommandArgumentType,
} from '../modules/MinecraftCommandModule';
import { Filter } from './Filters';

const commandTypeNameMappings: Record<string, string> = {
    val: 'float',
    rval: 'rotation',
    id: 'string',
    selection: 'target',
    wildcardselection: 'targets',
    wildcardint: 'wildcard int',
    position_float: 'position',
    slashcommand: 'command',
    block_state_array: 'block properties',
    pathcommand: 'filepath',
    json_object: 'json',
    message_root: 'message',
    postfix_t: 'time',
    postfix_s: 'time',
    postfix_d: 'time',
    postfix_l: 'int',
    rawtext: 'text',
};

const commandTypeSyntaxMappings: Record<string, string> = {
    position: 'x y z',
    position_float: 'x y z',
};

function convertCommandPermissionLevelsToName(moduleJson: MinecraftCommandModule) {
    const convertPermissionLevel = (permissionLevel: number) => {
        switch (permissionLevel) {
            default:
            case 0:
                return 'Any';
            case 1:
                return 'Game Directors';
            case 2:
                return 'Admin';
            case 3:
                return 'Host';
            case 4:
                return 'Owner';
            case 5:
                return 'Internal';
        }
    };

    moduleJson.commands.forEach(
        commandJson => (commandJson.permission_level_name = convertPermissionLevel(commandJson.permission_level))
    );
}

/**
 * Creates lists of commands that reference an enum at the enum level.
 */
function formatCommandEnums(moduleJson: MinecraftCommandModule) {
    moduleJson.command_enums.forEach(enumJson => {
        if (enumJson.command_references === undefined) {
            enumJson.command_references = [];
        }
        const addCommandReference = (commandJson: MinecraftCommand, commandIndex: number) => {
            for (const overloadJson of commandJson.overloads) {
                for (const paramJson of overloadJson.params) {
                    if (paramJson.type.name.toLowerCase() === enumJson.name.toLowerCase()) {
                        enumJson.command_references.push({
                            command_name: commandJson.name,
                            command_index: commandIndex,
                        });
                        return;
                    }
                }
            }
        };
        for (let i = 0; i < moduleJson.commands.length; ++i) {
            const commandJson = moduleJson.commands[i];
            addCommandReference(commandJson, i);
            if (commandJson.command_enums === undefined) {
                commandJson.command_enums = [];
            }
        }
        if (enumJson.command_references.length === 1) {
            enumJson.enum_name = enumJson.name;
            const commandJson = moduleJson.commands[enumJson.command_references[0].command_index];
            commandJson.command_enums.push(enumJson);
        }
    });
}

/**
 * Creates a list of unique types used in command overload arguments at the module level.
 */
function formatCommandArgumentTypes(moduleJson: MinecraftCommandModule) {
    const commandTypes = new Map<string, MinecraftCommandArgumentType>();
    for (const commandJson of moduleJson.commands ?? []) {
        for (const overloadJson of commandJson.overloads ?? []) {
            for (const paramJson of overloadJson.params) {
                const typeJson = paramJson.type;
                typeJson.name = typeJson.name.toLowerCase();
                for (const enumJson of moduleJson.command_enums ?? []) {
                    if (typeJson.name === enumJson.name.toLowerCase()) {
                        typeJson.name = enumJson.name;

                        typeJson.is_enum = true;
                        if (enumJson.command_references.length > 1) {
                            typeJson.has_link = true;
                        }
                        if (enumJson.values.length === 1) {
                            typeJson.is_keyword = true;
                            typeJson.keyword_name = enumJson.values[0].value;
                        }
                        break;
                    }
                }
                if (!typeJson.is_enum) {
                    const mappedTypeName = commandTypeNameMappings[typeJson.name];
                    if (mappedTypeName) {
                        typeJson.name = mappedTypeName;
                    }
                    const mappedTypeSyntax = commandTypeSyntaxMappings[typeJson.name];
                    if (mappedTypeSyntax) {
                        typeJson.syntax = mappedTypeSyntax;
                    }
                    if (!commandTypes.has(typeJson.name)) {
                        commandTypes.set(typeJson.name, typeJson);
                    }
                }
            }
        }
    }
    moduleJson.command_types = Array.from(commandTypes.values());
}

/**
 * Create lists of unique arguments used across overloads at the command level.
 */
function formatCommandArguments(moduleJson: MinecraftCommandModule) {
    for (const commandJson of moduleJson.commands) {
        let commandArguments: MinecraftCommandArgument[] = [];
        commandJson.overloads.forEach(
            overloadJson => (commandArguments = commandArguments.concat(overloadJson.params))
        );
        for (const paramJson of commandArguments) {
            let count = 0;
            for (const other of commandArguments) {
                if (other.name === paramJson.name && other.type.name !== paramJson.type.name) {
                    ++count;
                }
            }
            const sanitizedName = (paramJson.type.keyword_name ?? paramJson.name).replace(/[^a-zA-Z0-9]/g, '');
            const typeSuffix = count > 0 ? `-${paramJson.type.name}` : '';
            paramJson.directory_name = `${sanitizedName}${typeSuffix}`;
        }
        const uniqueArguments = Array.from(new Map(commandArguments.map(p => [p.directory_name, p])).values());
        commandJson.arguments = uniqueArguments.filter(p => !p.type.is_keyword || p.is_optional);
    }
}

/**
 * Cleanup enums that don't need their own pages.
 */
function cleanupUnusedEnums(moduleJson: MinecraftCommandModule) {
    moduleJson.command_enums = moduleJson.command_enums.filter(
        enumJson => enumJson.values.length > 1 && enumJson.command_references.length > 1
    );
    moduleJson.commands.forEach(commandJson => {
        commandJson.command_enums = commandJson.command_enums.filter(enumJson => enumJson.values.length > 1);
    });
}

export const CommandMarkupFilter: Filter = [
    'command_markup',
    (releases: MinecraftRelease[]): void => {
        for (const release of releases) {
            for (const moduleJson of release.command_modules) {
                convertCommandPermissionLevelsToName(moduleJson);
                formatCommandEnums(moduleJson);
                formatCommandArgumentTypes(moduleJson);
                formatCommandArguments(moduleJson);
                cleanupUnusedEnums(moduleJson);
            }
        }
    },
];
