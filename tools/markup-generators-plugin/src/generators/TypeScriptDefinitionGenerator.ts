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
    MinecraftRelease,
    PRETTIER_CONFIGURATION,
    TypeScriptFilters,
} from '@minecraft/api-docs-generator';

export class TypeScriptDefinitionGenerator implements MarkupGenerator {
    async generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }

        const { tsdef: tsTemplateFiles } = context.getTemplates(...this.templates);

        for (const moduleJson of releases[0].script_modules) {
            const moduleName = moduleJson.name;
            const moduleVersion = moduleJson.version;

            const dtsTemplateFileData = tsTemplateFiles.readFileAsString('module.mustache');
            const dtsProcessedData = mustache.render(dtsTemplateFileData, moduleJson, {
                type: tsTemplateFiles.readFileAsString('type.mustache'),
                value: tsTemplateFiles.readFileAsString('value.mustache'),
                function: tsTemplateFiles.readFileAsString('function.mustache'),
                function_declaration: tsTemplateFiles.readFileAsString('function_declaration.mustache'),
                examples: tsTemplateFiles.readFileAsString('examples.mustache'),
                property: tsTemplateFiles.readFileAsString('property.mustache'),
                property_declaration: tsTemplateFiles.readFileAsString('property_declaration.mustache'),
                class: tsTemplateFiles.readFileAsString('class.mustache'),
                enum: tsTemplateFiles.readFileAsString('enum.mustache'),
                module_header: tsTemplateFiles.readFileAsString('module_header.mustache'),
                type_alias: tsTemplateFiles.readFileAsString('type_alias.mustache'),
                function_argument_declaration: tsTemplateFiles.readFileAsString(
                    'function_argument_declaration.mustache'
                ),
            });

            const typeScriptFilePath = path.join(outputDirectory, `${moduleName}@${moduleVersion}.d.ts`);
            const typeScriptFolder = path.dirname(typeScriptFilePath);
            fs.mkdirSync(typeScriptFolder, { recursive: true });

            Logger.info(`Writing TypeScript to disk: ${typeScriptFilePath}`);

            let prettifiedFileData = dtsProcessedData;
            try {
                prettifiedFileData = await prettier.format(dtsProcessedData, PRETTIER_CONFIGURATION);
            } catch (e) {
                if (e instanceof Error) {
                    Logger.error(`Prettier failed to run for module '${moduleName}': ${e.message}`);
                }
            }

            Logger.info(`Writing TypeScript to disk: ${typeScriptFilePath}`);
            fs.writeFileSync(typeScriptFilePath, prettifiedFileData);
        }

        return Promise.resolve();
    }

    readonly id: string = 'ts';
    readonly name: string = 'TypeScript Definitions';
    readonly outputDirectoryName: string = 'typescript';

    readonly templates: string[] = ['tsdef'];
    readonly filterGroups: FilterGroup[] = [CommonFilters, TypeScriptFilters];
}
