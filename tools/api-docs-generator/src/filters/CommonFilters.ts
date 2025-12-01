// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';
import * as rt from 'runtypes';
import semver from 'semver';
import wrap from 'word-wrap';

import { FileLoader } from '../FileLoader';
import * as log from '../Logger';
import { getLatestScriptModules, MinecraftRelease } from '../MinecraftRelease';
import {
    getAfterEventsOrderingModuleFrom,
    MinecraftAfterEventsOrderByVersion,
} from '../modules/MinecraftAfterEventsOrderModule';
import { CommandMarkupFilter } from './CommandFilters';
import { MinecraftBlock, MinecraftBlockModule, MinecraftBlockProperty } from '../modules/MinecraftBlockModule';
import {
    ArrayChangelogEntry,
    ChangelogKey,
    isValueChangelogEntry,
    moduleHasChangelog,
} from '../modules/MinecraftChangelogTypes';
import {
    MinecraftCommand,
    MinecraftCommandArgumentType,
    MinecraftCommandEnum,
    MinecraftCommandModule,
} from '../modules/MinecraftCommandModule';
import {
    BlockDocsValidator,
    BlockPropertyDocsValidator,
    CommandDocsValidator,
    CommandEnumDocsValidator,
    CommonDocsDescriptionValidator,
    ScriptCommonDocsValidator,
    ScriptFunctionDocsValidator,
    ScriptNestedCommonDocsValidator,
    ScriptNestedFunctionDocsValidator,
} from '../modules/MinecraftDocsTypes';
import {
    hasConstants,
    hasFunctions,
    hasObjects,
    hasProperties,
    hasTypeAliases,
    MarkupCommentFlags,
    MinecraftClass,
    MinecraftConstant,
    MinecraftDocumentableObject,
    MinecraftEnum,
    MinecraftError,
    MinecraftFunction,
    MinecraftInterface,
    MinecraftModuleDependency,
    MinecraftModuleDescription,
    MinecraftObject,
    MinecraftProperty,
    MinecraftScriptModule,
    MinecraftType,
    MinecraftTypeAlias,
    MinecraftTypeAliasTypes,
    MinecraftTypeKeyList,
    MinecraftTypeMapping,
    PrivilegeTypes,
    PrivilegeValueType,
} from '../modules/MinecraftScriptModule';
import * as utils from '../utilities';
import { FilterGroup } from './Filters';

type DescriptionFormatCallback = (
    fromModule: MinecraftScriptModule,
    moduleJson: MinecraftScriptModule,
    memberJson?: Record<'name', string>,
    submemberJson?: Record<'name', string>
) => string;

const LINK_TAG = '@link';
const LINK_REGEX = new RegExp(`\\{${LINK_TAG} ([^\\s]+)\\}`, 'g');

function formatSymbolReference(
    str: string,
    linkMatches: RegExpMatchArray[],
    formatter: DescriptionFormatCallback,
    fromModule: MinecraftScriptModule,
    moduleJson: MinecraftScriptModule,
    memberJson?: Record<'name', string>,
    submemberJson?: Record<'name', string>
): string {
    let result = str;

    for (let i = linkMatches.length - 1; i >= 0; --i) {
        const currentMatch = linkMatches[i];
        const matchedString = currentMatch[0];
        const matchedSymbol = currentMatch[1];

        if (memberJson && submemberJson) {
            // ModuleName.ClassName.MemberName
            const pattern = `${moduleJson.name}.${memberJson.name}.${submemberJson.name}`;

            if (matchedSymbol === pattern) {
                result = result.replace(matchedString, formatter(fromModule, moduleJson, memberJson, submemberJson));
                linkMatches.splice(i, 1);
            }
        } else if (!memberJson && submemberJson) {
            // ModuleName.MemberName
            const pattern = `${moduleJson.name}.${submemberJson.name}`;

            if (matchedSymbol === pattern) {
                result = result.replace(matchedString, formatter(fromModule, moduleJson, undefined, submemberJson));
                linkMatches.splice(i, 1);
            }
        } else if (memberJson) {
            // ModuleName.ClassName
            const patternRegex = `${moduleJson.name}.${memberJson.name}`;

            if (matchedSymbol === patternRegex) {
                result = result.replace(matchedString, formatter(fromModule, moduleJson, memberJson, undefined));
                linkMatches.splice(i, 1);
            }
        } else if (!memberJson && !submemberJson) {
            // ModuleName
            const pattern = `${moduleJson.name}`;

            if (matchedSymbol === pattern) {
                result = result.replace(matchedString, formatter(fromModule, moduleJson, undefined, undefined));
                linkMatches.splice(i, 1);
            }
        }
    }

    return result;
}

function linkSymbols(
    description: string[],
    formatter: DescriptionFormatCallback,
    fromModule: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
): string[] {
    const result: string[] = [];

    for (let str of description) {
        if (!str.includes(LINK_TAG)) {
            result.push(str);
            continue;
        }

        const linkMatches = [...str.matchAll(LINK_REGEX)];

        moduleLoop: for (const moduleJson of allModules) {
            if (!str.includes(moduleJson.name)) {
                continue;
            }

            for (const functionJson of moduleJson.functions ?? []) {
                if (linkMatches.length === 0) {
                    break moduleLoop;
                }
                str = formatSymbolReference(
                    str,
                    linkMatches,
                    formatter,
                    fromModule,
                    moduleJson,
                    undefined,
                    functionJson
                );
            }

            for (const memberJson of moduleJson.classes ?? []) {
                for (const functionJson of memberJson.functions ?? []) {
                    if (linkMatches.length === 0) {
                        break moduleLoop;
                    }
                    str = formatSymbolReference(
                        str,
                        linkMatches,
                        formatter,
                        fromModule,
                        moduleJson,
                        memberJson,
                        functionJson
                    );
                }

                for (const propertyJson of memberJson.properties ?? []) {
                    if (linkMatches.length === 0) {
                        break moduleLoop;
                    }
                    str = formatSymbolReference(
                        str,
                        linkMatches,
                        formatter,
                        fromModule,
                        moduleJson,
                        memberJson,
                        propertyJson
                    );
                }

                for (const constantJson of memberJson.constants ?? []) {
                    if (linkMatches.length === 0) {
                        break moduleLoop;
                    }
                    str = formatSymbolReference(
                        str,
                        linkMatches,
                        formatter,
                        fromModule,
                        moduleJson,
                        memberJson,
                        constantJson
                    );
                }

                if (linkMatches.length === 0) {
                    break moduleLoop;
                }

                str = formatSymbolReference(str, linkMatches, formatter, fromModule, moduleJson, memberJson);
            }

            for (const interfaceJson of moduleJson.interfaces ?? []) {
                for (const propertiesJson of interfaceJson.properties ?? []) {
                    if (linkMatches.length === 0) {
                        break moduleLoop;
                    }
                    str = formatSymbolReference(
                        str,
                        linkMatches,
                        formatter,
                        fromModule,
                        moduleJson,
                        interfaceJson,
                        propertiesJson
                    );
                }

                if (linkMatches.length === 0) {
                    break moduleLoop;
                }

                str = formatSymbolReference(str, linkMatches, formatter, fromModule, moduleJson, interfaceJson);
            }

            for (const enumJson of moduleJson.enums ?? []) {
                for (const constantJson of enumJson.constants ?? []) {
                    if (linkMatches.length === 0) {
                        break moduleLoop;
                    }
                    str = formatSymbolReference(
                        str,
                        linkMatches,
                        formatter,
                        fromModule,
                        moduleJson,
                        enumJson,
                        constantJson
                    );
                }

                if (linkMatches.length === 0) {
                    break moduleLoop;
                }

                str = formatSymbolReference(str, linkMatches, formatter, fromModule, moduleJson, enumJson);
            }

            for (const objectJson of moduleJson.objects ?? []) {
                if (linkMatches.length === 0) {
                    break moduleLoop;
                }
                str = formatSymbolReference(str, linkMatches, formatter, fromModule, moduleJson, undefined, objectJson);
            }

            for (const constantJson of moduleJson.constants ?? []) {
                if (linkMatches.length === 0) {
                    break moduleLoop;
                }
                str = formatSymbolReference(
                    str,
                    linkMatches,
                    formatter,
                    fromModule,
                    moduleJson,
                    undefined,
                    constantJson
                );
            }

            for (const typeAliasJson of moduleJson.type_aliases ?? []) {
                if (linkMatches.length === 0) {
                    break moduleLoop;
                }
                str = formatSymbolReference(
                    str,
                    linkMatches,
                    formatter,
                    fromModule,
                    moduleJson,
                    undefined,
                    typeAliasJson
                );
            }

            if (linkMatches.length === 0) {
                break moduleLoop;
            }

            str = formatSymbolReference(str, linkMatches, formatter, fromModule, moduleJson);
        }

        result.push(str);
    }

    return result;
}

function generateMSDocsLink(
    _fromModule: MinecraftScriptModule,
    moduleJson: MinecraftScriptModule,
    classJson: MinecraftClass,
    memberJson: MinecraftConstant | MinecraftFunction | MinecraftProperty
) {
    if (classJson && memberJson) {
        // Class Member
        return `[*${moduleJson.name}.${classJson.name}.${memberJson.name}*](../../../${moduleJson.from_module.folder_path}/${moduleJson.filepath_name}/${classJson.name}.md#${memberJson.bookmark_name})`;
    } else if (!classJson && memberJson) {
        // Module Member
        return `[*${moduleJson.name}.${memberJson.name}*](../../../${moduleJson.from_module.folder_path}/${moduleJson.filepath_name}/${moduleJson.bookmark_name}.md#${memberJson.bookmark_name})`;
    } else if (classJson) {
        // Class
        return `[*${moduleJson.name}.${classJson.name}*](../../../${moduleJson.from_module.folder_path}/${moduleJson.filepath_name}/${classJson.name}.md)`;
    } else {
        // Module
        return `[*${moduleJson.name}*](../../../${moduleJson.from_module.folder_path}/${moduleJson.filepath_name}/${moduleJson.bookmark_name}.md)`;
    }
}

function generateTSDocsLink(
    fromModule: MinecraftScriptModule,
    moduleJson: MinecraftScriptModule,
    classJson: MinecraftClass,
    memberJson: MinecraftConstant | MinecraftFunction | MinecraftProperty
) {
    const isSameModule = fromModule.uuid === moduleJson.uuid;
    const isDependencyModule =
        fromModule.dependencies.some(dep => dep.name === moduleJson.name) ||
        fromModule.peer_dependencies.some(dep => dep.name === moduleJson.name);

    if (classJson && memberJson) {
        if (isSameModule) {
            return `{@link ${classJson.name}.${memberJson.name}}`;
        } else if (isDependencyModule) {
            return `{@link ${moduleJson.variable_name}.${classJson.name}.${memberJson.name}}`;
        } else {
            return `{@link ${moduleJson.name}.${classJson.name}.${memberJson.name}}`;
        }
    } else if (!classJson && memberJson) {
        if (isSameModule) {
            return `{@link ${memberJson.name}}`;
        } else if (isDependencyModule) {
            return `{@link ${moduleJson.variable_name}#${memberJson.name}}`;
        } else {
            return `{@link ${moduleJson.name}#${memberJson.name}}`;
        }
    } else if (classJson) {
        if (isSameModule) {
            return `{@link ${classJson.name}}`;
        } else if (isDependencyModule) {
            return `{@link ${moduleJson.variable_name}.${classJson.name}}`;
        } else {
            return `{@link ${moduleJson.name}.${classJson.name}}`;
        }
    } else {
        if (isDependencyModule) {
            return `{@link ${moduleJson.variable_name}}`;
        } else {
            return `{@link ${moduleJson.name}}`;
        }
    }
}

function splitStringByNewline(description: string[] | string): string[] {
    if (typeof description === 'string') {
        return description.split('\n');
    }
    return description;
}

function parseScriptRawTSDocText(scriptObject: MinecraftDocumentableObject, re?: RegExp): string[] | undefined {
    let result = undefined;
    if (scriptObject.is_script_generated && scriptObject.raw_tsdoc_text) {
        const regexp = re ?? /\/\*\*\n\s\*\s(\w.+?)\n/;
        const match = scriptObject.raw_tsdoc_text.match(regexp);
        if (match) {
            result = splitStringByNewline(match[1]);
        }
    }
    return result;
}

type DescriptionKey =
    | 'description'
    | 'module_description'
    | 'alias_description'
    | 'enum_description'
    | 'constant_description'
    | 'property_description'
    | 'class_description'
    | 'function_description'
    | 'returns_description'
    | 'throws_description'
    | 'argument_description'
    | 'deprecated_description';

type DescriptionKeyMD = `${DescriptionKey}_md`;
type DescriptionKeyTS = `${DescriptionKey}_ts`;

type DescriptionKeyMarkup = DescriptionKey | DescriptionKeyMD | DescriptionKeyTS;

function addDescriptionFields(
    jsonObject: MinecraftDocumentableObject & Partial<Record<DescriptionKeyMarkup, string[]>>,
    description: string[],
    descriptionKey: DescriptionKey,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
): void {
    jsonObject[descriptionKey] = description;

    const mdDescription = linkSymbols(description, generateMSDocsLink, moduleJson, allModules);
    jsonObject[`${descriptionKey}_md`] = mdDescription;

    const tsDescription = linkSymbols(description, generateTSDocsLink, moduleJson, allModules);
    const tsDescriptionWrapped: string[] = [];
    for (const line of tsDescription) {
        const wrappedLines = wrap(line, { width: 60, indent: '', trim: true });
        tsDescriptionWrapped.push(...wrappedLines.split('\n'));
    }
    jsonObject[`${descriptionKey}_ts`] = tsDescriptionWrapped;
}

/**
 * Parses 'info.json' files and validates data structure according to layout.
 *
 * Example:
 * ```
 * {
 *   "default": {...} // For unmatched versions
 *   "1": {...} // Major version 1
 *   "2": {...} // Major version 2
 *   "beta": {...}
 *   "alpha": {...}
 *   "internal": {...}
 * }
 * ```
 */
