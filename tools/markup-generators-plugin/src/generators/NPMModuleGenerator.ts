// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Encoding, FileSystem } from '@rushstack/node-core-library';
import { execSync } from 'child_process';
import fs from 'fs';
import mustache from 'mustache';
import path from 'path';
import prettier from 'prettier';

import {
    CommonFilters,
    FileLoader,
    FilterGroup,
    GeneratorContext,
    Logger,
    MarkdownFilters,
    MarkupGenerator,
    MinecraftRelease,
    MinecraftScriptModule,
    MinecraftVanillaDataModule,
    PRETTIER_CONFIGURATION,
} from '@minecraft/api-docs-generator';

function generateDataModuleNPM(
    moduleJsons: MinecraftVanillaDataModule[],
    rootTypescriptOutputDir: string,
    npmTemplateFiles: FileLoader,
    generationOutputDirectory: string
): void {
    const minecraftVersion = moduleJsons[0].minecraft_version;
    const versionedRootTypescriptOutputDir = path.join(rootTypescriptOutputDir, minecraftVersion);

    const moduleOutputDirectory = path.join(generationOutputDirectory, '@minecraft/vanilla-data');

    const templatePackage = npmTemplateFiles.joinToRoot('vanilla-data');
    FileSystem.copyFiles({
        sourcePath: templatePackage,
        destinationPath: moduleOutputDirectory,
        filter: (sourcePath: string) => {
            if (sourcePath.endsWith('.mustache') || sourcePath.endsWith('template.npmignore')) {
                return false;
            }

            return true;
        },
    });

    FileSystem.copyFile({
        sourcePath: path.join(templatePackage, 'template.npmignore'),
        destinationPath: path.join(moduleOutputDirectory, '.npmignore'),
    });

    let targetedVersion: string | undefined;
    for (const module of moduleJsons) {
        if (module.minecraft_version) {
            targetedVersion = module.minecraft_version;
        } else {
            if (targetedVersion !== module.minecraft_version) {
                throw new Error('Mismatch versions for vanilla data? Inspect output for a given release.');
            }
        }
    }
    const packageJsonData: { version: string } = {
        version: targetedVersion,
    };
    const packageJsonMustache = npmTemplateFiles.readFileAsString('vanilla-data/data-package.json.mustache');
    const packageJsonOutput = path.join(moduleOutputDirectory, 'package.json');
    const packageJsonRenderedData = mustache.render(packageJsonMustache, packageJsonData);

    FileSystem.writeFile(packageJsonOutput, packageJsonRenderedData);

    const srcDirectory = path.join(moduleOutputDirectory, 'src');
    FileSystem.copyFiles({
        sourcePath: versionedRootTypescriptOutputDir,
        destinationPath: srcDirectory,
    });

    const files = FileSystem.readFolderItems(srcDirectory);
    const indexFileData: { modules: string[] } = { modules: [] };
    for (const file of files) {
        if (file.isFile) {
            if (file.name.endsWith('.ts')) {
                const fileName = file.name.substring(0, file.name.length - 3);
                indexFileData.modules.push(fileName);
            } else {
                Logger.warn(`Found file in vanilla data module that is not a TypeScript file: ${file.name}`);
                indexFileData.modules.push(file.name);
            }
        }
    }

    const indexMustache = npmTemplateFiles.readFileAsString('vanilla-data/index.ts.mustache');
    const indexMustachOutput = path.join(srcDirectory, 'index.ts');
    const indexFileRenderedData = mustache.render(indexMustache, indexFileData);

    FileSystem.writeFile(indexMustachOutput, indexFileRenderedData);

    try {
        const tsConfigPath = path.join(moduleOutputDirectory, 'tsconfig.json');
        execSync(`npx tsc -p ${tsConfigPath}`, {
            cwd: path.resolve(__dirname, '../../'),
        }).toString();

        FileSystem.deleteFile(tsConfigPath, { throwIfNotExists: true });

        const outputBundlePath = path.join(moduleOutputDirectory, './lib/index.js');
        execSync(
            `npx esbuild ${indexMustachOutput} --bundle --format=esm --minify-whitespace --outfile="${outputBundlePath}"`,
            {
                cwd: path.resolve(__dirname, '../../'),
            }
        );

        const loadedString = FileSystem.readFile(outputBundlePath, { encoding: Encoding.Utf8 });
        const bundleMustache = npmTemplateFiles.readFileAsString('vanilla-data/bundle.js.mustache');
        const renderedString = mustache.render(bundleMustache, {
            data: loadedString,
        });
        FileSystem.writeFile(outputBundlePath, renderedString, {
            encoding: Encoding.Utf8,
        });
    } catch (e) {
        if (e instanceof Error) {
            Logger.error(`Failed to compile vanilla data module: ${e.message} @ ${e.stack}`);
            throw e;
        }
    }
}

