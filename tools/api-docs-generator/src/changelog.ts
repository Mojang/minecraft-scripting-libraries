// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import deepEqual from 'deep-equal';

import { ChangelogVersionKey, ChangelogStrategy } from './ChangelogStrategy';
import { MinecraftRelease } from './MinecraftRelease';
import { ModuleTypes, IMinecraftModule } from './modules/IMinecraftModule';
import {
    ArrayChangelogEntry,
    ModuleWithChangelog,
    IMinecraftModuleChangelogEntry,
} from './modules/MinecraftChangelogTypes';
import * as utils from './utilities';

type MetadataScope =
    | ValueMetadataScope
    | SimpleOrderedArrayMetadataScope
    | ArrayDeepCopyMetadataScope
    | ObjectMetadataScope
    | ArrayMetadataScope;

type RootMetadataScope =
    | ObjectMetadataScope
    | ArrayMetadataScope
    | SimpleOrderedArrayMetadataScope
    | ArrayDeepCopyMetadataScope;

interface ValueMetadataScope {
    type: 'value';
    ignoredSubmembers?: string[];
}

interface SimpleOrderedArrayMetadataScope {
    type: 'simple_ordered_array';
    key: 'name';
    submembers?: Record<string, MetadataScope>;
}

interface ArrayDeepCopyMetadataScope {
    type: 'array_deep_copy';
    key: 'name';
    submembers?: Record<string, MetadataScope>;
}

interface ObjectMetadataScope {
    type: 'object';
    key: 'name';
    submembers: Record<string, MetadataScope>;
}

interface ArrayMetadataScope {
    type: 'array';
    key: string;
    submembers?: Record<string, MetadataScope>;
}

const TypeDataLayout: ValueMetadataScope = {
    type: 'value',
    ignoredSubmembers: ['from_module'],
};

const VersionDataLayout: ArrayMetadataScope = {
    type: 'array',
    key: 'version',
};

const ModuleDependenciesDataLayout: ArrayMetadataScope = {
    type: 'array',
    key: 'name',
    submembers: {
        versions: VersionDataLayout,
        types_only: { type: 'value' },
    },
};

const scriptingDataLayout: RootMetadataScope = {
    type: 'object',
    key: 'name',
    submembers: {
        dependencies: ModuleDependenciesDataLayout,
        peer_dependencies: ModuleDependenciesDataLayout,
        classes: {
            type: 'array',
            key: 'name',
            submembers: {
                properties: {
                    type: 'array',
                    key: 'name',
                    submembers: {
                        is_read_only: { type: 'value' },
                        get_privilege: { type: 'array', key: 'name' },
                        set_privilege: { type: 'array', key: 'name' },
                        type: TypeDataLayout,
                    },
                },
                functions: {
                    type: 'array',
                    key: 'name',
                    submembers: {
                        arguments: {
                            type: 'array',
                            key: 'name',
                            submembers: {
                                type: TypeDataLayout,
                            },
                        },
                        call_privilege: { type: 'array', key: 'name' },
                        return_type: TypeDataLayout,
                    },
                },
                constants: {
                    type: 'array',
                    key: 'name',
                    submembers: { value: { type: 'value' } },
                },
                base_types: { type: 'array', key: 'name' },
            },
        },
        interfaces: {
            type: 'array',
            key: 'name',
            submembers: {
                properties: {
                    type: 'array',
                    key: 'name',
                    submembers: { is_read_only: { type: 'value' }, type: TypeDataLayout },
                },
            },
        },
        errors: {
            type: 'array',
            key: 'name',
            submembers: {
                properties: {
                    type: 'array',
                    key: 'name',
                    submembers: {
                        is_read_only: { type: 'value' },
                        type: TypeDataLayout,
                        get_privilege: { type: 'array', key: 'name' },
                        set_privilege: { type: 'array', key: 'name' },
                    },
                },
            },
        },
        objects: {
            type: 'array',
            key: 'name',
            submembers: { is_read_only: { type: 'value' }, type: TypeDataLayout },
        },
        functions: {
            type: 'array',
            key: 'name',
            submembers: {
                arguments: {
                    type: 'array',
                    key: 'name',
                    submembers: {
                        type: TypeDataLayout,
                    },
                },
                return_type: TypeDataLayout,
                call_privilege: { type: 'array', key: 'name' },
            },
        },
        constants: {
            type: 'array',
            key: 'name',
            submembers: { value: { type: 'value' } },
        },
        enums: {
            type: 'array',
            key: 'name',
            submembers: {
                constants: {
                    type: 'array',
                    key: 'name',
                    submembers: { value: { type: 'value' } },
                },
            },
        },
        type_aliases: {
            type: 'array',
            key: 'name',
            submembers: {
                type: TypeDataLayout,
                mappings: {
                    type: 'array',
                    key: 'name',
                    submembers: { value: { type: 'value' } },
                },
            },
        },
    },
};