function parseInfoJsonSafe<T1 extends rt.Runtype, T2 extends rt.Runtype, U = rt.Static<T2>>(
    fileLoader: FileLoader,
    jsonPath: string,
    scriptModuleVersion: semver.SemVer,
    validator: T1,
    nestedValidator: T2
): U | undefined {
    if (fileLoader.canLoadFile(jsonPath)) {
        try {
            const fileData = fileLoader.readFile(jsonPath);
            const json = JSON.parse(fileData.toString()) as Record<string, unknown>;

            try {
                if (json['description'] || json['arguments'] || json['return']) {
                    return nestedValidator.check(json) as U;
                }

                validator.check(json);

                const keys = Object.keys(json)
                    .sort((key1, key2) => key1.localeCompare(key2))
                    .reverse();

                for (const key of keys) {
                    if (key === 'default') {
                        continue;
                    }

                    if (key === scriptModuleVersion.major.toString()) {
                        return nestedValidator.check(json[key]) as U;
                    }

                    if (
                        (key === 'beta' || key === 'alpha' || key === 'internal') &&
                        scriptModuleVersion.prerelease.some(prereleaseTag => {
                            return prereleaseTag.toString().includes(key);
                        })
                    ) {
                        return nestedValidator.check(json[key]) as U;
                    }
                }

                return nestedValidator.check(json['default']) as U;
            } catch (e) {
                if (e instanceof rt.ValidationError) {
                    log.error(`JSON file '${jsonPath}' does not match expected format: ${e.message}`);
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                log.error(`JSON file '${jsonPath}' had errors: ${e.message}`);
            }
        }
    } else {
        log.printOption(`JSON file '${jsonPath}' does not exist.`, 'undocumentedApis');
    }
    return undefined;
}

function parseJsonSafe<T extends rt.Runtype, U = rt.Static<T>>(
    fileLoader: FileLoader,
    jsonPath: string,
    validator: T
): U | undefined {
    if (fileLoader.canLoadFile(jsonPath)) {
        try {
            const fileData = fileLoader.readFile(jsonPath);
            const json = JSON.parse(fileData.toString()) as unknown;
            try {
                return validator.check(json) as U;
            } catch (e) {
                if (e instanceof rt.ValidationError) {
                    log.error(`JSON file '${jsonPath}' does not match expected format: ${e.message}`);
                }
            }
        } catch (e) {
            if (e instanceof Error) {
                log.error(`JSON file '${jsonPath}' had errors: ${e.message}`);
            }
        }
    } else {
        log.printOption(`JSON file '${jsonPath}' does not exist.`, 'undocumentedApis');
    }
    return undefined;
}

type NamedDocumentedObject = MinecraftDocumentableObject & { name: string };
type InfoJson = { description?: string | string[] };
type InfoJsonWithDeprecated = InfoJson & {
    deprecated?: { description?: string | string[] };
};
type InfoJsonWithThrows = InfoJson & {
    throws?: { description?: string | string[] };
};
type InfoJsonWithReturns = InfoJson & {
    returns?: { description?: string | string[] };
};

function getDescriptionOrTSDoc(jsonObject: NamedDocumentedObject, infoJson: InfoJson): string[] | undefined {
    let result: string[] | undefined;
    if (infoJson && infoJson.description) {
        result = splitStringByNewline(infoJson.description);
    } else if (jsonObject.raw_tsdoc_text) {
        result = parseScriptRawTSDocText(jsonObject);
    }
    return result;
}

function getDeprecatedDescriptionOrTSDoc(
    jsonObject: NamedDocumentedObject,
    infoJson: InfoJsonWithDeprecated
): string[] | undefined {
    let result: string[] | undefined;
    if (infoJson && infoJson.deprecated) {
        if (jsonObject.is_deprecated) {
            if (infoJson.deprecated.description) {
                result = splitStringByNewline(infoJson.deprecated.description);
            } else {
                log.warn(`${jsonObject.name} has 'deprecated' field with no description`);
            }
        } else {
            log.warn(`${jsonObject.name} has 'deprecated' field but is not a deprecated API`);
        }
    } else if (jsonObject.raw_tsdoc_text) {
        result = parseScriptRawTSDocText(jsonObject, /@deprecated\s(.+?)\n/);
    }
    return result;
}

function getThrowsDescriptionOrTSDoc(
    jsonObject: NamedDocumentedObject,
    infoJson: InfoJsonWithThrows
): string[] | undefined {
    let result: string[] | undefined;
    if (infoJson && infoJson.throws) {
        if (infoJson.throws.description) {
            result = splitStringByNewline(infoJson.throws.description);
        } else {
            log.warn(`${jsonObject.name} has 'throws' field with no description`);
        }
    } else if (jsonObject.raw_tsdoc_text) {
        result = parseScriptRawTSDocText(jsonObject, /@throws\s(.+?)\n/);
    }
    return result;
}

function getReturnsDescriptionOrTSDoc(
    jsonObject: NamedDocumentedObject,
    infoJson: InfoJsonWithReturns
): string[] | undefined {
    let result: string[] | undefined;
    if (infoJson && infoJson.returns) {
        if (infoJson.returns.description) {
            result = splitStringByNewline(infoJson.returns.description);
        } else {
            log.warn(`${jsonObject.name} has 'returns' field with no description`);
        }
    } else if (jsonObject.raw_tsdoc_text) {
        result = parseScriptRawTSDocText(jsonObject, /@returns\s(.+?)\n/);
    }
    return result;
}

const ArrayOfStrings = rt.Array(rt.String);

function addExamples(
    fileLoader: FileLoader,
    metadataJson: MinecraftDocumentableObject,
    metadataFolder: string,
    moduleFolderPath: string
): void {
    const exampleFilePaths = [];

    const examplesDirectory = path.join(metadataFolder, '_examples');
    const exampleFilesFromExamplesDirectory = utils.getFiles(fileLoader.joinToRoot(examplesDirectory));
    for (const exampleFilePath of exampleFilesFromExamplesDirectory) {
        exampleFilePaths.push(path.join(examplesDirectory, path.basename(exampleFilePath)));
    }

    const externalExamplesFile = path.join(metadataFolder, '_example_files.json');
    const externalExampleFilePaths = parseJsonSafe(fileLoader, externalExamplesFile, ArrayOfStrings);
    if (externalExampleFilePaths) {
        for (const exampleFilePath of externalExampleFilePaths) {
            exampleFilePaths.push(path.join(moduleFolderPath, '_shared_examples', exampleFilePath));
        }
    }

    if (exampleFilePaths.length > 0) {
        for (const examplePath of exampleFilePaths) {
            const exampleName = path.basename(examplePath);

            const exampleFileData = fileLoader.readFile(examplePath);
            const exampleFileStrings: string[] = exampleFileData
                .toString()
                .split('\n')
                .map(line => line.replace(/\n|\r/, ''));
            if (exampleFileStrings.at(-1) === '') {
                exampleFileStrings.splice(-1); // Remove newline at end of example file
            }

            const escapedExampleFileStrings = exampleFileStrings.map(line =>
                line.replace(/\/\*/g, `/\\*`).replace(/\*\//g, `*\\/`)
            );
            metadataJson.has_comments = true;
            metadataJson.examples.push({
                name: exampleName,
                code: {
                    text: exampleFileStrings,
                    escaped_text: escapedExampleFileStrings,
                },
            });
        }
    }
}

function addModuleDescriptions(
    fileLoader: FileLoader,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
) {
    moduleJson.examples = [];
    moduleJson.has_comments = false;

    const moduleFolder = moduleJson.name;
    const infoPath = path.join(moduleFolder, 'info.json');
    const infoJson = parseInfoJsonSafe(
        fileLoader,
        infoPath,
        semver.parse(moduleJson.version),
        ScriptCommonDocsValidator,
        ScriptNestedCommonDocsValidator
    );

    const moduleDescription = getDescriptionOrTSDoc(moduleJson, infoJson);
    if (moduleDescription) {
        moduleJson.has_comments = true;
        addDescriptionFields(moduleJson, moduleDescription, 'module_description', moduleJson, allModules);
    }

    addExamples(fileLoader, moduleJson, moduleFolder, moduleFolder);
}

function addFunctionDescriptions(
    fileLoader: FileLoader,
    functionJson: MinecraftFunction,
    functionFolder: string,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
) {
    functionJson.examples = [];
    functionJson.has_comments = false;

    const infoPath = path.join(functionFolder, 'info.json');
    const infoJson = parseInfoJsonSafe(
        fileLoader,
        infoPath,
        semver.parse(moduleJson.version),
        ScriptFunctionDocsValidator,
        ScriptNestedFunctionDocsValidator
    );

    const functionDescription = getDescriptionOrTSDoc(functionJson, infoJson);
    if (functionDescription) {
        functionJson.has_comments = true;
        addDescriptionFields(functionJson, functionDescription, 'function_description', moduleJson, allModules);
    }

    const deprecatedDescription = getDeprecatedDescriptionOrTSDoc(functionJson, infoJson);
    if (deprecatedDescription) {
        functionJson.has_comments = true;
        addDescriptionFields(functionJson, deprecatedDescription, 'deprecated_description', moduleJson, allModules);
    }

    const throwsDescription = getThrowsDescriptionOrTSDoc(functionJson, infoJson);
    if (throwsDescription) {
        functionJson.has_comments = true;
        addDescriptionFields(functionJson, throwsDescription, 'throws_description', moduleJson, allModules);
    }

    const returnsDescription = getReturnsDescriptionOrTSDoc(functionJson, infoJson);
    if (returnsDescription) {
        functionJson.has_comments = true;
        addDescriptionFields(functionJson, returnsDescription, 'returns_description', moduleJson, allModules);
    }

    const argumentsDescriptions = new Map<string, string[]>();
    if (functionJson.raw_tsdoc_text) {
        const argumentsRegExp = /@param\s(\w+?)\s-\s(.+?)\n/g;
        let argumentsMatch = undefined;
        do {
            argumentsMatch = argumentsRegExp.exec(functionJson.raw_tsdoc_text);
            if (argumentsMatch) {
                argumentsDescriptions.set(argumentsMatch[1], splitStringByNewline(argumentsMatch[2]));
            }
        } while (argumentsMatch);
    }

    if (infoJson && infoJson.arguments) {
        if (functionJson.arguments) {
            for (const argumentJson of functionJson.arguments) {
                const argumentInfoJson = infoJson.arguments[argumentJson.name];
                if (argumentInfoJson) {
                    if (argumentInfoJson.description) {
                        argumentsDescriptions.set(
                            argumentJson.name,
                            splitStringByNewline(argumentInfoJson.description)
                        );
                    }
                    if (argumentInfoJson.valid_values) {
                        const validValues = [];
                        for (let i = 0; i < argumentInfoJson.valid_values.length; ++i) {
                            validValues.push({
                                argument_valid_value: argumentInfoJson.valid_values[i],
                                argument_valid_value_end: i >= argumentInfoJson.valid_values.length - 1,
                            });
                        }

                        argumentJson.argument_valid_values = validValues;
                    }
                }
            }
        }
    }
    for (const argumentJson of functionJson.arguments) {
        const argumentDescription = argumentsDescriptions.get(argumentJson.name);
        if (argumentDescription) {
            functionJson.has_comments = true;
            argumentJson.has_comments = true;
            addDescriptionFields(argumentJson, argumentDescription, 'argument_description', moduleJson, allModules);
        }
    }

    addExamples(fileLoader, functionJson, functionFolder, moduleJson.name);
}

function addPropertyDescriptions(
    fileLoader: FileLoader,
    propertyJson: MinecraftConstant | MinecraftProperty | MinecraftObject,
    propertyFolder: string,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
) {
    propertyJson.examples = [];
    propertyJson.has_comments = false;

    const infoPath = path.join(propertyFolder, 'info.json');
    const infoJson = parseInfoJsonSafe(
        fileLoader,
        infoPath,
        semver.parse(moduleJson.version),
        ScriptCommonDocsValidator,
        ScriptNestedCommonDocsValidator
    );

    const propertyDescription = getDescriptionOrTSDoc(propertyJson, infoJson);
    if (propertyDescription) {
        propertyJson.has_comments = true;
        addDescriptionFields(propertyJson, propertyDescription, 'property_description', moduleJson, allModules);
    }

    const deprecatedDescription = getDeprecatedDescriptionOrTSDoc(propertyJson, infoJson);
    if (deprecatedDescription) {
        propertyJson.has_comments = true;
        addDescriptionFields(propertyJson, deprecatedDescription, 'deprecated_description', moduleJson, allModules);
    }

    const throwsDescription = getThrowsDescriptionOrTSDoc(propertyJson, infoJson);
    if (throwsDescription) {
        propertyJson.has_comments = true;
        addDescriptionFields(propertyJson, throwsDescription, 'throws_description', moduleJson, allModules);
    }

    addExamples(fileLoader, propertyJson, propertyFolder, moduleJson.name);
}

function addClassDescriptions(
    fileLoader: FileLoader,
    classJson: MinecraftClass | MinecraftInterface | MinecraftError,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
) {
    classJson.examples = [];
    classJson.has_comments = false;

    const classFolder = path.join(moduleJson.name, classJson.name);
    const infoPath = path.join(classFolder, 'info.json');
    const infoJson = parseInfoJsonSafe(
        fileLoader,
        infoPath,
        semver.parse(moduleJson.version),
        ScriptCommonDocsValidator,
        ScriptNestedCommonDocsValidator
    );

    const classDescription = getDescriptionOrTSDoc(classJson, infoJson);
    if (classDescription) {
        classJson.has_comments = true;
        addDescriptionFields(classJson, classDescription, 'class_description', moduleJson, allModules);
    }

    const deprecatedDescription = getDeprecatedDescriptionOrTSDoc(classJson, infoJson);
    if (deprecatedDescription) {
        classJson.has_comments = true;
        addDescriptionFields(classJson, deprecatedDescription, 'deprecated_description', moduleJson, allModules);
    }

    addExamples(fileLoader, classJson, classFolder, moduleJson.name);

    if (classJson.properties) {
        for (const propertyJson of classJson.properties) {
            const constantFolder = path.join(classFolder, propertyJson.name);
            addPropertyDescriptions(fileLoader, propertyJson, constantFolder, moduleJson, allModules);
        }
    }

    if (hasConstants(classJson)) {
        for (const constantJson of classJson.constants) {
            const constantFolder = path.join(classFolder, constantJson.name);
            addPropertyDescriptions(fileLoader, constantJson, constantFolder, moduleJson, allModules);
        }
    }

    if (hasFunctions(classJson)) {
        for (const functionJson of classJson.functions) {
            const functionFolder = path.join(classFolder, functionJson.name);
            addFunctionDescriptions(fileLoader, functionJson, functionFolder, moduleJson, allModules);
        }
    }
}

function addEnumDescriptions(
    fileLoader: FileLoader,
    enumJson: MinecraftEnum,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
) {
    enumJson.examples = [];
    enumJson.has_comments = false;

    const enumFolder = path.join(moduleJson.name, enumJson.name);
    const infoPath = path.join(enumFolder, 'info.json');
    const infoJson = parseInfoJsonSafe(
        fileLoader,
        infoPath,
        semver.parse(moduleJson.version),
        ScriptCommonDocsValidator,
        ScriptNestedCommonDocsValidator
    );

    const enumDescription = getDescriptionOrTSDoc(enumJson, infoJson);
    if (enumDescription) {
        enumJson.has_comments = true;
        addDescriptionFields(enumJson, enumDescription, 'enum_description', moduleJson, allModules);
    }

    const deprecatedDescription = getDeprecatedDescriptionOrTSDoc(enumJson, infoJson);
    if (deprecatedDescription) {
        enumJson.has_comments = true;
        addDescriptionFields(enumJson, deprecatedDescription, 'deprecated_description', moduleJson, allModules);
    }

    for (const constantJson of enumJson.constants) {
        const constantFolder = path.join(enumFolder, constantJson.name);
        addPropertyDescriptions(fileLoader, constantJson, constantFolder, moduleJson, allModules);
    }
}

function addTypeAliasDescriptions(
    fileLoader: FileLoader,
    aliasJson: MinecraftTypeAlias,
    moduleJson: MinecraftScriptModule,
    allModules: MinecraftScriptModule[]
) {
    aliasJson.examples = [];
    aliasJson.has_comments = false;

    const aliasFolder = path.join(moduleJson.name, aliasJson.name);
    const infoPath = path.join(aliasFolder, 'info.json');
    const infoJson = parseInfoJsonSafe(
        fileLoader,
        infoPath,
        semver.parse(moduleJson.version),
        ScriptCommonDocsValidator,
        ScriptNestedCommonDocsValidator
    );

    const aliasDescription = getDescriptionOrTSDoc(aliasJson, infoJson);
    if (aliasDescription) {
        aliasJson.has_comments = true;
        addDescriptionFields(aliasJson, aliasDescription, 'alias_description', moduleJson, allModules);
    }

    const deprecatedDescription = getDeprecatedDescriptionOrTSDoc(aliasJson, infoJson);
    if (deprecatedDescription) {
        aliasJson.has_comments = true;
        addDescriptionFields(aliasJson, deprecatedDescription, 'deprecated_description', moduleJson, allModules);
    }

    addExamples(fileLoader, aliasJson, aliasFolder, moduleJson.name);
}

function addCommandEnumDescriptions(fileLoader: FileLoader, enumJson: MinecraftCommandEnum, moduleFolderPath: string) {
    enumJson.has_comments = false;

    const enumName = enumJson.name;
    const enumFolderPath = path.join(moduleFolderPath, 'command_enums', enumName);

    const infoPath = path.join(enumFolderPath, 'info.json');
    const infoJson = parseJsonSafe(fileLoader, infoPath, CommandEnumDocsValidator);
    if (infoJson) {
        if (infoJson.description) {
            enumJson.has_comments = true;
            enumJson.enum_description = splitStringByNewline(infoJson.description);
        }
        if (infoJson.values) {
            for (const valueJson of enumJson.values) {
                const valueInfoJson = infoJson.values.find(v => valueJson.value === v.name);
                if (valueInfoJson && valueInfoJson.description) {
                    valueJson.has_comments = true;
                    valueJson.value_description = splitStringByNewline(valueInfoJson.description);
                }
            }
        }
    }
}

function addCommandTypeDescriptions(
    fileLoader: FileLoader,
    typeJson: MinecraftCommandArgumentType,
    moduleFolderPath: string
) {
    typeJson.has_comments = false;

    const typeName = typeJson.name;
    const typeFolderPath = path.join(moduleFolderPath, 'command_types', typeName);

    const infoPath = path.join(typeFolderPath, 'info.json');
    const infoJson = parseJsonSafe(fileLoader, infoPath, CommonDocsDescriptionValidator);
    if (infoJson && infoJson.description) {
        typeJson.has_comments = true;
        typeJson.type_description = splitStringByNewline(infoJson.description);
    }
}

function addCommandDescriptions(fileLoader: FileLoader, commandJson: MinecraftCommand, moduleFolderPath: string) {
    commandJson.has_comments = false;

    const commandName = commandJson.name;
    const commandFolderPath = path.join(moduleFolderPath, 'commands', commandName);

    const infoPath = path.join(commandFolderPath, 'info.json');
    const infoJson = parseJsonSafe(fileLoader, infoPath, CommandDocsValidator);
    if (infoJson) {
        if (infoJson.description) {
            commandJson.has_comments = true;
            commandJson.command_description = splitStringByNewline(infoJson.description);
        }
        if (infoJson.overloads) {
            for (const overloadJson of commandJson.overloads) {
                const overloadInfoJson = infoJson.overloads.find(o => Number(overloadJson.name) === o.id);
                if (overloadInfoJson && overloadInfoJson.description) {
                    overloadJson.has_comments = true;
                    overloadJson.overload_description = splitStringByNewline(overloadInfoJson.description);
                    if (overloadInfoJson.header) {
                        overloadJson.overload_header = overloadInfoJson.header;
                    }
                }
            }
        }
        if (infoJson.arguments) {
            for (const argumentJson of commandJson.arguments) {
                const argInfoJson = infoJson.arguments.find(a => argumentJson.directory_name === a.name);
                if (argInfoJson && argInfoJson.description) {
                    argumentJson.has_comments = true;
                    argumentJson.argument_description = splitStringByNewline(argInfoJson.description);
                }
            }
        }
    }

    if (commandJson.command_enums) {
        for (const enumJson of commandJson.command_enums) {
            addCommandEnumDescriptions(fileLoader, enumJson, commandFolderPath);
        }
    }
}

function addBlockPropertyDescriptions(
    fileLoader: FileLoader,
    blockPropertyJson: MinecraftBlockProperty,
    moduleFolderPath: string
) {
    blockPropertyJson.has_comments = false;

    const propertyName = blockPropertyJson.name;
    const propertyFolderPath = path.join(moduleFolderPath, 'block_properties', propertyName);

    const infoPath = path.join(propertyFolderPath, 'info.json');
    const infoJson = parseJsonSafe(fileLoader, infoPath, BlockPropertyDocsValidator);
    if (infoJson) {
        if (infoJson.description) {
            blockPropertyJson.has_comments = true;
            blockPropertyJson.property_description = splitStringByNewline(infoJson.description);
        }
        blockPropertyJson.int_value_display_as_range = !!infoJson.int_value_display_as_range;

        if (infoJson.values) {
            for (const valueJson of blockPropertyJson.values) {
                const valInfoJson = infoJson.values.find(v => valueJson.value === v.name);
                if (valInfoJson && valInfoJson.description) {
                    valueJson.has_comments = true;
                    valueJson.value_description = splitStringByNewline(valInfoJson.description);
                }
            }
        }
    }
}

function addBlockDescriptions(fileLoader: FileLoader, blockJson: MinecraftBlock, moduleFolderPath: string) {
    blockJson.has_comments = false;

    const blockName = blockJson.name;
    const blockFolderPath = path.join(moduleFolderPath, 'blocks', blockName);

    const infoPath = path.join(blockFolderPath, 'info.json');
    const infoJson = parseJsonSafe(fileLoader, infoPath, BlockDocsValidator);
    if (infoJson) {
        if (infoJson.description) {
            blockJson.has_comments = true;
            blockJson.block_description = splitStringByNewline(infoJson.description);
        }
        if (infoJson.properties) {
            for (const propJson of blockJson.properties) {
                const propInfoJson = infoJson.properties.find(p => propJson.name === p.name);
                if (propInfoJson && propInfoJson.description) {
                    propJson.has_comments = true;
                    propJson.property_description = splitStringByNewline(propInfoJson.description);
                }
            }
        }
    }
}

function getLatestDependentScriptModules(allModules: MinecraftScriptModule[], moduleJson: MinecraftScriptModule) {
    const dependentModules = allModules.filter(sm => {
        if (sm === moduleJson) {
            return true;
        }

        for (const dep of moduleJson.dependencies.concat(moduleJson.peer_dependencies)) {
            if (dep.uuid === sm.uuid) {
                for (const depVersion of dep.versions) {
                    if (semver.major(sm.version) === semver.major(depVersion.version)) {
                        return true;
                    }
                }
            }
        }

        return false;
    });

    return getLatestScriptModules(dependentModules);
}

/**
 * Process documentation files and add descriptions and examples to each API.
 */
function addDescriptionsAndExamples(releases: MinecraftRelease[], fileLoader?: FileLoader) {
    if (!fileLoader) {
        return;
    }

    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            const dependentModules = getLatestDependentScriptModules(release.script_modules, moduleJson);

            addModuleDescriptions(fileLoader, moduleJson, dependentModules);

            if (moduleJson.classes) {
                for (const classJson of moduleJson.classes) {
                    addClassDescriptions(fileLoader, classJson, moduleJson, dependentModules);
                }
            }

            if (moduleJson.interfaces) {
                for (const interfaceJson of moduleJson.interfaces) {
                    addClassDescriptions(fileLoader, interfaceJson, moduleJson, dependentModules);
                }
            }

            if (moduleJson.errors) {
                for (const errorJson of moduleJson.errors) {
                    addClassDescriptions(fileLoader, errorJson, moduleJson, dependentModules);
                }
            }

            if (moduleJson.type_aliases) {
                for (const aliasJson of moduleJson.type_aliases) {
                    addTypeAliasDescriptions(fileLoader, aliasJson, moduleJson, dependentModules);
                }
            }

            if (moduleJson.functions) {
                for (const functionJson of moduleJson.functions) {
                    const functionFolder = path.join(moduleJson.name, functionJson.name);
                    addFunctionDescriptions(fileLoader, functionJson, functionFolder, moduleJson, dependentModules);
                }
            }

            if (moduleJson.constants) {
                for (const constantJson of moduleJson.constants) {
                    const constantFolder = path.join(moduleJson.name, constantJson.name);
                    addPropertyDescriptions(fileLoader, constantJson, constantFolder, moduleJson, dependentModules);
                }
            }

            if (moduleJson.objects) {
                for (const objectJson of moduleJson.objects) {
                    const objectFolder = path.join(moduleJson.name, objectJson.name);
                    addPropertyDescriptions(fileLoader, objectJson, objectFolder, moduleJson, dependentModules);
                }
            }

            if (moduleJson.enums) {
                for (const enumJson of moduleJson.enums) {
                    addEnumDescriptions(fileLoader, enumJson, moduleJson, dependentModules);
                }
            }
        }

        for (const moduleJson of release.command_modules) {
            for (const commandJson of moduleJson.commands ?? []) {
                addCommandDescriptions(fileLoader, commandJson, moduleJson.name);
            }

            for (const enumJson of moduleJson.command_enums ?? []) {
                addCommandEnumDescriptions(fileLoader, enumJson, moduleJson.name);
            }

            for (const typeJson of moduleJson.command_types ?? []) {
                addCommandTypeDescriptions(fileLoader, typeJson, moduleJson.name);
            }
        }

        for (const moduleJson of release.block_modules) {
            for (const dataItemsJson of moduleJson.data_items ?? []) {
                addBlockDescriptions(fileLoader, dataItemsJson, moduleJson.name);
            }

            for (const blockPropertyJson of moduleJson.block_properties ?? []) {
                addBlockPropertyDescriptions(fileLoader, blockPropertyJson, moduleJson.name);
            }
        }
    }
}

