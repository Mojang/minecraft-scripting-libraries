// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as fs from 'fs';
import * as path from 'path';
import * as mustache from 'mustache';

import {
    GeneratorContext,
    MarkupGenerator,
    MarkupGeneratorOptions,
    MinecraftRelease,
    Logger,
    Plugin,
} from '@minecraft/api-docs-generator';

interface TestGeneratorOneOptions extends MarkupGeneratorOptions {
    message: string;
}

class TestGeneratorOne implements MarkupGenerator<TestGeneratorOneOptions> {
    generateFiles(
        context: GeneratorContext,
        _releases: MinecraftRelease[],
        outputDirectory: string,
        options: TestGeneratorOneOptions
    ): Promise<void> {
        if (!context.hasTemplates(...this.templates)) {
            Logger.warn(`Missing templates required by '${this.name}': [${this.templates.join(', ')}]`);
            return;
        }

        const { 'test-templates': templates } = context.getTemplates(...this.templates);
        const testTemplateFileData = templates.readFile('test.mustache').toString('utf-8');
        const testProcessedData = mustache.render(testTemplateFileData, {
            message: options.message,
        });

        const outputFile = path.resolve(outputDirectory, `${this.id}.txt`);
        Logger.info(`Writing: ${outputFile}`);
        fs.mkdirSync(outputDirectory, { recursive: true });
        fs.writeFileSync(outputFile, testProcessedData);

        return Promise.resolve();
    }

    readonly id: string = 'test-1';
    readonly name: string = 'Dynamic Import Test Generator One';
    readonly outputDirectoryName: string = 'test-1';

    readonly templates: string[] = ['test-templates'];

    readonly defaultOptions: TestGeneratorOneOptions = {
        message: 'Default message will be overridden',
    };
}

class TestGeneratorTwo implements MarkupGenerator {
    generateFiles(context: GeneratorContext, _releases: MinecraftRelease[], outputDirectory: string): Promise<void> {
        const message = "This won't be written because generator won't run due to config";

        const outputFile = path.resolve(outputDirectory, `${this.id}.txt`);
        Logger.info(`Writing: ${outputFile}`);
        fs.mkdirSync(outputDirectory, { recursive: true });
        fs.writeFileSync(outputFile, message);

        return Promise.resolve();
    }

    readonly id: string = 'test-2';
    readonly name: string = 'Dynamic Import Test Generator Two';
    readonly outputDirectoryName: string = 'test-2';
}

export const TestGeneratorsPlugin: Plugin = {
    generators: [new TestGeneratorOne(), new TestGeneratorTwo()],
    templates: { 'test-templates': path.resolve(__dirname, '..', 'templates') },
};
