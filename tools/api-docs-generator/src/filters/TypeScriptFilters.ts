// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { MinecraftRelease } from '../MinecraftRelease';
import {
    MarkupCommentFlags,
    MinecraftFunction,
    MinecraftType,
    MinecraftTypeKeyList,
} from '../modules/MinecraftScriptModule';
import * as utils from '../utilities';
import { FilterGroup } from './Filters';

const typescriptTypeMappings: Record<string, string> = {
    int8: 'number',
    uint8: 'number',
    int16: 'number',
    uint16: 'number',
    int32: 'number',
    uint32: 'number',
    int64: 'number',
    uint64: 'number',
    float: 'number',
    double: 'number',
    error: 'unknown', // You can throw anything in JavaScript, so the type is unknown
};

/**
 * Create TypeScript 'next' and 'Symbol.iterator' methods for Iterator types.
 */
function generateIteratorMetadata(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            if (scriptModule.classes) {
                for (const classJson of scriptModule.classes) {
                    if (!classJson.iterator) {
                        continue;
                    }

                    const iteratorData = classJson.iterator;

                    const nextMethod: MinecraftFunction = {
                        name: 'next',
                        arguments: [],
                        is_constructor: false,
                        is_member: true,
                        is_static: false,
                        return_type: {
                            name: 'iterator_result',
                            iterator_type: iteratorData,
                            is_errorable: false,
                            is_bind_type: false,
                        },
                    };

                    const iteratorMethod: MinecraftFunction = {
                        name: '[Symbol.iterator]',
                        disable_unsafe_name_check: true,
                        arguments: [],
                        is_constructor: false,
                        is_member: true,
                        is_static: false,
                        return_type: {
                            name: 'iterator',
                            iterator_type: iteratorData,
                            is_errorable: false,
                            is_bind_type: false,
                        },
                    };

                    if (!classJson.functions) {
                        classJson.functions = [];
                    }
                    classJson.functions.push(nextMethod);
                    classJson.functions.push(iteratorMethod);
                }
            }
        }
    }
}

/**
 * Facade the JS Error base class for error types.
 */
function generateErrorMetadata(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            if (moduleJson.errors) {
                for (const errorJson of moduleJson.errors) {
                    if (errorJson.base_types === undefined) {
                        errorJson.base_types = [];
                    }

                    errorJson.base_types.push({
                        name: 'Error',
                        is_bind_type: false,
                        is_errorable: false,
                    });
                }
            }
        }
    }
}

function renameTypesForTypeScript(releases: MinecraftRelease[]) {
    const fixType = (typeJson: MinecraftType) => {
        const mappedTypeName = typescriptTypeMappings[typeJson.name];
        if (mappedTypeName) {
            typeJson.original_name = typeJson.name;
            typeJson.name = mappedTypeName;
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithAnyNamesFromList(
                scriptModule,
                MinecraftTypeKeyList,
                (jsonObject: Record<string, MinecraftType | MinecraftType[]>, propertyName: string) => {
                    const typeJson = jsonObject[propertyName];
                    if (Array.isArray(typeJson)) {
                        typeJson.forEach(fixType);
                    } else {
                        fixType(typeJson);
                    }
                }
            );
        }
    }
}

const typescriptArrayBufferTypeMappings: Record<string, string> = {
    int8: 'Uint8Array',
    uint8: 'Uint8Array',
    int16: 'Int16Array',
    uint16: 'Uint16Array',
    int32: 'Int32Array',
    uint32: 'Uint32Array',
    int64: 'BigInt64Array',
    uint64: 'BigUint64Array',
    float: 'Float32Array',
    double: 'Float64Array',
};
function generateArrayBufferTypes(releases: MinecraftRelease[]) {
    const fixType = (typeJson: MinecraftType) => {
        const mappedTypeName = typescriptArrayBufferTypeMappings[typeJson.name];
        if (mappedTypeName) {
            typeJson.original_name = typeJson.name;
            typeJson.name = mappedTypeName;
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithAnyNamesFromList(
                scriptModule,
                ['data_buffer_type'],
                (jsonObject: Record<string, MinecraftType | MinecraftType[]>, propertyName: string) => {
                    const typeJson = jsonObject[propertyName];
                    if (Array.isArray(typeJson)) {
                        typeJson.forEach(fixType);
                    } else {
                        fixType(typeJson);
                    }
                }
            );
        }
    }
}

function removeDuplicateVariantTypes(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithName(scriptModule, 'variant_types', jsonObject => {
                jsonObject.variant_types = jsonObject.variant_types.filter((item, index, self) => {
                    return (
                        index ===
                        self.findIndex(value => {
                            return value.name === item.name;
                        })
                    );
                });
            });
        }
    }
}