function blockFilters(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const moduleJson of release.block_modules) {
            moduleJson.data_items.forEach((dataItemsJson: MinecraftBlock) => {
                const split = dataItemsJson.name.split(':');
                dataItemsJson.namespace = split[0];
                dataItemsJson.name = split[1];
            });

            moduleJson.block_properties.forEach(blockPropertyJson => {
                if (blockPropertyJson.type === 'int') {
                    blockPropertyJson.min_value = blockPropertyJson.values.at(0).value as number;
                    blockPropertyJson.max_value = blockPropertyJson.values.at(-1).value as number;
                }
            });
        }
    }
}

function markupCategoriesOnScriptModule(moduleJson: MinecraftScriptModule) {
    moduleJson.module_name = moduleJson.name;

    if (moduleJson.constants) {
        for (const constantJson of moduleJson.constants) {
            constantJson.property_name = constantJson.name;
        }
        moduleJson.constants.sort(utils.nameSortComparer);
    }

    if (moduleJson.functions) {
        for (const functionJson of moduleJson.functions) {
            functionJson.function_name = functionJson.name;
        }
        moduleJson.functions.sort(utils.nameSortComparer);
    }

    if (moduleJson.type_aliases) {
        for (const aliasJson of moduleJson.type_aliases) {
            aliasJson.alias_name = aliasJson.name;
        }
        moduleJson.type_aliases.sort(utils.nameSortComparer);
    }

    if (moduleJson.classes) {
        for (const classJson of moduleJson.classes) {
            classJson.class_name = classJson.name;

            if (classJson.properties) {
                for (const propertyJson of classJson.properties) {
                    propertyJson.property_name = propertyJson.name;
                }
                classJson.properties.sort(utils.nameSortComparer);
            }

            if (classJson.constants) {
                for (const constantJson of classJson.constants) {
                    constantJson.property_name = constantJson.name;
                }
                classJson.constants.sort(utils.nameSortComparer);
            }

            if (classJson.functions) {
                for (const functionJson of classJson.functions) {
                    functionJson.function_name = functionJson.name;
                }
                classJson.functions.sort(utils.nameSortComparer);
            }
        }
        moduleJson.classes.sort(utils.nameSortComparer);
    }

    if (moduleJson.interfaces) {
        for (const interfaceJson of moduleJson.interfaces) {
            interfaceJson.class_name = interfaceJson.name;

            if (interfaceJson.properties) {
                for (const propertyJson of interfaceJson.properties) {
                    propertyJson.property_name = propertyJson.name;
                }
                interfaceJson.properties.sort(utils.nameSortComparer);
            }

            if (interfaceJson.functions) {
                for (const functionJson of interfaceJson.functions) {
                    functionJson.function_name = functionJson.name;
                }
                interfaceJson.functions.sort(utils.nameSortComparer);
            }
        }
        moduleJson.interfaces.sort(utils.nameSortComparer);
    }

    if (moduleJson.enums) {
        for (const enumJson of moduleJson.enums) {
            enumJson.enum_name = enumJson.name;
            enumJson.is_enum = true;

            if (enumJson.constants) {
                for (const constantJson of enumJson.constants) {
                    constantJson.property_name = constantJson.name;
                }
                enumJson.constants.sort((lhs, rhs) => {
                    if (typeof lhs.value === 'string' && typeof rhs.value === 'string') {
                        return lhs.value.localeCompare(rhs.value);
                    } else {
                        return (lhs.value as number) - (rhs.value as number);
                    }
                });
            }
        }
        moduleJson.enums.sort(utils.nameSortComparer);
    }

    if (moduleJson.errors) {
        for (const errorJson of moduleJson.errors) {
            errorJson.class_name = errorJson.name;

            if (errorJson.properties) {
                for (const propertyJson of errorJson.properties) {
                    propertyJson.property_name = propertyJson.name;
                }
                errorJson.properties.sort(utils.nameSortComparer);
            }
        }
        moduleJson.errors.sort(utils.nameSortComparer);
    }
}

