// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';

import {
    CommonFilters,
    FilterGroup,
    MinecraftRelease,
    MinecraftScriptModuleRecord,
    ModuleVersionChangelogStrategy,
    TypeScriptFilters,
} from '..';
import { ChangelogGenerator } from '../changelog';

function callFilter(group: FilterGroup, name: string, releases: MinecraftRelease[]) {
    const filter = group.filters?.find(([filterName]) => filterName === name);
    if (!filter) {
        throw new Error(`Could not find filter '${name}'.`);
    }
    filter[1](releases);
}

function makeGenericModule() {
    return MinecraftScriptModuleRecord.check({
        name: '@minecraft/generic-test',
        uuid: '5ce17b54-bd14-4d50-92f6-d3b75117c73f',
        version: '1.0.0',
        minecraft_version: '1.0.0',
        module_type: 'script',
        classes: [
            {
                name: 'GenericFixture',
                type: {
                    name: 'GenericFixture',
                    is_errorable: false,
                    is_bind_type: true,
                },
                generic_class_types: [
                    {
                        name: 'TZebra',
                        constraint: {
                            name: 'int32',
                            is_errorable: false,
                            is_bind_type: false,
                        },
                    },
                    {
                        name: 'TAlpha',
                        default: {
                            name: 'string',
                            is_errorable: false,
                            is_bind_type: false,
                        },
                    },
                ],
                functions: [
                    {
                        name: 'get',
                        is_constructor: false,
                        is_static: true,
                        generic_function_types: [
                            {
                                name: 'TFixture',
                                constraint: {
                                    name: 'GenericFixture',
                                    is_errorable: false,
                                    is_bind_type: true,
                                },
                            },
                        ],
                        arguments: [
                            {
                                name: 'classType',
                                type: {
                                    name: 'NativeClass<TFixture>',
                                    is_errorable: false,
                                    is_bind_type: false,
                                    generic_base: {
                                        name: 'NativeClass',
                                        is_errorable: false,
                                        is_bind_type: false,
                                    },
                                    generic_types: [
                                        {
                                            name: 'TFixture',
                                            is_errorable: false,
                                            is_bind_type: false,
                                        },
                                    ],
                                },
                            },
                        ],
                        return_type: {
                            name: 'optional',
                            is_errorable: false,
                            is_bind_type: false,
                            optional_type: {
                                name: 'TFixture',
                                is_errorable: false,
                                is_bind_type: false,
                            },
                        },
                    },
                ],
            },
        ],
    });
}