const commandsDataLayout: RootMetadataScope = {
    type: 'object',
    key: 'name',
    submembers: {
        commands: {
            type: 'array',
            key: 'name',
            submembers: {
                aliases: {
                    type: 'array',
                    key: 'name',
                    submembers: { name: { type: 'value' } },
                },
                permission_level: { type: 'value' },
                requires_cheats: { type: 'value' },
                overloads: {
                    type: 'array',
                    key: 'name',
                    submembers: {
                        params: {
                            type: 'array_deep_copy',
                            key: 'name',
                            submembers: {
                                type: { type: 'value' },
                                is_optional: { type: 'value' },
                            },
                        },
                    },
                },
            },
        },
    },
};

const afterEventsOrderingDataLayout: RootMetadataScope = {
    type: 'object',
    key: 'name',
    submembers: {
        name: { type: 'value' },
        after_events_order_by_version: {
            type: 'array',
            key: 'name',
            submembers: {
                version: { type: 'value' },
                version_is_prerelease: { type: 'value' },
                event_order: {
                    type: 'simple_ordered_array',
                    key: 'name',
                },
            },
        },
    },
};

const vanillaDataDataLayout: RootMetadataScope = {
    type: 'object',
    key: 'name',
    submembers: {
        data_items: {
            type: 'array',
            key: 'name',
        },
    },
};

const blockVanillaDataDataLayout: RootMetadataScope = {
    type: 'object',
    key: 'name',
    submembers: {
        block_properties: {
            type: 'array',
            key: 'name',
            submembers: {
                type: { type: 'value' },
                values: {
                    type: 'array_deep_copy',
                    key: 'name',
                },
            },
        },
        data_items: {
            type: 'array',
            key: 'name',
            submembers: {
                properties: {
                    type: 'array_deep_copy',
                    key: 'name',
                },
            },
        },
    },
};

type WithVersionKey<T, K extends ChangelogVersionKey> = T & Record<K, string>;

const modulesHaveVersionKey = <T extends IMinecraftModule, K extends ChangelogVersionKey>(
    moduleList: T[],
    key: K
): moduleList is WithVersionKey<T, K>[] => {
    return moduleList.length !== 0 && key in moduleList[0];
};

type ChangelogList = '$added' | '$removed';

export class ChangelogGenerator {
    constructor(_config: ChangelogStrategy) {
        this.config = _config;
    }
    config: ChangelogStrategy;

    private getChangelogForVersion(changelog: Partial<IMinecraftModuleChangelogEntry>[], version: string) {
        const versionKey = this.config.getVersionKey();

        let changelogVersionIndex = changelog.map(objectData => objectData[versionKey]).indexOf(version);

        if (changelogVersionIndex === -1) {
            changelogVersionIndex =
                changelog.push({
                    [versionKey]: version,
                }) - 1;
        }

        return changelog[changelogVersionIndex];
    }