function markupCategoriesOnCommandsModule(moduleJson: MinecraftCommandModule) {
    moduleJson.module_name = moduleJson.name;

    if (moduleJson.commands) {
        for (const commandJson of moduleJson.commands) {
            commandJson.command_name = commandJson.name;

            if (commandJson.overloads) {
                for (const overloadJson of commandJson.overloads) {
                    for (const paramJson of overloadJson.params) {
                        paramJson.param_name = paramJson.type.is_keyword ? paramJson.type.keyword_name : paramJson.name;
                    }
                }
            }

            if (commandJson.arguments) {
                for (const paramJson of commandJson.arguments) {
                    paramJson.param_name = paramJson.type.is_keyword ? paramJson.type.keyword_name : paramJson.name;
                }
                commandJson.arguments.sort(utils.nameSortComparer);
            }

            if (commandJson.command_enums) {
                for (const enumJson of commandJson.command_enums) {
                    enumJson.enum_name = enumJson.name;
                }
                commandJson.command_enums.sort(utils.nameSortComparer);
            }
        }
        moduleJson.commands.sort(utils.nameSortComparer);
    }

    if (moduleJson.command_enums) {
        for (const enumJson of moduleJson.command_enums) {
            enumJson.enum_name = enumJson.name;
        }
        moduleJson.command_enums.sort(utils.nameSortComparer);
    }

    if (moduleJson.command_types) {
        for (const typeJson of moduleJson.command_types) {
            typeJson.type_name = typeJson.name;
        }
        moduleJson.command_types.sort(utils.nameSortComparer);
    }
}

function markupCategoriesOnBlocksModule(moduleJson: MinecraftBlockModule) {
    moduleJson.module_name = moduleJson.name;

    if (moduleJson.data_items) {
        for (const blockJson of moduleJson.data_items) {
            blockJson.block_name = blockJson.name;
        }
    }

    if (moduleJson.block_properties) {
        for (const blockPropertyJson of moduleJson.block_properties) {
            blockPropertyJson.property_name = blockPropertyJson.name;
        }
    }
}

function markupCategories(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            markupCategoriesOnScriptModule(moduleJson);

            if (moduleHasChangelog(moduleJson)) {
                for (const changelog of moduleJson.changelog) {
                    markupCategoriesOnScriptModule(changelog);
                }
            }
        }

        for (const moduleJson of release.command_modules) {
            markupCategoriesOnCommandsModule(moduleJson);

            if (moduleHasChangelog(moduleJson)) {
                for (const changelog of moduleJson.changelog) {
                    markupCategoriesOnCommandsModule(changelog);
                }
            }
        }

        for (const moduleJson of release.block_modules) {
            markupCategoriesOnBlocksModule(moduleJson);

            if (moduleHasChangelog(moduleJson)) {
                for (const changelog of moduleJson.changelog) {
                    markupCategoriesOnBlocksModule(changelog);
                }
            }
        }
    }
}

function constructors(releases: MinecraftRelease[]) {
    const markConstructorsOnModule = (moduleJson: MinecraftScriptModule) => {
        if (moduleJson.classes) {
            for (const classJson of moduleJson.classes) {
                if (classJson.functions) {
                    for (const functionJson of classJson.functions) {
                        if (functionJson.is_constructor) {
                            functionJson.name = 'constructor';
                        }
                        if (functionJson.is_constructor) {
                            classJson.has_constructor = true;
                        }
                    }
                }
            }
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            markConstructorsOnModule(scriptModule);

            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    markConstructorsOnModule(changelog);
                }
            }
        }
    }
}

function markupLatestModules(releases: MinecraftRelease[]) {
    for (const release of releases) {
        const latestModulesByUUID: Record<string, MinecraftScriptModule> = {};

        for (const latestScriptModule of release.getLatestScriptModules()) {
            latestModulesByUUID[latestScriptModule.uuid] = latestScriptModule;
            latestScriptModule.is_latest_module = true;
        }

        for (const scriptModule of release.script_modules) {
            if (latestModulesByUUID[scriptModule.uuid]) {
                const latestScriptModule = latestModulesByUUID[scriptModule.uuid];
                const latestMajor = semver.major(latestScriptModule.version);

                if (semver.major(scriptModule.version) === latestMajor) {
                    scriptModule.is_latest_major = true;
                } else {
                    scriptModule.from_module.prior_version = `${semver.major(scriptModule.from_module.version)}.x.x`;
                }
            }

            for (const dep of scriptModule.dependencies.concat(scriptModule.peer_dependencies)) {
                if (!dep.is_vanilla_data && latestModulesByUUID[dep.uuid]) {
                    const latestDependentModule = latestModulesByUUID[dep.uuid];
                    const latestMajor = semver.major(latestDependentModule.version);

                    if (semver.major(dep.from_module.version) === latestMajor) {
                        dep.is_latest_major = true;
                    } else {
                        dep.from_module.prior_version = `${semver.major(dep.from_module.version)}.x.x`;
                    }
                }
            }
        }
    }
}

/**
 * Marks up additional name field formats.
 */
function markupNames(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithName(scriptModule, 'name', jsonObject => {
                const bookmarkName = jsonObject.name
                    .replaceAll(' ', '-')
                    .replaceAll('/', '-')
                    .replaceAll('@', '')
                    .toLowerCase();

                jsonObject.bookmark_name = bookmarkName;
                jsonObject.filepath_name = bookmarkName.startsWith('minecraft-')
                    ? `minecraft/${bookmarkName.substring(10)}`
                    : bookmarkName;

                jsonObject.variable_name = jsonObject.name
                    .replaceAll('-', '')
                    .replaceAll(' ', '')
                    .replaceAll('@', '')
                    .replaceAll('/', '')
                    .toLowerCase();
            });

            scriptModule.from_module.folder_path = scriptModule.is_latest_major ? 'scriptapi' : 'priorscriptapi';
            if (!scriptModule.is_latest_major) {
                scriptModule.filepath_name += `-${semver.major(scriptModule.version)}xx`;
            }

            for (const dep of scriptModule.dependencies.concat(scriptModule.peer_dependencies)) {
                if (!dep.is_vanilla_data) {
                    dep.from_module.folder_path = dep.is_latest_major ? 'scriptapi' : 'priorscriptapi';
                    if (!dep.is_latest_major) {
                        dep.filepath_name += `-${semver.major(dep.from_module.version)}xx`;
                    }
                }
            }
        }
    }
}

/**
 * Marks up arrays of objects with 'index', 'order', 'is_first', 'is_last' for mustache template usage.
 */
function arrayIndexes(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const module of release.getAllModules()) {
            utils.scanObjectForMemberArray(module, (jsonObject, memberName) => {
                const arrayJson = jsonObject[memberName];

                if (arrayJson.length !== 0) {
                    if (typeof arrayJson[0] === 'object') {
                        try {
                            for (let i = 0; i < arrayJson.length; ++i) {
                                const object = arrayJson[i] as {
                                    index: number;
                                    order: number;
                                    is_first: boolean;
                                    is_last: boolean;
                                };
                                object.index = i;
                                object.order = i + 1;
                                object.is_first = i === 0;
                                object.is_last = i === arrayJson.length - 1;
                            }
                        } catch (e) {
                            if (e instanceof Error) {
                                log.error(
                                    `Failed to assign lengths to array '${memberName}': ${e.message} @ ${e.stack}`
                                );
                            }
                        }
                    }
                }
            });
        }
    }
}

function typeAliasMarkup(releases: MinecraftRelease[]) {
    const markTypeAlias = (typeAliasJson: MinecraftTypeAlias) => {
        typeAliasJson.alias_type = typeAliasJson.alias_type ?? MinecraftTypeAliasTypes.ScriptGenerated;
        switch (typeAliasJson.alias_type) {
            case MinecraftTypeAliasTypes.TypeMap: {
                typeAliasJson.is_type_map = true;

                const mappingsWithoutNamespacedKeys: MinecraftTypeMapping[] = [];
                for (const typeMappingJson of typeAliasJson.mappings ?? []) {
                    const namespaceSepIndex = typeMappingJson.name.indexOf(':');
                    if (namespaceSepIndex !== -1) {
                        const keyWithoutNamespace = typeMappingJson.name.substring(namespaceSepIndex + 1);
                        const typeMappingJsonCopy = JSON.parse(JSON.stringify(typeMappingJson)) as MinecraftTypeMapping;
                        typeMappingJsonCopy.name = keyWithoutNamespace;
                        mappingsWithoutNamespacedKeys.push(typeMappingJsonCopy);
                    }
                }

                typeAliasJson.mappings = typeAliasJson.mappings
                    .concat(mappingsWithoutNamespacedKeys)
                    .sort(utils.nameSortComparer);
                break;
            }
            default: {
                if (!typeAliasJson.is_script_generated) {
                    throw new Error(`Native type alias without 'alias_type' not supported.`);
                }
            }
        }
    };

    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            for (const typeAliasJson of moduleJson.type_aliases ?? []) {
                markTypeAlias(typeAliasJson);
            }

            if (moduleHasChangelog(moduleJson)) {
                for (const changelog of moduleJson.changelog) {
                    for (const typeAliasJson of changelog.type_aliases ?? []) {
                        markTypeAlias(typeAliasJson);
                    }
                }
            }
        }
    }
}

/**
 * Adds 'is_<type>' flags to APIs based on the type field.
 */
function typeFlags(releases: MinecraftRelease[]) {
    const fixType = (typeJson: MinecraftType, propertyName: string) => {
        typeJson.is_void_return = typeJson.is_void_return ?? false;
        typeJson.is_string = typeJson.is_string ?? false;
        typeJson.is_undefined = typeJson.is_undefined ?? false;
        typeJson.is_any = typeJson.is_any ?? false;
        typeJson.is_closure = typeJson.is_closure ?? false;
        typeJson.is_array = typeJson.is_array ?? false;
        typeJson.is_promise = typeJson.is_promise ?? false;
        typeJson.is_variant = typeJson.is_variant ?? false;
        typeJson.is_optional_type = typeJson.is_optional_type ?? false;
        typeJson.is_optional = typeJson.is_optional ?? false;
        typeJson.is_iterator = typeJson.is_iterator ?? false;
        typeJson.is_iterator_result = typeJson.is_iterator_result ?? false;
        typeJson.is_map = typeJson.is_map ?? false;
        typeJson.is_generator = typeJson.is_generator ?? false;
        typeJson.is_data_buffer = typeJson.is_data_buffer ?? false;

        if (typeJson.name === 'string') {
            typeJson.is_string = true;
        } else if (typeJson.name === 'undefined') {
            if (
                propertyName === 'return_type' ||
                propertyName === 'promise_type' ||
                propertyName === 'generator_type' ||
                propertyName === 'yield_type' ||
                propertyName === 'next_type'
            ) {
                typeJson.is_void_return = true;
            } else {
                typeJson.is_undefined = true;
            }
        } else if (typeJson.name === 'any') {
            typeJson.is_any = true;
        } else if (typeJson.name === 'closure') {
            typeJson.is_closure = true;
        } else if (typeJson.name === 'array') {
            typeJson.is_array = true;
        } else if (typeJson.name === 'promise') {
            typeJson.is_promise = true;
        } else if (typeJson.name === 'variant') {
            typeJson.is_variant = true;
        } else if (typeJson.name === 'optional') {
            typeJson.is_optional_type = true;
            typeJson.is_optional = true;
        } else if (typeJson.name === 'iterator_result') {
            typeJson.is_iterator_result = true;
        } else if (typeJson.name === 'iterator') {
            typeJson.is_iterator = true;
        } else if (typeJson.name === 'map') {
            typeJson.is_map = true;
        } else if (typeJson.name === 'generator') {
            typeJson.is_generator = true;
        } else if (typeJson.name === 'data_buffer') {
            typeJson.is_data_buffer = true;
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
                        typeJson.forEach(t => fixType(t, propertyName));
                    } else {
                        fixType(typeJson, propertyName);
                    }
                }
            );
        }
    }
}

