// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import mustache from 'mustache';
import path from 'path';
import prettier from 'prettier';

import {
    CommonFilters,
    FilterGroup,
    GeneratorContext,
    Logger,
    MarkupGenerator,
    MinecraftBlockModule,
    MinecraftRelease,
    MinecraftVanillaDataModule,
    PRETTIER_CONFIGURATION,
    TypeScriptFilters,
} from '@minecraft/api-docs-generator';

function processDataItemsForTemplating(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const vanillaModule of release.vanilla_data_modules) {
            let hasProperties = false;
            for (const dataItem of vanillaModule.data_items) {
                const nameString = dataItem.name;
                const namespaceEndIndex = nameString.indexOf(':');
                if (namespaceEndIndex !== -1) {
                    dataItem.namespace = nameString.slice(0, namespaceEndIndex);
                }

                dataItem.no_namespace_name = nameString.slice(namespaceEndIndex + 1);
                dataItem.standardized_name = dataItem.no_namespace_name
                    .split('_')
                    .map(segment => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
                    .join('');

                if (!dataItem.value || dataItem.value.trim().length === 0) {
                    dataItem.value = dataItem.name;
                }

                if (dataItem.properties && dataItem.properties.length) {
                    dataItem.state_union = dataItem.properties.map(property => `"${property.name}"`).join(' | ');
                    hasProperties = true;
                }
            }

            vanillaModule.has_properties = hasProperties;
        }
    }
}

function enumNameMapping(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const vanillaModule of release.vanilla_data_modules) {
            const dataName = vanillaModule.vanilla_data_type;

            vanillaModule.display_type = `${dataName.charAt(0).toUpperCase()}${dataName.slice(1)}`;
            vanillaModule.display_name = `Minecraft${vanillaModule.display_type}Types`;
        }
    }
}

function mapNativeTypeToTS(type: string): 'string' | 'number' | 'boolean' {
    switch (type) {
        case 'int':
            return 'number';
        case 'float':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'string':
            return 'string';
    }

    throw new Error(`Unknown native type: ${type}. Update type mapping and ensure new type generation is correct.`);
}

function isBlockModuleData(data: MinecraftVanillaDataModule): data is MinecraftBlockModule {
    return data.vanilla_data_type === 'block';
}

function processDataPropertiesForTemplating(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const vanillaModule of release.vanilla_data_modules) {
            if (isBlockModuleData(vanillaModule)) {
                const propertyNames = [];
                vanillaModule.block_properties.forEach(property => {
                    property.property_type = mapNativeTypeToTS(property.type);
                    propertyNames.push(property.property_name);
                });

                vanillaModule.data_properties = vanillaModule.block_properties;
            }
        }
    }
}

export const TypeScriptSourceFilters: FilterGroup = {
    id: 'ts-source',
    filtersBeforeCommon: [
        ['process_data_items_for_templating', processDataItemsForTemplating],
        ['enum_name_mapping', enumNameMapping],
        ['process_data_properties_for_templating', processDataPropertiesForTemplating],
    ],
};

export class TypeScriptGenerator implements MarkupGenerator {
    async generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }

        const { ts: tsSourceTemplateFiles } = context.getTemplates(...this.templates);

        for (const moduleJson of releases[0].vanilla_data_modules) {
            const dataName = moduleJson.name;
            const minecraftVersion = moduleJson.minecraft_version;

            const tsTemplateFileData = tsSourceTemplateFiles.readFileAsString('module.mustache');
            const tsProcessedData = mustache.render(tsTemplateFileData, moduleJson, {
                module_header: tsSourceTemplateFiles.readFileAsString('module_header.mustache'),
                data_items_enum: tsSourceTemplateFiles.readFileAsString('data_items_enum.mustache'),
                state_mapping: tsSourceTemplateFiles.readFileAsString('state_mapping.mustache'),
            });

            const typeScriptFilePath = path.join(outputDirectory, minecraftVersion, `${dataName}.ts`);
            const typeScriptFolder = path.dirname(typeScriptFilePath);
            fs.mkdirSync(typeScriptFolder, { recursive: true });

            let prettifiedFileData = tsProcessedData;
            try {
                prettifiedFileData = await prettier.format(tsProcessedData, PRETTIER_CONFIGURATION);
            } catch (e) {
                if (e instanceof Error) {
                    Logger.error(`Prettier failed to run for module '${dataName}': ${e.message}`);
                }
            }

            Logger.info(`Writing TypeScript to disk: ${typeScriptFilePath}`);
            fs.writeFileSync(typeScriptFilePath, prettifiedFileData);
        }

        return Promise.resolve();
    }

    readonly id: string = 'ts-source';
    readonly name: string = 'TypeScript Source';
    readonly outputDirectoryName: string = 'ts-source';

    readonly templates: string[] = ['ts'];
    readonly filterGroups: FilterGroup[] = [CommonFilters, TypeScriptSourceFilters, TypeScriptFilters];
}