function escapeNameIfNeeded(objectWithName: {
    name: string;
    ts_name_should_escape?: boolean;
    disable_unsafe_name_check?: boolean;
}) {
    const name: string = objectWithName.name;
    objectWithName.ts_name_should_escape = false;

    if (objectWithName.disable_unsafe_name_check) {
        return;
    }

    if (escapedWords.indexOf(name) !== -1) {
        objectWithName.ts_name_should_escape = true;
    } else if (name.includes(' ')) {
        objectWithName.ts_name_should_escape = true;
    } else if (name.includes('.')) {
        objectWithName.ts_name_should_escape = true;
    } // Starts with number
    else if (/^\d/.test(name)) {
        objectWithName.ts_name_should_escape = true;
    }
}

/**
 * Words that must be escaped for TypeScript generation.
 *
 * See: https://github.com/microsoft/TypeScript/issues/2536#issuecomment-87194347
 */
const escapedWords: string[] = [
    // Reserved Words
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    // Strict Mode Reserved Words
    'as',
    'implements',
    'interface',
    'let',
    'package',
    'private',
    'protected',
    'public',
    'static',
    'yield',
    // Contextual Keywords
    'any',
    'boolean',
    'constructor',
    'declare',
    'get',
    'module',
    'require',
    'number',
    'set',
    'string',
    'symbol',
    'type',
    'from',
    'of',
];

function markNamesThatShouldBeEscaped(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            for (const functionJson of scriptModule.functions ?? []) {
                escapeNameIfNeeded(functionJson);
            }

            for (const classJson of scriptModule.classes ?? []) {
                for (const propertyJson of classJson.properties ?? []) {
                    escapeNameIfNeeded(propertyJson);
                }

                for (const constantJson of classJson.constants ?? []) {
                    escapeNameIfNeeded(constantJson);
                }

                for (const functionJson of classJson.functions ?? []) {
                    escapeNameIfNeeded(functionJson);
                }
            }

            for (const interfaceJson of scriptModule.interfaces ?? []) {
                for (const propertyJson of interfaceJson.properties ?? []) {
                    escapeNameIfNeeded(propertyJson);
                }
            }

            for (const enumJson of scriptModule.enums ?? []) {
                for (const constantJson of enumJson.constants) {
                    escapeNameIfNeeded(constantJson);
                }
            }
        }
    }
}

function flagTSComments(obj: MarkupCommentFlags): void {
    // Has Comments
    if (
        obj.has_comments ||
        obj.has_defaults ||
        obj.has_errors ||
        obj.is_prerelease ||
        obj.is_deprecated ||
        obj.has_privilege_comments ||
        obj.has_runtime_conditions
    ) {
        obj.ts_has_comments = true;
    } else {
        obj.ts_has_comments = false;
    }

    // Has Remarks
    if (obj.has_comments || obj.has_privilege_comments) {
        obj.ts_has_remarks = true;
    } else {
        obj.ts_has_remarks = false;
    }

    if (obj.has_privilege_comments || obj.has_defaults || obj.has_errors) {
        obj.msdocs_has_comments = true;
    }
}

function flagTSCommentsArray(obj: MarkupCommentFlags[]): void {
    for (const subObj of obj) {
        flagTSComments(subObj);
    }
}

/**
 * Flag objects that should have comments.
 */
function markObjectsWithComments(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            flagTSCommentsArray(scriptModule.constants ?? []);
            flagTSCommentsArray(scriptModule.objects ?? []);
            flagTSCommentsArray(scriptModule.type_aliases ?? []);

            for (const enumJson of scriptModule.enums ?? []) {
                flagTSComments(enumJson);
                flagTSCommentsArray(enumJson.constants ?? []);
            }

            for (const classJson of scriptModule.classes ?? []) {
                flagTSComments(classJson);
                flagTSCommentsArray(classJson.properties ?? []);
                flagTSCommentsArray(classJson.constants ?? []);

                for (const functionJson of classJson.functions ?? []) {
                    flagTSComments(functionJson);
                    flagTSCommentsArray(functionJson.arguments ?? []);
                }
            }

            for (const interfaceJson of scriptModule.interfaces ?? []) {
                flagTSComments(interfaceJson);
                flagTSCommentsArray(interfaceJson.properties ?? []);

                for (const functionJson of interfaceJson.functions ?? []) {
                    flagTSComments(functionJson);
                    flagTSCommentsArray(functionJson.arguments ?? []);
                }
            }

            for (const functionJson of scriptModule.functions ?? []) {
                flagTSComments(functionJson);
                flagTSCommentsArray(functionJson.arguments ?? []);
            }

            for (const errorJson of scriptModule.errors ?? []) {
                flagTSComments(errorJson);
                flagTSCommentsArray(errorJson.properties ?? []);
            }
        }
    }
}

export const TypeScriptFilters: FilterGroup = {
    id: 'ts',
    filtersBeforeCommon: [
        ['iterator_markup', generateIteratorMetadata],
        ['generate_error_metadata', generateErrorMetadata],
    ],
    filters: [
        ['generate_array_buffer_types', generateArrayBufferTypes],
        ['rename_types', renameTypesForTypeScript],
        ['remove_duplicate_variant_types', removeDuplicateVariantTypes],
        ['mark_names_that_should_be_escaped', markNamesThatShouldBeEscaped],
        ['mark_comments', markObjectsWithComments],
    ],
};