/**
 * Marks up APIs that have default values with 'has_defaults'.
 */
function defaultValues(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            for (const classJson of scriptModule.classes ?? []) {
                for (const functionJson of classJson.functions ?? []) {
                    for (const argumentJson of functionJson.arguments) {
                        if (!argumentJson.details) {
                            continue;
                        }

                        if (argumentJson.details.default_value !== undefined) {
                            argumentJson.type.is_optional = true;

                            if (argumentJson.details.default_value !== 'null') {
                                functionJson.has_defaults = true;
                                argumentJson.has_defaults = true;
                            }

                            if (Array.isArray(argumentJson.details.default_value)) {
                                const wrappedDefaultValue: Record<'value', boolean | number | string>[] = [];
                                for (const v of argumentJson.details.default_value) {
                                    wrappedDefaultValue.push({ value: v as boolean | number | string });
                                }
                                argumentJson.details.default_value = wrappedDefaultValue;
                            }
                            argumentJson.details.default_value = {
                                type: JSON.parse(JSON.stringify(argumentJson.type)) as MinecraftType,
                                value: argumentJson.details.default_value,
                            };
                        }

                        if (argumentJson.details.supported_values !== undefined) {
                            if (Array.isArray(argumentJson.details.supported_values)) {
                                const wrappedSupportedValues: Record<'value', boolean | number | string>[] = [];
                                for (const v of argumentJson.details.supported_values) {
                                    wrappedSupportedValues.push({ value: v as boolean | number | string });
                                }
                                argumentJson.details.supported_values = wrappedSupportedValues;
                            }
                        }
                    }
                }
            }

            // Interface property defaults
            for (const interfaceJson of scriptModule.interfaces ?? []) {
                for (const propertyJson of interfaceJson.properties ?? []) {
                    if (propertyJson.default_value !== undefined) {
                        propertyJson.type.is_optional = true;

                        if (propertyJson.default_value !== 'null') {
                            propertyJson.has_defaults = true;
                        }

                        if (Array.isArray(propertyJson.default_value)) {
                            const wrappedDefaultValue: Record<'value', boolean | number | string>[] = [];
                            for (const v of propertyJson.default_value) {
                                wrappedDefaultValue.push({ value: v as boolean | number | string });
                            }
                            propertyJson.default_value = wrappedDefaultValue;
                        }
                        propertyJson.default_value = {
                            type: JSON.parse(JSON.stringify(propertyJson.type)) as MinecraftType,
                            value: propertyJson.default_value,
                        };
                    }
                }
            }
        }
    }
}

function constantValues(releases: MinecraftRelease[]) {
    const markupConstantValueObjects = (constants: MinecraftConstant[]) => {
        for (const constantJson of constants) {
            // eslint-disable-next-line eqeqeq, unicorn/no-null
            if (constantJson.is_static && constantJson.value != null) {
                constantJson.constant_value = { value: constantJson.value };
            }
        }
    };

    const markConstantValuesOnModule = (moduleJson: MinecraftScriptModule) => {
        if (moduleJson.constants) {
            markupConstantValueObjects(moduleJson.constants);
        }

        if (moduleJson.classes) {
            for (const classJson of moduleJson.classes) {
                if (classJson.constants) {
                    markupConstantValueObjects(classJson.constants);
                }
            }
        }

        if (moduleJson.enums) {
            for (const enumJson of moduleJson.enums) {
                markupConstantValueObjects(enumJson.constants);
            }
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            markConstantValuesOnModule(scriptModule);

            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    markConstantValuesOnModule(changelog);
                }
            }
        }
    }
}

/**
 * Populates 'derived_types' in order to be able to add links to derived APIs.
 */
function linkDerivedTypes(releases: MinecraftRelease[]) {
    for (const release of releases) {
        release.script_modules.forEach(moduleJson => {
            moduleJson.classes.forEach(classJson => {
                if (classJson.base_types) {
                    classJson.base_types.forEach(baseTypeJson => {
                        let foundBaseClassJson = false;
                        const baseTypeModule = baseTypeJson.from_module ?? moduleJson;

                        release.script_modules.forEach(baseClassModuleJson => {
                            if (
                                baseClassModuleJson.uuid === baseTypeModule.uuid &&
                                semver.major(baseClassModuleJson.version) === semver.major(baseTypeModule.version) &&
                                semver.minor(baseClassModuleJson.version) >= semver.minor(baseTypeModule.version)
                            ) {
                                baseClassModuleJson.classes.forEach(baseTypeClassJson => {
                                    if (baseTypeJson.name === baseTypeClassJson.name) {
                                        if (!baseTypeClassJson.derived_types) {
                                            baseTypeClassJson.derived_types = [];
                                        }

                                        const copiedDerivedType = JSON.parse(
                                            JSON.stringify(classJson.type)
                                        ) as MinecraftType;

                                        copiedDerivedType.from_module = {
                                            name: moduleJson.name,
                                            uuid: moduleJson.uuid,
                                            version: moduleJson.version,
                                        };
                                        if (
                                            !baseTypeClassJson.derived_types.some(
                                                derived_type =>
                                                    derived_type.name === copiedDerivedType.name &&
                                                    derived_type.from_module.name === moduleJson.name
                                            )
                                        ) {
                                            baseTypeClassJson.derived_types.push(copiedDerivedType);
                                        }
                                        foundBaseClassJson = true;
                                    }
                                });
                            }
                        });

                        if (!foundBaseClassJson) {
                            log.warn(
                                `Failed to find base class '${baseTypeJson.name}' in module '${baseTypeModule.name}@${baseTypeModule.version}' for class '${classJson.name}'.`
                            );
                        }
                    });
                }
            });
        });
    }
}

function fromExternalModule(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithName(
                scriptModule,
                'from_module',
                (jsonObject: Record<string, MinecraftModuleDescription>) => {
                    const fromModule = jsonObject.from_module;
                    fromModule.is_external_module = fromModule.uuid !== scriptModule.uuid;
                }
            );
        }
    }
}

/**
 * Add 'from_module' to dependency objects so that they can be marked up.
 */
function addFromModuleToDependencies(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            for (const dep of scriptModule.dependencies.concat(scriptModule.peer_dependencies)) {
                const sortedVersions = dep.versions.toSorted(utils.reverseSemVerSortComparer('version'));
                const latestVersion = sortedVersions[0].version;

                dep.from_module = {
                    name: dep.name,
                    uuid: dep.uuid,
                    version: latestVersion,
                };

                dep.is_vanilla_data = dep.name === '@minecraft/vanilla-data';
                for (const version of dep.versions) {
                    version.version_selector = !dep.is_vanilla_data
                        ? '^'
                        : !semver.prerelease(version.version)
                          ? '>='
                          : undefined;
                }
            }
        }
    }
}

/**
 * Aligns 'from_module' for types with the module that the script module actually depends on.
 *
 * This is for the case where gametest depends on server's vector3, which came out in 1.x.x. Rather than
 * linking gametest to server 1.x.x's vector3, we want to link to the version of server that gametest
 * depends on.
 */
function setFromModuleToDependentModules(releases: MinecraftRelease[]) {
    const ignoredTypes = ['Error'];

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            const dependentModules = getLatestDependentScriptModules(release.script_modules, scriptModule);
            const dependentModulesByUUID: Record<string, MinecraftScriptModule> = {};
            for (const latestModule of dependentModules) {
                dependentModulesByUUID[latestModule.uuid] = latestModule;
            }

            utils.scanObjectForMembersWithNamesNoChangelog(
                scriptModule,
                'name',
                'from_module',
                (jsonObject: MinecraftType) => {
                    const name = jsonObject.name;
                    if (name === scriptModule.name || ignoredTypes.includes(name)) {
                        return;
                    }

                    const dependentModule = dependentModulesByUUID[jsonObject.from_module.uuid];
                    if (!dependentModule) {
                        log.printOption(
                            `Failed to find dependent module '${
                                jsonObject.from_module.name
                            }@${jsonObject.from_module.version}' for '${scriptModule.name}@${scriptModule.version}'.`,
                            'unresolvedDependencies'
                        );
                        return;
                    }
                    if (name === dependentModule.name) {
                        return;
                    }

                    for (const c of [
                        dependentModule.classes,
                        dependentModule.interfaces,
                        dependentModule.errors,
                        dependentModule.enums,
                        dependentModule.type_aliases,
                    ]) {
                        for (const named of c) {
                            if (named.name === name) {
                                jsonObject.from_module.name = dependentModule.name;
                                jsonObject.from_module.version = dependentModule.version;
                                return;
                            }
                        }
                    }
                    log.printOption(
                        `Could not find type '${name}' but '${scriptModule.name}@${scriptModule.version}' depends on it.`,
                        'unresolvedTypes'
                    );
                }
            );
        }
    }
}

/**
 * Nest changed type values in an object with the same key so other filters fix them up.
 */
function nestChangedTypes(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    utils.scanObjectForMemberWithAnyNamesFromList(
                        changelog,
                        MinecraftTypeKeyList,
                        (jsonObject: Record<string, MinecraftType | MinecraftType[]>, propertyName: string) => {
                            const typeJson = jsonObject[propertyName];

                            // Determines if type object has been modified by changelogging
                            if (typeof typeJson === 'object' && isValueChangelogEntry(typeJson)) {
                                typeJson.$old = {
                                    [propertyName]: typeJson.$old,
                                };
                                typeJson.$new = {
                                    [propertyName]: typeJson.$new,
                                };
                            }
                        }
                    );
                }
            }
        }
    }
}

const CHANGELOG_KEYS = ['$changed', '$added', '$removed'];

function flagChanges(rootJson: Record<string, unknown>, jsonToApplyChangeFlag?: Record<string, unknown>[]) {
    rootJson.has_changes = rootJson.has_changes ?? false;
    for (const changelogKey of CHANGELOG_KEYS) {
        rootJson[changelogKey] = rootJson[changelogKey] ?? false;
    }

    if (jsonToApplyChangeFlag && jsonToApplyChangeFlag.length > 0) {
        utils.scanObjectForMemberWithAnyNamesFromList(
            rootJson,
            CHANGELOG_KEYS,
            (changedObjectJson: Record<string, unknown>, propertyName: string) => {
                for (const objectJson of jsonToApplyChangeFlag) {
                    objectJson.has_changes = objectJson.has_changes || changedObjectJson[propertyName] !== false;
                }
            }
        );
    }
}

function flagArraySubmemberChanges(
    jsonObject: Record<string, unknown>,
    memberName: string,
    jsonHierarchy: Record<string, unknown>[]
) {
    if (jsonObject[memberName] === undefined) {
        jsonObject[memberName] = [];
    }
    const objectArray = jsonObject[memberName] as Record<string, unknown>[];
    if (Array.isArray(objectArray)) {
        for (const submemberJson of objectArray) {
            flagChanges(submemberJson, [submemberJson, ...jsonHierarchy]);
        }
    }
}

function flagSimpleOrderedArraySubmemberChanges(jsonObject: Record<string, unknown>, memberName: string) {
    const obj = jsonObject[memberName];
    if (!obj || (Array.isArray(obj) && obj.length === 0)) {
        jsonObject[memberName] = {
            array: [],
            $changed: false,
        };
    } else {
        if (typeof obj === 'object' && '$old' in obj && '$new' in obj && '$key' in obj) {
            jsonObject[memberName] = {
                $changed: true,
                array: utils.diffArray(obj.$old as [], obj.$new as [], obj.$key as string),
            };
        }
    }
}

function flagValueSubmemberChanges(
    jsonObject: Record<string, unknown>,
    memberName: string,
    jsonHierarchy: Record<string, unknown>[]
) {
    if (jsonObject[memberName] === undefined) {
        jsonObject[memberName] = {};
    }

    flagChanges(jsonObject, [jsonObject, ...jsonHierarchy]);
}

/**
 * Marks up APIs that have changelog changes with 'has_changes', moving up the metadata
 * hierarchy to mark up to the module containing that API.
 */