    private compareArray(
        arrayChangelog: Array<Record<string, unknown>>,
        changeLogList: ChangelogList,
        dataLayout: RootMetadataScope,
        subObjectKey: string,
        currentSubobjects: Array<Record<string, unknown>>,
        nextSubobjects: Array<Record<string, unknown>>
    ) {
        currentSubobjects.forEach(currentSubObjectPropertyData => {
            const subObjectDataLayout = dataLayout.submembers[subObjectKey];
            const subObjectDataLayoutAsArray = dataLayout.submembers[subObjectKey] as ArrayMetadataScope;

            const nextObjectPropertyIndex = nextSubobjects
                .map(objectData => objectData[subObjectDataLayoutAsArray.key])
                .indexOf(currentSubObjectPropertyData[subObjectDataLayoutAsArray.key]);

            if (nextObjectPropertyIndex === -1) {
                const objectChange = {
                    [subObjectDataLayoutAsArray.key]: utils.deepCopyJson(
                        currentSubObjectPropertyData[subObjectDataLayoutAsArray.key]
                    ),
                    [changeLogList]: true,
                    ...currentSubObjectPropertyData,
                };

                arrayChangelog.push(objectChange as ArrayChangelogEntry);
            } else {
                const nextObjectData = nextSubobjects[nextObjectPropertyIndex];

                switch (subObjectDataLayout.type) {
                    case 'array':
                    case 'array_deep_copy':
                    case 'simple_ordered_array':
                    case 'object': {
                        let changelogIndex = arrayChangelog
                            .map(objectData => objectData[subObjectDataLayout.key])
                            .indexOf(currentSubObjectPropertyData[subObjectDataLayout.key]);

                        if (changelogIndex === -1) {
                            const currentObjPropData = {
                                [subObjectDataLayout.key]: currentSubObjectPropertyData[subObjectDataLayout.key],
                            };
                            changelogIndex = arrayChangelog.push(currentObjPropData) - 1;
                        }

                        const subChangelog = arrayChangelog[changelogIndex];

                        this.generate(
                            subChangelog,
                            changeLogList,
                            subObjectDataLayout,
                            currentSubObjectPropertyData,
                            nextObjectData
                        );

                        const propertyNames = Object.getOwnPropertyNames(subChangelog);
                        if (propertyNames.length === 1 && propertyNames[0] === subObjectDataLayout.key) {
                            arrayChangelog.splice(changelogIndex, 1);
                        } else {
                            arrayChangelog[changelogIndex] = {
                                ...currentSubObjectPropertyData,
                                ...arrayChangelog[changelogIndex],
                            };
                        }

                        break;
                    }
                    default:
                        break;
                }
            }
        });
    }

    private generate(
        parentObjectChangelog: Record<string, unknown>,
        changeLogList: ChangelogList,
        dataLayout: RootMetadataScope,
        currentObjectData: Record<string, unknown>,
        nextObjectData: Record<string, unknown>
    ) {
        for (const subObjectKey in dataLayout.submembers) {
            const subObjectDataLayout = dataLayout.submembers[subObjectKey];
            switch (subObjectDataLayout.type) {
                case 'value': {
                    const currentObjectValue = currentObjectData[subObjectKey];
                    const nextObjectValue = nextObjectData[subObjectKey];

                    const currentObjectValueCopy = utils.deepCopyJson(currentObjectValue) as Record<string, unknown>;
                    const nextObjectValueCopy = utils.deepCopyJson(nextObjectValue) as Record<string, unknown>;

                    subObjectDataLayout.ignoredSubmembers?.forEach(ignoredSubmember => {
                        utils.removePropertyRecursive(currentObjectValueCopy, ignoredSubmember);
                        utils.removePropertyRecursive(nextObjectValueCopy, ignoredSubmember);
                    });

                    if (!deepEqual(currentObjectValueCopy, nextObjectValueCopy)) {
                        parentObjectChangelog[subObjectKey] = {
                            $old: utils.deepCopyJson(currentObjectValue),
                            $new: utils.deepCopyJson(nextObjectValue),
                            $changed: true,
                        };
                    }

                    break;
                }
                case 'object':
                case 'array': {
                    if (parentObjectChangelog[subObjectKey] === undefined) {
                        parentObjectChangelog[subObjectKey] = [];
                    }
                    const currentSubobjects = currentObjectData[subObjectKey] ?? [];
                    const nextSubobjects = nextObjectData[subObjectKey] ?? [];

                    this.compareArray(
                        parentObjectChangelog[subObjectKey] as Array<Record<string, unknown>>,
                        changeLogList,
                        dataLayout,
                        subObjectKey,
                        currentSubobjects as Array<Record<string, unknown>>,
                        nextSubobjects as Array<Record<string, unknown>>
                    );
                    break;
                }
                case 'array_deep_copy': {
                    if (parentObjectChangelog[subObjectKey] === undefined) {
                        parentObjectChangelog[subObjectKey] = [];
                    }
                    const currentSubobjects = currentObjectData[subObjectKey] ?? [];
                    const nextSubobjects = nextObjectData[subObjectKey] ?? [];

                    if (!deepEqual(currentSubobjects, nextSubobjects)) {
                        const objectCopyKey = `$${subObjectKey}_copy`;
                        parentObjectChangelog[objectCopyKey] = {
                            $old: utils.deepCopyJson(currentSubobjects),
                            $new: utils.deepCopyJson(nextSubobjects),
                            $changed: true,
                        };

                        this.compareArray(
                            parentObjectChangelog[subObjectKey] as Array<Record<string, unknown>>,
                            changeLogList,
                            dataLayout as ArrayDeepCopyMetadataScope,
                            subObjectKey,
                            currentSubobjects as Array<Record<string, unknown>>,
                            nextSubobjects as Array<Record<string, unknown>>
                        );
                    }
                    break;
                }
                case 'simple_ordered_array': {
                    if (parentObjectChangelog[subObjectKey] === undefined) {
                        parentObjectChangelog[subObjectKey] = [];
                    }
                    const currentSubobjects = currentObjectData[subObjectKey] ?? [];
                    const nextSubobjects = nextObjectData[subObjectKey] ?? [];

                    if (!deepEqual(currentSubobjects, nextSubobjects)) {
                        parentObjectChangelog[subObjectKey] = {
                            $old: utils.deepCopyJson(currentSubobjects),
                            $new: utils.deepCopyJson(nextSubobjects),
                            $changed: true,
                            $key: subObjectDataLayout.key,
                        };
                    }
                    break;
                }
            }
        }
    }

