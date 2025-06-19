// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import mustache from 'mustache';
import path from 'path';

import {
    DisabledChangelogStrategy,
    GeneratorContext,
    CommonFilters,
    FilterGroup,
    Logger,
    MinecraftRelease,
    MarkupGenerator,
} from '@minecraft/api-docs-generator';

export class ChangelogMDGenerator implements MarkupGenerator {
    generateFiles(context: GeneratorContext, releases: MinecraftRelease[], outputDirectory: string): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }
        if (context.changelogStrategy instanceof DisabledChangelogStrategy) {
            Logger.warn(`Generator '${this.name}' requires a changelog strategy!`);
            return;
        }

        const { txt: txtTemplateFiles, tsdef: tsTemplateFiles } = context.getTemplates(...this.templates);

        for (const moduleJson of releases[0].getLatestScriptModules()) {
            const moduleName = moduleJson.name;

            const txtTemplateFileData = txtTemplateFiles.readFileAsString('md_changelog.mustache');
            const txtProcessedData = mustache.render(txtTemplateFileData, moduleJson, {
                // TypeScript Partials
                type: tsTemplateFiles.readFileAsString('type.mustache'),
                value: tsTemplateFiles.readFileAsString('value.mustache'),
                function_declaration: tsTemplateFiles.readFileAsString('function_declaration.mustache'),
                function: tsTemplateFiles.readFileAsString('function.mustache'),
                property_declaration: tsTemplateFiles.readFileAsString('property_declaration.mustache'),
                property: tsTemplateFiles.readFileAsString('property.mustache'),
                enum: tsTemplateFiles.readFileAsString('enum.mustache'),
                class: tsTemplateFiles.readFileAsString('class.mustache'),
                type_alias: tsTemplateFiles.readFileAsString('type_alias.mustache'),
                module: tsTemplateFiles.readFileAsString('module.mustache'),
                function_argument_declaration: tsTemplateFiles.readFileAsString(
                    'function_argument_declaration.mustache'
                ),
            });
            const txtModuleFilePath = path.join(outputDirectory, `${moduleName}.txt`);
            fs.mkdirSync(path.dirname(txtModuleFilePath), { recursive: true });
            fs.writeFileSync(txtModuleFilePath, txtProcessedData);
        }

        return Promise.resolve();
    }

    readonly id: string = 'changelog';
    readonly name: string = 'Changelog';
    readonly outputDirectoryName: string = 'txt';

    readonly templates: string[] = ['txt', 'tsdef'];
    readonly filterGroups: FilterGroup[] = [CommonFilters];
}