function flagChangelogChanges(releases: MinecraftRelease[]) {
    for (const release of releases) {
        const afterEventsOrderingModule = getAfterEventsOrderingModuleFrom(release.engine_data_modules);
        if (moduleHasChangelog(afterEventsOrderingModule)) {
            flagChanges(afterEventsOrderingModule);

            for (const changelogModuleJson of afterEventsOrderingModule.changelog) {
                flagArraySubmemberChanges(changelogModuleJson, 'after_events_order_by_version', [changelogModuleJson]);
                for (const orderJson of changelogModuleJson.after_events_order_by_version) {
                    flagSimpleOrderedArraySubmemberChanges(orderJson, 'event_order');
                }
            }
        }

        for (const scriptModule of release.script_modules) {
            if (moduleHasChangelog(scriptModule)) {
                flagChanges(scriptModule);

                for (const changelogModuleJson of scriptModule.changelog) {
                    flagArraySubmemberChanges(changelogModuleJson, 'dependencies', [changelogModuleJson]);
                    for (const dependencyJson of changelogModuleJson.dependencies) {
                        flagArraySubmemberChanges(dependencyJson, 'versions', [changelogModuleJson, dependencyJson]);
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'peer_dependencies', [changelogModuleJson]);
                    for (const dependencyJson of changelogModuleJson.peer_dependencies) {
                        flagArraySubmemberChanges(dependencyJson, 'versions', [changelogModuleJson, dependencyJson]);
                        flagValueSubmemberChanges(dependencyJson, 'types_only', [changelogModuleJson, dependencyJson]);
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'constants', [changelogModuleJson]);
                    for (const constantJson of changelogModuleJson.constants) {
                        flagValueSubmemberChanges(constantJson, 'value', [changelogModuleJson]);
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'functions', [changelogModuleJson]);
                    for (const functionJson of changelogModuleJson.functions) {
                        flagArraySubmemberChanges(functionJson, 'arguments', [changelogModuleJson, functionJson]);
                        for (const argumentJson of functionJson.arguments) {
                            flagValueSubmemberChanges(argumentJson, 'type', [changelogModuleJson, functionJson]);
                        }

                        flagValueSubmemberChanges(functionJson, 'return_type', [changelogModuleJson]);
                        flagValueSubmemberChanges(functionJson, 'call_privilege', [changelogModuleJson]);
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'classes', [changelogModuleJson]);
                    for (const classJson of changelogModuleJson.classes) {
                        flagArraySubmemberChanges(classJson, 'properties', [changelogModuleJson, classJson]);
                        for (const propertyJson of classJson.properties) {
                            flagValueSubmemberChanges(propertyJson, 'type', [changelogModuleJson, classJson]);
                            flagValueSubmemberChanges(propertyJson, 'get_privilege', [changelogModuleJson, classJson]);
                            flagValueSubmemberChanges(propertyJson, 'set_privilege', [changelogModuleJson, classJson]);
                        }

                        flagArraySubmemberChanges(classJson, 'constants', [changelogModuleJson, classJson]);
                        for (const constantJson of classJson.constants) {
                            flagValueSubmemberChanges(constantJson, 'value', [changelogModuleJson, classJson]);
                        }

                        flagArraySubmemberChanges(classJson, 'functions', [changelogModuleJson, classJson]);
                        for (const functionJson of classJson.functions) {
                            flagArraySubmemberChanges(functionJson, 'arguments', [
                                changelogModuleJson,
                                classJson,
                                functionJson,
                            ]);
                            for (const argumentJson of functionJson.arguments) {
                                flagValueSubmemberChanges(argumentJson, 'type', [
                                    changelogModuleJson,
                                    classJson,
                                    functionJson,
                                ]);
                            }

                            flagValueSubmemberChanges(functionJson, 'return_type', [changelogModuleJson, classJson]);
                            flagValueSubmemberChanges(functionJson, 'call_privilege', [changelogModuleJson, classJson]);
                        }
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'interfaces', [changelogModuleJson]);
                    for (const interfaceJson of changelogModuleJson.interfaces) {
                        flagArraySubmemberChanges(interfaceJson, 'properties', [changelogModuleJson, interfaceJson]);
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'errors', [changelogModuleJson]);
                    for (const errorJson of changelogModuleJson.errors) {
                        flagArraySubmemberChanges(errorJson, 'properties', [changelogModuleJson, errorJson]);
                        for (const propertyJson of errorJson.properties) {
                            flagValueSubmemberChanges(propertyJson, 'get_privilege', [changelogModuleJson, errorJson]);
                            flagValueSubmemberChanges(propertyJson, 'set_privilege', [changelogModuleJson, errorJson]);
                        }
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'objects', [changelogModuleJson]);
                    for (const objectJson of changelogModuleJson.objects) {
                        flagValueSubmemberChanges(objectJson, 'type', [changelogModuleJson]);
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'enums', [changelogModuleJson]);
                    for (const enumJson of changelogModuleJson.enums) {
                        flagArraySubmemberChanges(enumJson, 'constants', [changelogModuleJson, enumJson]);
                        for (const constantJson of enumJson.constants) {
                            flagValueSubmemberChanges(constantJson, 'value', [changelogModuleJson, enumJson]);
                        }
                    }

                    flagArraySubmemberChanges(changelogModuleJson, 'type_aliases', [changelogModuleJson]);
                    for (const typeJson of changelogModuleJson.type_aliases) {
                        flagValueSubmemberChanges(typeJson, 'type', [changelogModuleJson]);
                        for (const mappingJson of typeJson.mappings ?? []) {
                            flagValueSubmemberChanges(mappingJson, 'value', [changelogModuleJson, typeJson]);
                        }
                    }
                }
            }
        }

        for (const commandModule of release.command_modules) {
            if (moduleHasChangelog(commandModule)) {
                flagChanges(commandModule);

                for (const changelogModuleJson of commandModule.changelog) {
                    flagArraySubmemberChanges(changelogModuleJson, 'commands', [changelogModuleJson]);
                    flagArraySubmemberChanges(changelogModuleJson, 'command_enums', [changelogModuleJson]);

                    for (const commandJson of changelogModuleJson.commands) {
                        flagChanges(commandJson, [changelogModuleJson, commandJson]);

                        flagArraySubmemberChanges(commandJson, 'aliases', [changelogModuleJson, commandJson]);
                        for (const aliasJson of commandJson.aliases) {
                            flagValueSubmemberChanges(aliasJson, 'name', [changelogModuleJson, commandJson]);
                        }

                        flagArraySubmemberChanges(commandJson, 'overloads', [changelogModuleJson, commandJson]);
                        for (const overloadJson of commandJson.overloads) {
                            flagArraySubmemberChanges(overloadJson, 'params', [changelogModuleJson, commandJson]);
                            for (const paramJson of overloadJson.params) {
                                flagValueSubmemberChanges(paramJson, 'type', [
                                    changelogModuleJson,
                                    commandJson,
                                    overloadJson,
                                ]);
                                flagValueSubmemberChanges(paramJson, 'is_optional', [
                                    changelogModuleJson,
                                    commandJson,
                                    overloadJson,
                                ]);
                            }
                        }

                        flagValueSubmemberChanges(commandJson, 'permission_level', [changelogModuleJson, commandJson]);
                        flagValueSubmemberChanges(commandJson, 'requires_cheats', [changelogModuleJson, commandJson]);
                    }
                }
            }
        }

        for (const vanillaDataModule of release.vanilla_data_modules) {
            if (moduleHasChangelog(vanillaDataModule)) {
                flagChanges(vanillaDataModule);

                for (const changelogModuleJson of vanillaDataModule.changelog) {
                    flagArraySubmemberChanges(changelogModuleJson, 'data_items', [
                        vanillaDataModule,
                        changelogModuleJson,
                    ]);

                    for (const dataItemJson of changelogModuleJson.data_items) {
                        flagValueSubmemberChanges(dataItemJson, 'name', [vanillaDataModule, changelogModuleJson]);

                        if (vanillaDataModule.has_properties) {
                            flagArraySubmemberChanges(dataItemJson, 'properties', [
                                vanillaDataModule,
                                changelogModuleJson,
                            ]);

                            for (const propertyJson of dataItemJson.properties) {
                                flagValueSubmemberChanges(propertyJson, 'properties', [
                                    vanillaDataModule,
                                    changelogModuleJson,
                                    dataItemJson,
                                ]);
                            }
                        }
                    }

                    if (vanillaDataModule.name === 'mojang-block') {
                        flagArraySubmemberChanges(changelogModuleJson, 'block_properties', [
                            vanillaDataModule,
                            changelogModuleJson,
                        ]);

                        for (const blockPropJson of (vanillaDataModule as MinecraftBlockModule).block_properties) {
                            flagValueSubmemberChanges(blockPropJson, 'type', [
                                vanillaDataModule,
                                changelogModuleJson,
                                blockPropJson,
                            ]);

                            flagArraySubmemberChanges(blockPropJson, 'values', [
                                vanillaDataModule,
                                changelogModuleJson,
                                blockPropJson,
                            ]);
                        }
                    }
                }
            }
        }
    }
}

function markObjectAsErrorable(metadataJson: MinecraftFunction | MinecraftProperty) {
    metadataJson.has_errors = metadataJson.has_errors ?? false;

    if ('type' in metadataJson) {
        if (metadataJson.type.is_errorable) {
            metadataJson.has_errors = true;
        }
    } else if ('return_type' in metadataJson) {
        if (metadataJson.return_type.is_errorable) {
            metadataJson.has_errors = true;
        }
    }
}

/**
 * Marks up 'has_errors' on APIs that have errorable types.
 */
function markErrorable(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            for (const functionJson of moduleJson.functions ?? []) {
                markObjectAsErrorable(functionJson);
            }

            for (const classJson of moduleJson.classes ?? []) {
                for (const functionJson of classJson.functions ?? []) {
                    markObjectAsErrorable(functionJson);
                }

                for (const propertyJson of classJson.properties ?? []) {
                    markObjectAsErrorable(propertyJson);
                }
            }

            for (const interfaceJson of moduleJson.interfaces ?? []) {
                for (const propertyJson of interfaceJson.properties ?? []) {
                    markObjectAsErrorable(propertyJson);
                }
            }
        }
    }
}

function markObjectAsPrerelease(
    metadataJson: Partial<Record<ChangelogKey, Array<ArrayChangelogEntry>>> & MarkupCommentFlags,
    changelogKey: ChangelogKey
) {
    metadataJson.is_prerelease = false;
    metadataJson.prerelease = undefined;

    if (changelogKey in metadataJson) {
        for (const changelog of metadataJson[changelogKey]) {
            const changelogVersionPrerelease = semver.prerelease(changelog.version);

            if (!changelogVersionPrerelease) {
                break;
            }

            if (changelog.$added) {
                metadataJson.is_prerelease = true;
                metadataJson.prerelease = changelogVersionPrerelease[0] as string;
            }
        }
    }
}

/**
 * Marks up APIs as prerelease by using the changelog to determine if they are added
 * in a prerelease version.
 */
function markPrerelease(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            const modulePrereleaseTag = semver.prerelease(moduleJson.version) as string[] | undefined;
            if (
                !modulePrereleaseTag ||
                (modulePrereleaseTag[0] !== 'alpha' &&
                    modulePrereleaseTag[0] !== 'internal' &&
                    modulePrereleaseTag[0] !== 'beta' &&
                    modulePrereleaseTag[0] !== 'rc')
            ) {
                continue;
            }

            markObjectAsPrerelease(moduleJson, 'changelog');

            for (const constantJson of moduleJson.constants ?? []) {
                markObjectAsPrerelease(constantJson, 'constant_changelog');
            }

            for (const functionJson of moduleJson.functions ?? []) {
                markObjectAsPrerelease(functionJson, 'function_changelog');
            }

            for (const objectJson of moduleJson.objects ?? []) {
                markObjectAsPrerelease(objectJson, 'object_changelog');
            }

            for (const aliasJson of moduleJson.type_aliases ?? []) {
                markObjectAsPrerelease(aliasJson, 'alias_changelog');
            }

            const markupObjectsAsPrerelease = (
                objectKey: 'classes' | 'interfaces' | 'enums' | 'errors',
                changelogKey: ChangelogKey
            ) => {
                if (objectKey in moduleJson) {
                    for (const objectJson of moduleJson[objectKey]) {
                        markObjectAsPrerelease(objectJson, changelogKey);

                        if (hasConstants(objectJson)) {
                            for (const constantJson of objectJson.constants) {
                                markObjectAsPrerelease(constantJson, 'constant_changelog');
                            }
                        }

                        if (hasFunctions(objectJson)) {
                            for (const functionJson of objectJson.functions) {
                                markObjectAsPrerelease(functionJson, 'function_changelog');
                            }
                        }

                        if (hasProperties(objectJson)) {
                            for (const propertyJson of objectJson.properties) {
                                markObjectAsPrerelease(propertyJson, 'property_changelog');
                            }
                        }
                    }
                }
            };

            markupObjectsAsPrerelease('classes', 'class_changelog');
            markupObjectsAsPrerelease('interfaces', 'interface_changelog');
            markupObjectsAsPrerelease('enums', 'enum_changelog');
            markupObjectsAsPrerelease('errors', 'error_changelog');
        }
    }
}

type ApiParseHierarchy = {
    key: string;
    name: string;
    child?: ApiParseHierarchy;
};

function markObjectAsDeprecated(
    metadataJson: Partial<Record<ChangelogKey, Array<ArrayChangelogEntry>>> & MarkupCommentFlags,
    changelogKey: ChangelogKey,
    metadataHierarchy: ApiParseHierarchy,
    moduleName: string,
    modules: MinecraftScriptModule[]
) {
    const markObjectAsDeprecatedRecursive = (
        objectJson: Record<string, unknown>,
        changelogKey: ChangelogKey,
        deprecatedVersion: string,
        metadataHierarchy?: ApiParseHierarchy
    ) => {
        if (metadataHierarchy.key in objectJson) {
            const objectArray = objectJson[metadataHierarchy.key] as Array<Record<string, unknown>>;
            const subObjectIndex = objectArray.map(subObjectJson => subObjectJson.name).indexOf(metadataHierarchy.name);

            if (subObjectIndex !== -1) {
                const subObjectJson = objectArray[subObjectIndex] as typeof metadataJson;
                if (!metadataHierarchy.child) {
                    let addedInPrerelease = false;
                    if (changelogKey in subObjectJson) {
                        for (const changelog of subObjectJson[changelogKey]) {
                            const changelogVersionPrerelease = semver.prerelease(changelog.version);

                            if (!changelogVersionPrerelease) {
                                break;
                            }

                            if (changelog.$added) {
                                addedInPrerelease = true;
                            }
                        }
                    }
                    if (!addedInPrerelease) {
                        subObjectJson.is_deprecated = true;
                        subObjectJson.deprecated_version = deprecatedVersion;
                    }
                } else {
                    markObjectAsDeprecatedRecursive(
                        subObjectJson,
                        changelogKey,
                        deprecatedVersion,
                        metadataHierarchy.child
                    );
                }
            }
        }
    };

    if (changelogKey in metadataJson) {
        for (const changelog of metadataJson[changelogKey]) {
            const changelogVersion = semver.parse(changelog.version);

            if (changelogVersion && changelog.$removed) {
                for (const moduleJson of modules) {
                    if (moduleJson.name === moduleName && semver.lt(moduleJson.version, changelogVersion)) {
                        const deprecatedVersion = `${changelogVersion.major}.0.0`;
                        markObjectAsDeprecatedRecursive(moduleJson, changelogKey, deprecatedVersion, metadataHierarchy);
                    }
                }
                break;
            }
        }
    }
}

/**
 * Marks up APIs as deprecated in past version by using the changelog to determine if they
 * have been removed in a future version.
 */