async function generateScriptModuleNPM(
    moduleJson: MinecraftScriptModule,
    rootTypescriptDefinitionOutputDir: string,
    npmTemplateFiles: FileLoader,
    generationOutputDirectory: string
): Promise<void> {
    const typeScriptModuleFile = path.join(
        rootTypescriptDefinitionOutputDir,
        `${moduleJson.name}@${moduleJson.version}.d.ts`
    );
    if (!fs.existsSync(typeScriptModuleFile)) {
        throw new Error(`Module TypeScript file (${typeScriptModuleFile}) does not exist, cannot generate NPM files`);
    }

    const typesOutputDirectory = path.join(generationOutputDirectory, 'types');
    fs.mkdirSync(typesOutputDirectory, { recursive: true });

    const moduleOutputDirectory = path.join(typesOutputDirectory, `${moduleJson.name}@${moduleJson.version}`);
    const typeScriptFilePath = path.join(moduleOutputDirectory, 'index.d.ts');
    const typeScriptFolder = path.dirname(typeScriptFilePath);
    fs.mkdirSync(typeScriptFolder, { recursive: true });

    const prettierConfig: prettier.Config = {
        ...PRETTIER_CONFIGURATION,
        trailingComma: 'all',
    };

    const dtsFileData = fs.readFileSync(typeScriptModuleFile, 'utf8');

    let prettifiedFileData = dtsFileData;
    try {
        prettifiedFileData = await prettier.format(dtsFileData, prettierConfig);
    } catch (e: unknown) {
        if (e instanceof Error) {
            Logger.error(`Prettier failed to run for module '${moduleJson.name}': ${e.message}`);
        }
    }

    Logger.info(`Writing NPM Type Modules to disk: ${typeScriptFilePath}`);
    fs.writeFileSync(typeScriptFilePath, prettifiedFileData);

    const packageJsonTemplateFileData = npmTemplateFiles.readFileAsString('package.json.mustache');
    const packageJsonProcessedData = mustache.render(packageJsonTemplateFileData, moduleJson);
    const packageJsonFilePath = path.join(moduleOutputDirectory, 'package.json');
    Logger.info(`Writing package.json to disk: ${packageJsonFilePath}`);
    fs.writeFileSync(packageJsonFilePath, packageJsonProcessedData);

    const readmeTemplateFileData = npmTemplateFiles.readFileAsString('README.md.mustache');
    const readmeProcessedData = mustache.render(readmeTemplateFileData, moduleJson);
    const readmeFilePath = path.join(moduleOutputDirectory, 'README.md');
    Logger.info(`Writing README.md to disk: ${readmeFilePath}`);
    fs.writeFileSync(readmeFilePath, readmeProcessedData);
}

export class NPMModuleGenerator implements MarkupGenerator {
    async generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }

        const { npm: npmTemplateFiles } = context.getTemplates(...this.templates);

        const rootTSDefsOutputDir = path.resolve(
            context.rootOutputDirectory,
            context.getGenerator('ts').outputDirectoryName
        );
        const shouldRunScriptModuleGeneration = releases[0].script_modules.length > 0;
        if (!fs.existsSync(rootTSDefsOutputDir) && shouldRunScriptModuleGeneration) {
            throw new Error(
                `Root TypeScript Definition directory (${rootTSDefsOutputDir}) does not exist, cannot generate NPM files`
            );
        }

        const rootTSOutputDir = path.resolve(
            context.rootOutputDirectory,
            context.getGenerator('ts-source').outputDirectoryName
        );
        const shouldRunDataGeneration = releases[0].vanilla_data_modules.length > 0;
        if (!fs.existsSync(rootTSOutputDir) && shouldRunDataGeneration) {
            throw new Error(`Root TypeScript directory (${rootTSOutputDir}) does not exist, cannot generate NPM files`);
        }

        fs.mkdirSync(outputDirectory, { recursive: true });

        if (shouldRunScriptModuleGeneration) {
            for (const moduleJson of releases[0].script_modules) {
                await generateScriptModuleNPM(moduleJson, rootTSDefsOutputDir, npmTemplateFiles, outputDirectory);
            }
        }

        if (shouldRunDataGeneration) {
            generateDataModuleNPM(releases[0].vanilla_data_modules, rootTSOutputDir, npmTemplateFiles, outputDirectory);
        }

        return Promise.resolve();
    }

    readonly id: string = 'npm';
    readonly name: string = 'NPM Type Modules';
    readonly outputDirectoryName: string = 'npm';

    readonly dependencies: string[] = ['ts', 'ts-source'];
    readonly templates: string[] = ['npm'];
    readonly filterGroups: FilterGroup[] = [CommonFilters, MarkdownFilters];
}