describe('generic metadata', () => {
    it('validates ordered generic declarations and recursively processes their types', () => {
        const scriptModule = makeGenericModule();
        const classToken = scriptModule.classes?.[0].functions?.[0].arguments[0].type;
        if (classToken) {
            classToken.error_types = [
                {
                    name: 'SpecificError',
                    is_errorable: false,
                    is_bind_type: true,
                },
            ];
        }
        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [scriptModule];

        callFilter(CommonFilters, 'type_flags', [release]);
        callFilter(TypeScriptFilters, 'rename_types', [release]);
        callFilter(TypeScriptFilters, 'mark_native_class_usage', [release]);

        const genericClassTypes = scriptModule.classes?.[0].generic_class_types;
        expect(genericClassTypes?.map(type => type.name)).toEqual(['TZebra', 'TAlpha']);
        expect(genericClassTypes?.[0].constraint?.name).toBe('number');
        expect(genericClassTypes?.[1].default?.is_string).toBe(true);

        expect(classToken?.is_generic).toBe(true);
        expect(classToken?.generic_base?.is_generic).toBe(false);
        expect(classToken?.error_types?.[0].is_generic).toBe(false);
        expect(scriptModule.uses_native_class).toBe(true);
    });

    it('does not reserve bound or script-generated NativeClass references', () => {
        const boundModule = makeGenericModule();
        const boundType = boundModule.classes?.[0].functions?.[0].arguments[0].type;
        if (boundType?.generic_base) {
            boundType.generic_base.is_bind_type = true;
        }

        const scriptGeneratedModule = makeGenericModule();
        const scriptGeneratedFunction = scriptGeneratedModule.classes?.[0].functions?.[0];
        if (scriptGeneratedFunction) {
            scriptGeneratedFunction.is_script_generated = true;
            scriptGeneratedFunction.raw_script_text =
                'static get<TFixture>(classType: NativeClass<TFixture>): TFixture | undefined;';
        }

        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [boundModule, scriptGeneratedModule];
        callFilter(TypeScriptFilters, 'mark_native_class_usage', [release]);

        expect(boundModule.uses_native_class).toBeUndefined();
        expect(scriptGeneratedModule.uses_native_class).toBeUndefined();
    });

    it('renders interface methods that use structured generic applications', () => {
        const scriptModule = makeGenericModule();
        scriptModule.interfaces = [
            {
                name: 'ApplicationInterface',
                type: {
                    name: 'ApplicationInterface',
                    is_errorable: false,
                    is_bind_type: true,
                },
                properties: [],
                functions: [
                    {
                        name: 'getPair',
                        is_constructor: false,
                        arguments: [],
                        return_type: {
                            name: 'GenericFixture<string>',
                            is_errorable: false,
                            is_bind_type: false,
                            generic_base: {
                                name: 'GenericFixture',
                                is_errorable: false,
                                is_bind_type: true,
                            },
                            generic_types: [
                                {
                                    name: 'string',
                                    is_errorable: false,
                                    is_bind_type: false,
                                },
                            ],
                        },
                    },
                ],
            },
        ];
        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [scriptModule];

        callFilter(CommonFilters, 'mark_members', [release]);

        expect(scriptModule.interfaces[0].has_member_functions).toBe(true);
        expect(scriptModule.interfaces[0].functions?.[0].is_member).toBe(true);
    });

    it('rejects invalid NativeClass applications and conflicting declarations', () => {
        const invalidModule = makeGenericModule();
        const invalidType = invalidModule.classes?.[0].functions?.[0].arguments[0].type;
        if (invalidType) {
            invalidType.generic_types = [];
        }

        const invalidRelease = new MinecraftRelease('1.0.0');
        invalidRelease.script_modules = [invalidModule];
        expect(() => callFilter(TypeScriptFilters, 'mark_native_class_usage', [invalidRelease])).toThrow(
            'exactly one is required'
        );

        const conflictingModule = makeGenericModule();
        conflictingModule.interfaces = [
            {
                name: 'NativeClass',
                type: {
                    name: 'NativeClass',
                    is_errorable: false,
                    is_bind_type: true,
                },
            },
        ];
        const conflictingRelease = new MinecraftRelease('1.0.0');
        conflictingRelease.script_modules = [conflictingModule];
        expect(() => callFilter(TypeScriptFilters, 'mark_native_class_usage', [conflictingRelease])).toThrow(
            'declares an API type with the same name'
        );

        const validThenInvalidModule = makeGenericModule();
        validThenInvalidModule.functions = [
            {
                name: 'invalidLater',
                is_constructor: false,
                arguments: [
                    {
                        name: 'classType',
                        type: {
                            name: 'NativeClass',
                            is_errorable: false,
                            is_bind_type: false,
                            generic_base: {
                                name: 'NativeClass',
                                is_errorable: false,
                                is_bind_type: false,
                            },
                            generic_types: [],
                        },
                    },
                ],
                return_type: {
                    name: 'void',
                    is_errorable: false,
                    is_bind_type: false,
                },
            },
        ];
        const validThenInvalidRelease = new MinecraftRelease('1.0.0');
        validThenInvalidRelease.script_modules = [validThenInvalidModule];
        expect(() => callFilter(TypeScriptFilters, 'mark_native_class_usage', [validThenInvalidRelease])).toThrow(
            'exactly one is required'
        );
    });

    it('ignores NativeClass references copied into historical changelog fields', () => {
        const scriptModule = makeGenericModule();
        const currentFunction = scriptModule.classes?.[0].functions?.[0];
        const classToken = currentFunction?.arguments[0].type;
        if (!currentFunction || !classToken) {
            throw new Error('Expected the generic fixture method.');
        }

        currentFunction.arguments[0].type = {
            name: 'string',
            is_errorable: false,
            is_bind_type: false,
        };
        Object.assign(currentFunction, {
            function_changelog: [
                {
                    arguments: [
                        {
                            type: classToken,
                        },
                    ],
                },
            ],
        });

        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [scriptModule];
        callFilter(TypeScriptFilters, 'mark_native_class_usage', [release]);

        expect(scriptModule.uses_native_class).toBeUndefined();
    });

    it('ignores from_module version changes in generic declarations', () => {
        const makeModule = (version: string, referencedVersion: string) =>
            MinecraftScriptModuleRecord.check({
                name: '@minecraft/changelog-generics',
                uuid: 'e6ee6472-58b3-414b-a531-920b066fbfed',
                version,
                minecraft_version: '1.0.0',
                module_type: 'script',
                classes: [
                    {
                        name: 'StableGeneric',
                        type: {
                            name: 'StableGeneric',
                            is_errorable: false,
                            is_bind_type: true,
                        },
                        generic_class_types: [
                            {
                                name: 'T',
                                constraint: {
                                    name: 'ExternalBase',
                                    is_errorable: false,
                                    is_bind_type: true,
                                    from_module: {
                                        name: '@minecraft/external',
                                        uuid: '2053a91f-4047-4ddf-9a07-841b2a084dbe',
                                        version: referencedVersion,
                                    },
                                },
                            },
                        ],
                        base_types: [],
                        properties: [],
                        functions: [],
                    },
                ],
            });
        const oldModule = makeModule('1.0.0', '1.0.0');
        const newModule = makeModule('1.1.0', '1.1.0');
        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [oldModule, newModule];

        new ChangelogGenerator(new ModuleVersionChangelogStrategy()).generateChangelogs([release]);

        const changelog = (
            newModule as typeof newModule & {
                changelog?: Array<{
                    version: string;
                    classes?: Array<{ name: string; generic_class_types?: unknown }>;
                }>;
            }
        ).changelog;
        const changedClasses = changelog?.find(entry => entry.version === '1.1.0')?.classes ?? [];
        const stableGeneric = changedClasses.find(classJson => classJson.name === 'StableGeneric');
        expect(Array.isArray(stableGeneric?.generic_class_types)).toBe(true);
    });

    it('tracks method signature changes on generic interfaces', () => {
        const makeModule = (version: string, returnArray: boolean) =>
            MinecraftScriptModuleRecord.check({
                name: '@minecraft/interface-changelog-generics',
                uuid: 'ad4ee795-9b5f-4b4d-917d-a47a557af069',
                version,
                minecraft_version: '1.0.0',
                module_type: 'script',
                interfaces: [
                    {
                        name: 'GenericInterface',
                        type: {
                            name: 'GenericInterface',
                            is_errorable: false,
                            is_bind_type: true,
                        },
                        generic_class_types: [{ name: 'T' }],
                        properties: [],
                        functions: [
                            {
                                name: 'get',
                                is_constructor: false,
                                arguments: [],
                                return_type: returnArray
                                    ? {
                                          name: 'array',
                                          is_errorable: false,
                                          is_bind_type: false,
                                          element_type: {
                                              name: 'T',
                                              is_errorable: false,
                                              is_bind_type: false,
                                          },
                                      }
                                    : {
                                          name: 'T',
                                          is_errorable: false,
                                          is_bind_type: false,
                                      },
                            },
                        ],
                    },
                ],
            });
        const oldModule = makeModule('1.0.0', false);
        const newModule = makeModule('1.1.0', true);
        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [oldModule, newModule];

        new ChangelogGenerator(new ModuleVersionChangelogStrategy()).generateChangelogs([release]);

        const changelog = (
            newModule as typeof newModule & {
                changelog?: Array<{
                    version: string;
                    interfaces?: Array<{
                        name: string;
                        functions?: Array<{ name: string; return_type?: { $changed?: boolean } }>;
                    }>;
                }>;
            }
        ).changelog;
        const genericInterface = changelog
            ?.find(entry => entry.version === '1.1.0')
            ?.interfaces?.find(interfaceJson => interfaceJson.name === 'GenericInterface');
        expect(
            genericInterface?.functions?.find(functionJson => functionJson.name === 'get')?.return_type?.$changed
        ).toBe(true);
    });

    it('handles nullable interface member collections when flagging changelogs', () => {
        const makeModule = (version: string, parameterName: string) =>
            MinecraftScriptModuleRecord.check({
                name: '@minecraft/nullable-interface-generics',
                uuid: '75bda9f4-4d0f-49a6-bad3-46a81546158b',
                version,
                minecraft_version: '1.0.0',
                module_type: 'script',
                interfaces: [
                    {
                        name: 'NullableInterface',
                        type: {
                            name: 'NullableInterface',
                            is_errorable: false,
                            is_bind_type: true,
                        },
                        generic_class_types: [{ name: parameterName }],
                        // eslint-disable-next-line unicorn/no-null
                        properties: null,
                        // eslint-disable-next-line unicorn/no-null
                        functions: null,
                    },
                ],
            });
        const oldModule = makeModule('1.0.0', 'TOld');
        const newModule = makeModule('1.1.0', 'TNew');
        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [oldModule, newModule];
        new ChangelogGenerator(new ModuleVersionChangelogStrategy()).generateChangelogs([release]);

        expect(() => callFilter(CommonFilters, 'flag_changelog_changes', [release])).not.toThrow();
    });
});