function markDeprecated(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const moduleJson of release.script_modules) {
            for (const constantJson of moduleJson.constants ?? []) {
                markObjectAsDeprecated(
                    constantJson,
                    'constant_changelog',
                    { key: 'constants', name: constantJson.name },
                    moduleJson.name,
                    release.script_modules
                );
            }

            for (const functionJson of moduleJson.functions ?? []) {
                markObjectAsDeprecated(
                    functionJson,
                    'function_changelog',
                    { key: 'functions', name: functionJson.name },
                    moduleJson.name,
                    release.script_modules
                );
            }

            for (const objectJson of moduleJson.objects ?? []) {
                markObjectAsDeprecated(
                    objectJson,
                    'object_changelog',
                    { key: 'objects', name: objectJson.name },
                    moduleJson.name,
                    release.script_modules
                );
            }

            for (const aliasJson of moduleJson.type_aliases ?? []) {
                markObjectAsDeprecated(
                    aliasJson,
                    'alias_changelog',
                    { key: 'type_aliases', name: aliasJson.name },
                    moduleJson.name,
                    release.script_modules
                );
            }

            const markupObjectsAsDeprecated = (
                objectKey: 'classes' | 'interfaces' | 'enums' | 'errors',
                changelogKey: ChangelogKey
            ) => {
                if (objectKey in moduleJson) {
                    for (const objectJson of moduleJson[objectKey]) {
                        markObjectAsDeprecated(
                            objectJson,
                            changelogKey,
                            { key: objectKey, name: objectJson.name },
                            moduleJson.name,
                            release.script_modules
                        );

                        if (hasConstants(objectJson)) {
                            for (const constantJson of objectJson.constants) {
                                markObjectAsDeprecated(
                                    constantJson,
                                    'constant_changelog',
                                    {
                                        key: objectKey,
                                        name: objectJson.name,
                                        child: { key: 'constants', name: constantJson.name },
                                    },
                                    moduleJson.name,
                                    release.script_modules
                                );
                            }
                        }

                        if (hasFunctions(objectJson)) {
                            for (const functionJson of objectJson.functions) {
                                markObjectAsDeprecated(
                                    functionJson,
                                    'function_changelog',
                                    {
                                        key: objectKey,
                                        name: objectJson.name,
                                        child: { key: 'functions', name: functionJson.name },
                                    },
                                    moduleJson.name,
                                    release.script_modules
                                );
                            }
                        }

                        if (hasProperties(objectJson)) {
                            for (const propertyJson of objectJson.properties) {
                                markObjectAsDeprecated(
                                    propertyJson,
                                    'property_changelog',
                                    {
                                        key: objectKey,
                                        name: objectJson.name,
                                        child: { key: 'properties', name: propertyJson.name },
                                    },
                                    moduleJson.name,
                                    release.script_modules
                                );
                            }
                        }
                    }
                }
            };

            markupObjectsAsDeprecated('classes', 'class_changelog');
            markupObjectsAsDeprecated('interfaces', 'interface_changelog');
            markupObjectsAsDeprecated('enums', 'enum_changelog');
            markupObjectsAsDeprecated('errors', 'error_changelog');
        }
    }
}

function addChangelogToMetadata(
    metadataList: Array<Record<string, unknown>>,
    changelogList: Array<Record<string, unknown>>,
    changelogVersion: string,
    changelogDestinationKey: string
) {
    for (const changedProperty of changelogList) {
        const objectPropertyIndex = metadataList.map(propertyJson => propertyJson.name).indexOf(changedProperty.name);

        if (objectPropertyIndex !== -1) {
            const baseChangelog: Partial<ArrayChangelogEntry> & Partial<typeof changedProperty> = {
                version: changelogVersion,
            };
            for (const changedDataType in changedProperty) {
                baseChangelog[changedDataType] = changedProperty[changedDataType];
            }

            const propertyJson = metadataList[objectPropertyIndex];
            propertyJson[changelogDestinationKey] = propertyJson[changelogDestinationKey] ?? [];
            const propertyChangelogList = propertyJson[changelogDestinationKey] as Array<Record<string, unknown>>;
            propertyChangelogList.push(baseChangelog);
            propertyJson.has_changes = propertyJson.has_changes || changedProperty['has_changes'];
        }
    }
}

/**
 * Copy changelog objects from the root module 'changelog' to the associated object
 * as '<type>_changelog' fields in the actual metadata.
 */
function copyChangelogsToObjectMetadata(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    if (hasConstants(changelog) && hasConstants(scriptModule)) {
                        for (const constantJson of scriptModule.constants) {
                            constantJson.has_changes = constantJson.has_changes ?? false;
                        }
                        addChangelogToMetadata(
                            scriptModule.constants,
                            changelog.constants,
                            changelog.version,
                            'constant_changelog'
                        );
                    }

                    if (hasFunctions(changelog) && hasFunctions(scriptModule)) {
                        for (const functionJson of scriptModule.functions) {
                            functionJson.has_changes = functionJson.has_changes ?? false;
                        }
                        addChangelogToMetadata(
                            scriptModule.functions,
                            changelog.functions,
                            changelog.version,
                            'function_changelog'
                        );
                    }

                    if (hasObjects(changelog) && hasObjects(scriptModule)) {
                        for (const objectJson of scriptModule.objects) {
                            objectJson.has_changes = objectJson.has_changes ?? false;
                        }
                        addChangelogToMetadata(
                            scriptModule.objects,
                            changelog.objects,
                            changelog.version,
                            'object_changelog'
                        );
                    }

                    if (hasTypeAliases(changelog) && hasTypeAliases(scriptModule)) {
                        for (const aliasJson of scriptModule.type_aliases) {
                            aliasJson.has_changes = aliasJson.has_changes ?? false;
                        }
                        addChangelogToMetadata(
                            scriptModule.type_aliases,
                            changelog.type_aliases,
                            changelog.version,
                            'alias_changelog'
                        );
                    }

                    const addObjectMetadata = (
                        objectKey: 'classes' | 'interfaces' | 'enums' | 'errors',
                        changelogKey: ChangelogKey
                    ) => {
                        if (objectKey in scriptModule && objectKey in changelog) {
                            for (const changedObject of changelog[objectKey]) {
                                const moduleObjectIndex = scriptModule[objectKey]
                                    .map(objectJson => objectJson.name)
                                    .indexOf(changedObject.name);

                                if (moduleObjectIndex !== -1) {
                                    const objectJson = scriptModule[objectKey][moduleObjectIndex] as Record<
                                        string,
                                        unknown
                                    >;
                                    objectJson[changelogKey] = objectJson[changelogKey] ?? [];

                                    const objectChangelog: Record<string, unknown> = {
                                        version: changelog.version,
                                    };
                                    let changedDataType: keyof typeof changedObject;
                                    for (changedDataType in changedObject) {
                                        objectChangelog[changedDataType] = changedObject[changedDataType];
                                    }

                                    const objectChangelogList = objectJson[changelogKey] as Array<
                                        Record<string, unknown>
                                    >;
                                    objectChangelogList.push(objectChangelog);
                                    objectJson.has_changes = objectJson.has_changes || objectChangelog.has_changes;

                                    if (hasConstants(changedObject) && hasConstants(objectJson)) {
                                        for (const constantJson of objectJson.constants) {
                                            constantJson.has_changes = constantJson.has_changes ?? false;
                                        }
                                        addChangelogToMetadata(
                                            objectJson.constants,
                                            changedObject.constants,
                                            changelog.version,
                                            'constant_changelog'
                                        );
                                    }

                                    if (hasFunctions(changedObject) && hasFunctions(objectJson)) {
                                        for (const functionJson of objectJson.functions) {
                                            functionJson.has_changes = functionJson.has_changes ?? false;
                                        }
                                        addChangelogToMetadata(
                                            objectJson.functions,
                                            changedObject.functions,
                                            changelog.version,
                                            'function_changelog'
                                        );
                                    }

                                    if (hasProperties(changedObject) && hasProperties(objectJson)) {
                                        for (const propertyJson of objectJson.properties) {
                                            propertyJson.has_changes = propertyJson.has_changes ?? false;
                                        }
                                        addChangelogToMetadata(
                                            objectJson.properties,
                                            changedObject.properties,
                                            changelog.version,
                                            'property_changelog'
                                        );
                                    }
                                }
                            }
                        }
                    };

                    addObjectMetadata('classes', 'class_changelog');
                    addObjectMetadata('interfaces', 'interface_changelog');
                    addObjectMetadata('enums', 'enum_changelog');
                    addObjectMetadata('errors', 'error_changelog');
                }
            }
        }
    }
}

/**
 * Add 'is_member' and 'has_member_*' fields for functions and constants
 * to mark whether they belong to a class/interface.
 */
function markMembers(releases: MinecraftRelease[]) {
    const markMembersOnModule = (scriptModule: MinecraftScriptModule) => {
        if (scriptModule.classes) {
            for (const classJson of scriptModule.classes) {
                if (classJson.functions && classJson.functions.length > 0) {
                    classJson.has_member_functions = true;
                    for (const functionJson of classJson.functions) {
                        functionJson.is_member = true;
                    }
                }
                if (classJson.constants && classJson.constants.length > 0) {
                    classJson.has_member_constants = true;
                    for (const constantJson of classJson.constants) {
                        constantJson.is_member = true;
                    }
                }
                if (classJson.properties) {
                    for (const propertyJson of classJson.properties) {
                        propertyJson.is_member = true;
                    }
                }
            }
        }

        if (scriptModule.interfaces) {
            for (const interfaceJson of scriptModule.interfaces) {
                if (
                    interfaceJson.is_script_generated &&
                    interfaceJson.functions &&
                    interfaceJson.functions.length > 0
                ) {
                    interfaceJson.has_member_functions = true;
                    for (const functionJson of interfaceJson.functions) {
                        functionJson.is_member = true;
                    }
                }

                if (interfaceJson.properties) {
                    for (const propertyJson of interfaceJson.properties) {
                        propertyJson.is_member = true;
                    }
                }
            }
        }

        if (scriptModule.functions) {
            for (const functionJson of scriptModule.functions) {
                functionJson.is_member = false;
            }
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            markMembersOnModule(scriptModule);

            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    markMembersOnModule(changelog);
                }
            }
        }
    }
}

function markInterfaceTypes(releases: MinecraftRelease[]) {
    const markInterfacesOnModule = (scriptModule: MinecraftScriptModule) => {
        if (scriptModule.interfaces) {
            for (const interfaceJson of scriptModule.interfaces) {
                interfaceJson.is_interface = true;
            }
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            markInterfacesOnModule(scriptModule);

            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    markInterfacesOnModule(changelog);
                }
            }
        }
    }
}

/**
 * Inserts empty arrays for module API categories that do not exist.
 */
function defaultModuleCategories(releases: MinecraftRelease[]) {
    const insertEmptyArrayIfNotExist = (objectJson: Record<string, unknown>, member: string) => {
        if (!objectJson[member]) {
            objectJson[member] = [];
        }
    };

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            const scriptModuleCategories = [
                'classes',
                'interfaces',
                'enums',
                'errors',
                'constants',
                'functions',
                'objects',
                'type_aliases',
                'dependencies',
                'peer_dependencies',
            ];

            for (const categoryName of scriptModuleCategories) {
                insertEmptyArrayIfNotExist(scriptModule, categoryName);
            }

            insertEmptyArrayIfNotExist(scriptModule, 'changelog');
            if (moduleHasChangelog(scriptModule)) {
                for (const changelog of scriptModule.changelog) {
                    for (const categoryName of scriptModuleCategories) {
                        insertEmptyArrayIfNotExist(changelog, categoryName);
                    }
                }
            }
        }

        for (const commandsModule of release.command_modules) {
            insertEmptyArrayIfNotExist(commandsModule, 'commands');
            insertEmptyArrayIfNotExist(commandsModule, 'command_enums');
            insertEmptyArrayIfNotExist(commandsModule, 'command_types');
        }

        for (const blockModule of release.block_modules) {
            insertEmptyArrayIfNotExist(blockModule, 'data_items');
            insertEmptyArrayIfNotExist(blockModule, 'block_properties');
        }
    }
}

/**
 * Adds 'from_module' to the root of the module, to allow mustache to
 * look up the tree to access module data.
 */
function addFromModuleToRoot(releases: MinecraftRelease[]) {
    for (const release of releases) {
        release.script_modules.forEach(moduleJson => {
            const module = {
                name: moduleJson.name,
                uuid: moduleJson.uuid,
                version: moduleJson.version,
            };

            moduleJson.from_module = structuredClone(module);

            const addModuleToReturnType = (returnType: MinecraftType) => {
                for (const error of returnType.error_types ?? []) {
                    if (!error.from_module) {
                        error.from_module = structuredClone(module);
                    }
                }
            };

            for (const classJson of moduleJson.classes ?? []) {
                classJson.from_module = structuredClone(module);

                for (const functionJson of classJson.functions ?? []) {
                    addModuleToReturnType(functionJson.return_type);
                }

                for (const propertyJson of classJson.properties ?? []) {
                    addModuleToReturnType(propertyJson.type);
                }
            }

            for (const functionJson of moduleJson.functions ?? []) {
                addModuleToReturnType(functionJson.return_type);
            }

            for (const interfaceJson of moduleJson.interfaces ?? []) {
                interfaceJson.from_module = structuredClone(module);

                for (const functionJson of interfaceJson.functions ?? []) {
                    addModuleToReturnType(functionJson.return_type);
                }
            }

            for (const enumJson of moduleJson.enums ?? []) {
                enumJson.from_module = structuredClone(module);
            }

            for (const typeAlias of moduleJson.type_aliases ?? []) {
                typeAlias.from_module = structuredClone(module);
            }

            for (const errors of moduleJson.errors ?? []) {
                errors.from_module = structuredClone(module);
            }
        });
    }
}

/**
 * Marks up modules that have 'prerelease' semver tags.
 */