    private generateModuleChangeLog<K extends ChangelogVersionKey>(
        changelog: ArrayChangelogEntry<WithVersionKey<IMinecraftModule, K>>[],
        modulesJson: WithVersionKey<IMinecraftModule, K>[],
        dataLayout: RootMetadataScope,
        changeLogList: ChangelogList,
        versionKey: K,
        sortComparer: (
            keyName: K
        ) => (
            element1: ArrayChangelogEntry<WithVersionKey<IMinecraftModule, K>>,
            element2: ArrayChangelogEntry<WithVersionKey<IMinecraftModule, K>>
        ) => number,
        applyToCurrentModule: boolean
    ) {
        const modulesJsonSorted = modulesJson.sort(sortComparer(versionKey));

        for (let currentModuleIndex = modulesJsonSorted.length - 1; currentModuleIndex > 0; currentModuleIndex--) {
            const nextModuleIndex = currentModuleIndex - 1;

            const currentModule = modulesJsonSorted[currentModuleIndex];
            const nextModule = modulesJsonSorted[nextModuleIndex];

            const dataChangedVersion = applyToCurrentModule ? currentModule[versionKey] : nextModule[versionKey];
            const versionChangelog = this.getChangelogForVersion(changelog, dataChangedVersion);
            this.generate(versionChangelog, changeLogList, dataLayout, currentModule, nextModule);
        }
        return changelog;
    }

    generateChangelogs(releases: MinecraftRelease[]) {
        const moduleGroups = this.config.generateModuleGroups(releases);

        for (const currentModuleList of moduleGroups) {
            if (modulesHaveVersionKey(currentModuleList, this.config.getVersionKey())) {
                const moduleType: ModuleTypes = currentModuleList[0].module_type;
                let correctDataLayout;
                switch (moduleType) {
                    case 'script': {
                        correctDataLayout = scriptingDataLayout;
                        break;
                    }
                    case 'commands': {
                        correctDataLayout = commandsDataLayout;
                        break;
                    }
                    case 'after_events_ordering': {
                        correctDataLayout = afterEventsOrderingDataLayout;
                        break;
                    }
                    case 'vanilla_data': {
                        correctDataLayout =
                            currentModuleList[0].name === 'mojang-block'
                                ? blockVanillaDataDataLayout
                                : vanillaDataDataLayout;
                        break;
                    }
                    default: {
                        continue;
                    }
                }

                const modulesJsonSorted = currentModuleList.sort(utils.semVerSortComparer(this.config.getVersionKey()));

                const changelogs = [
                    {
                        [this.config.getVersionKey()]: modulesJsonSorted[0][this.config.getVersionKey()],
                        $added: true,
                        ...utils.deepCopyJson(modulesJsonSorted[0]), // Hacky deep copy
                    },
                ];

                this.generateModuleChangeLog(
                    changelogs,
                    currentModuleList,
                    correctDataLayout,
                    '$added',
                    this.config.getVersionKey(),
                    utils.semVerSortComparer,
                    true
                );

                this.generateModuleChangeLog(
                    changelogs,
                    currentModuleList,
                    correctDataLayout,
                    '$removed',
                    this.config.getVersionKey(),
                    utils.reverseSemVerSortComparer,
                    false
                );

                const sortedChangelogs = changelogs.sort(utils.reverseSemVerSortComparer(this.config.getVersionKey()));

                for (const moduleJson of currentModuleList) {
                    const moduleWithChangelog = moduleJson as ModuleWithChangelog<
                        WithVersionKey<IMinecraftModule, ReturnType<typeof this.config.getVersionKey>>
                    >;
                    moduleWithChangelog.changelog = utils.deepCopyJson(sortedChangelogs);
                }
            }
        }
    }
}