function markModulesWithPrerelease(releases: MinecraftRelease[]) {
    const markUpModule = (moduleJson: MinecraftScriptModule | MinecraftAfterEventsOrderByVersion) => {
        const prereleaseTag = semver.prerelease(moduleJson.version);
        if (prereleaseTag) {
            moduleJson.version_is_prerelease = true;
            if (prereleaseTag[0] === 'beta' || prereleaseTag[0] === 'alpha' || prereleaseTag[0] === 'internal') {
                moduleJson.module_prerelease_tag = prereleaseTag[0];
            } else if (prereleaseTag[0] === 'rc') {
                moduleJson.module_prerelease_tag = 'preview';
            } else {
                throw new Error(`Unexpected prerelease tag ${prereleaseTag[0]} on module: ${moduleJson.version}`);
            }
        } else {
            moduleJson.version_is_prerelease = false;
        }
    };

    for (const release of releases) {
        release.script_modules.forEach(markUpModule);

        const afterEventsOrderModule = getAfterEventsOrderingModuleFrom(release.engine_data_modules);
        if (afterEventsOrderModule) {
            afterEventsOrderModule.after_events_order_by_version.forEach(markUpModule);
        }
    }
}

/**
 * Generates list of module versions per release.
 */
function generateAvailableModuleLists(releases: MinecraftRelease[]) {
    for (const release of releases) {
        const moduleVersionsPerMajorVersionPerUUID: Record<string, Record<number, MinecraftScriptModule[]>> = {};

        release.script_modules.forEach(moduleJson => {
            if (!moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid]) {
                moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid] = [];
            }

            const moduleVersionsPerMajorVersion = moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid];
            const major = semver.major(moduleJson.version);
            if (!moduleVersionsPerMajorVersion[major]) {
                moduleVersionsPerMajorVersion[major] = [];
            }
            moduleVersionsPerMajorVersion[major].push(moduleJson);
            moduleJson.major_version = major;
        });

        for (const uuid in moduleVersionsPerMajorVersionPerUUID) {
            for (const major in moduleVersionsPerMajorVersionPerUUID[uuid]) {
                moduleVersionsPerMajorVersionPerUUID[uuid][major].sort(function (element1, element2) {
                    return semver.compare(element2.version, element1.version);
                });
            }
        }

        release.script_modules.forEach(moduleJson => {
            moduleJson.available_module_versions = moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid][
                semver.major(moduleJson.version)
            ].map(module => module.version);

            let major = semver.major(moduleJson.version) - 1;
            moduleJson.previous_module_version_chunks = [];
            while (major > 0 && moduleJson.is_latest_major) {
                if (!moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid][major]) {
                    major--;
                    continue;
                }
                const previousMajor = moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid][major][0];
                const filePath = generateMSDocsLink(undefined, previousMajor, undefined, undefined);

                moduleJson.previous_module_version_chunks.push({
                    versions: moduleVersionsPerMajorVersionPerUUID[moduleJson.uuid][major].map(
                        module => module.version
                    ),
                    prior_version_link: filePath,
                });
                major--;
            }

            const available_stable_module_versions = moduleJson.available_module_versions.filter(
                version => !semver.prerelease(version)
            );

            if (available_stable_module_versions.length > 0) {
                moduleJson.manifest_example_version_md = available_stable_module_versions[0];
            } else {
                moduleJson.manifest_example_version_md = moduleJson.available_module_versions[0];
            }

            const moduleSemVer = semver.parse(moduleJson.version);
            if (moduleSemVer.prerelease.length > 1) {
                if (moduleSemVer.prerelease[0] !== 'rc') {
                    moduleSemVer.prerelease = [moduleSemVer.prerelease[0]];
                } else {
                    moduleSemVer.prerelease = [];
                }
            }
            moduleJson.manifest_example_version_ts = moduleSemVer.format();
        });
    }
}

/**
 * Marks up all 'from_module' fields with data from actual modules.
 */
function populateFromModuleData(releases: MinecraftRelease[]) {
    const moduleKeyToData: { [key: string]: MinecraftModuleDescription } = {};
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            log.assert(
                scriptModule.from_module.folder_path !== undefined,
                "Module's folder path should not be undefined"
            );

            moduleKeyToData[`${scriptModule.uuid}_${scriptModule.version}`] = {
                name: scriptModule.name,
                filepath_name: scriptModule.filepath_name,
                folder_path: scriptModule.from_module.folder_path,
                prior_version: scriptModule.from_module.prior_version,
                version: scriptModule.version,
                uuid: scriptModule.uuid,
            };
        }
    }

    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithName(
                scriptModule,
                'from_module',
                (objectJson: Record<string, MinecraftModuleDescription>) => {
                    const moduleKey = `${objectJson.from_module.uuid}_${objectJson.from_module.version}`;
                    const moduleData = moduleKeyToData[moduleKey];
                    if (moduleData) {
                        objectJson.from_module.name = moduleData.name;
                        objectJson.from_module.filepath_name = moduleData.filepath_name;
                        objectJson.from_module.folder_path = moduleData.folder_path;
                        objectJson.from_module.prior_version = moduleData.prior_version;
                    } else {
                        log.printOption(
                            `Could not populate from_module for module '${
                                objectJson.from_module.name
                            }@${objectJson.from_module.version}' in '${scriptModule.name}@${scriptModule.version}'.`,
                            'unresolvedDependencies'
                        );
                    }
                }
            );
        }
    }
}

function addPrivilegeFlags(releases: MinecraftRelease[]) {
    const tryGetClosurePrivilegeFromType = (type?: MinecraftType) => {
        if (type === undefined) {
            return undefined;
        } else if (type.optional_type) {
            return tryGetClosurePrivilegeFromType(type.optional_type);
        } else if (type.closure_type && type.closure_type.call_privilege) {
            // convert to friendly names for documentation
            if (PrivilegeTypes.Default === type.closure_type.call_privilege.name) {
                return undefined; // dont document default privileges
            } else if (PrivilegeTypes.EarlyExec === type.closure_type.call_privilege.name) {
                return 'early-execution';
            } else if (PrivilegeTypes.RestrictedExec === type.closure_type.call_privilege.name) {
                return 'restricted-execution';
            }
        }
        return undefined;
    };

    const contains = (search: string, priv?: PrivilegeValueType[]) => {
        if (priv === undefined) {
            return false;
        }

        for (const p of priv) {
            if (p.name === search) {
                return true;
            }
        }

        return false;
    };

    const checkPropertyPrivileges = (prop: MinecraftProperty) => {
        if (!prop.is_read_only) {
            prop.set_disallowed_in_restricted_execution = !contains(PrivilegeTypes.RestrictedExec, prop.set_privilege);
            prop.get_disallowed_in_restricted_execution = !contains(PrivilegeTypes.RestrictedExec, prop.get_privilege);
        }

        prop.set_allowed_in_early_execution = contains(PrivilegeTypes.EarlyExec, prop.set_privilege);
        prop.get_allowed_in_early_execution = contains(PrivilegeTypes.EarlyExec, prop.get_privilege);

        prop.has_privilege_comments =
            prop.set_allowed_in_early_execution ||
            prop.get_allowed_in_early_execution ||
            prop.set_disallowed_in_restricted_execution ||
            prop.get_disallowed_in_restricted_execution;

        const closurePrivilegeName = tryGetClosurePrivilegeFromType(prop.type);
        if (closurePrivilegeName !== undefined) {
            prop.has_closure_privilege_type_comments = true;
            prop.closure_privilege_type_name = closurePrivilegeName;
        }
    };

    const checkFunctionPrivileges = (func: MinecraftFunction) => {
        func.call_disallowed_in_restricted_execution = !contains(PrivilegeTypes.RestrictedExec, func.call_privilege);
        func.call_allowed_in_early_execution = contains(PrivilegeTypes.EarlyExec, func.call_privilege);

        func.has_privilege_comments =
            func.call_disallowed_in_restricted_execution || func.call_allowed_in_early_execution;

        for (const argument of func.arguments) {
            const priv = tryGetClosurePrivilegeFromType(argument.type);
            if (priv !== undefined) {
                func.has_comments = true;
                argument.has_closure_privilege_type_comments = true;
                argument.closure_privilege_type_name = priv;
            }
        }

        const retPriv = tryGetClosurePrivilegeFromType(func.return_type);
        if (retPriv !== undefined) {
            func.has_comments = true;
            func.return_type_has_closure_privilege_type_comments = true;
            func.return_type_closure_privilege_type_name = retPriv;
        }
    };

    for (const release of releases ?? []) {
        for (const scriptModule of release.script_modules ?? []) {
            for (const classMetadata of scriptModule.classes ?? []) {
                for (const prop of classMetadata.properties ?? []) {
                    checkPropertyPrivileges(prop);
                }
                for (const func of classMetadata.functions ?? []) {
                    checkFunctionPrivileges(func);
                }
            }
            for (const errorMetadata of scriptModule.errors ?? []) {
                for (const prop of errorMetadata.properties ?? []) {
                    checkPropertyPrivileges(prop);
                }
            }
            for (const func of scriptModule.functions ?? []) {
                checkFunctionPrivileges(func);
            }
        }
    }
}

function addRuntimeConditionsFlag(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            for (const interfaceMetadata of scriptModule.interfaces ?? []) {
                interfaceMetadata.has_runtime_conditions =
                    interfaceMetadata.runtime_conditions !== undefined &&
                    interfaceMetadata.runtime_conditions.length > 0;
            }

            for (const classMetadata of scriptModule.classes ?? []) {
                classMetadata.has_runtime_conditions =
                    classMetadata.runtime_conditions !== undefined && classMetadata.runtime_conditions.length > 0;

                for (const functionMetadata of classMetadata.functions ?? []) {
                    const culledFunctionRuntimeConditions = [];
                    for (const functionRuntimeCondition of functionMetadata.runtime_conditions ?? []) {
                        let functionRuntimeConditionMatchedClass = false;
                        for (const classRuntimeCondition of classMetadata.runtime_conditions ?? []) {
                            if (functionRuntimeCondition === classRuntimeCondition) {
                                functionRuntimeConditionMatchedClass = true;
                                break;
                            }
                        }
                        if (!functionRuntimeConditionMatchedClass) {
                            culledFunctionRuntimeConditions.push(functionRuntimeCondition);
                        }
                    }
                    functionMetadata.runtime_conditions = culledFunctionRuntimeConditions;

                    functionMetadata.has_runtime_conditions =
                        functionMetadata.runtime_conditions !== undefined &&
                        functionMetadata.runtime_conditions.length > 0;
                }
            }
        }
    }
}

/**
 * This updates all from_module dependencies from the parent (i.e. server-bindings) to the base (i.e. server)
 *
 * @param releases
 */
function upgradeFromModuleToBaseModule(releases: MinecraftRelease[]) {
    for (const release of releases) {
        const latestModules = getLatestScriptModules(release.script_modules);
        // Create a mapping from parent uuid (server-bindings uuid) to base uuid (server uuid and name)
        const parentuuidToLatestBase: Record<string, { uuid: string; name: string }> = {};
        for (const module of latestModules) {
            if (!module.marked_up_parent_module) {
                continue;
            }
            parentuuidToLatestBase[module.marked_up_parent_module.uuid] = module;
        }
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithName(
                scriptModule,
                'from_module',
                (jsonObject: Record<string, MinecraftModuleDescription>) => {
                    if (jsonObject.from_module.uuid === scriptModule.uuid) {
                        return;
                    }
                    if (parentuuidToLatestBase[jsonObject.from_module.uuid]) {
                        const base = parentuuidToLatestBase[jsonObject.from_module.uuid];
                        const dependencies: MinecraftModuleDependency[] = scriptModule.dependencies.concat(
                            scriptModule.peer_dependencies ?? []
                        );

                        if (dependencies.every(d => d.uuid !== base.uuid)) {
                            // Only change dependency if we rely on base module
                            return;
                        }
                        jsonObject.from_module.name = base.name;
                        jsonObject.from_module.uuid = base.uuid;
                    }
                }
            );
        }
    }
}

export const CommonFilters: FilterGroup = {
    id: 'common',
    filters: [
        ['mark_prerelease_modules', markModulesWithPrerelease], // No dependencies
        ['default_module_categories', defaultModuleCategories], // No dependencies
        ['upgrade_from_module_to_base', upgradeFromModuleToBaseModule], // No dependencies
        ['link_derived_types', linkDerivedTypes], // Depends on upgrade_from_module_to_base
        ['add_from_module_to_root', addFromModuleToRoot], // No dependencies
        ['external_module_flag', fromExternalModule], // Depends on link_derived_types, add_from_module_to_root
        ['add_from_module_to_dependencies', addFromModuleToDependencies], // Run after upgrade_from_module_to_base for perf
        ['set_from_module_to_dependent_modules', setFromModuleToDependentModules], // No dependencies
        ['markup_latest_modules', markupLatestModules], // Depends on add_from_module_to_root, add_from_module_to_dependencies, set_from_module_to_dependent_modules
        ['markup_names', markupNames], // Depends on add_from_module_to_dependencies, markup_latest_modules
        ['populate_from_module_data', populateFromModuleData], // Depends on add_from_module_to_root, set_from_module_to_dependent_modules, markup_names
        ['generate_available_module_lists', generateAvailableModuleLists], // Depends on populate_from_module_data
        ['mark_members', markMembers],
        ['mark_interfaces', markInterfaceTypes],
        ['flag_changelog_changes', flagChangelogChanges],
        ['nest_changed_types', nestChangedTypes],
        ['copy_changelogs', copyChangelogsToObjectMetadata],
        ['mark_errorable', markErrorable],
        ['mark_prerelease', markPrerelease],
        ['mark_deprecated', markDeprecated],
        CommandMarkupFilter,
        ['block_filters', blockFilters],
        ['constant_values', constantValues],
        ['default_values', defaultValues],
        ['markup_categories', markupCategories],
        ['type_alias_markup', typeAliasMarkup],
        ['type_flags', typeFlags],
        ['constructors', constructors],
        ['array_indexes', arrayIndexes],
        ['add_privilege_flags', addPrivilegeFlags],
        ['add_descriptions_and_examples', addDescriptionsAndExamples],
        ['add_runtime_conditions_flag', addRuntimeConditionsFlag],
    ],
};
