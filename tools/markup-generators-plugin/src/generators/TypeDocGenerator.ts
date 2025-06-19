// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';

import { GeneratorContext, Logger, MarkupGenerator, MinecraftRelease, Utils } from '@minecraft/api-docs-generator';

export class TypeDocGenerator implements MarkupGenerator {
    async generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }

        const typeDoc = await import('typedoc');

        const tempTypedocDir = fs.mkdtempSync('tsconfig');
        const rootTSOutputDir = path.resolve(
            context.rootOutputDirectory,
            context.getGenerator('ts').outputDirectoryName
        );
        if (!fs.existsSync(rootTSOutputDir)) {
            Logger.warn('No TypeScript definitions output, skipping TypeDoc generation.');
            return;
        }

        const tsconfig = {
            compilerOptions: {
                target: 'es2016',
                lib: ['dom', 'dom.iterable', 'esnext'],
                allowJs: true,
                skipLibCheck: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: true,
                forceConsistentCasingInFileNames: true,
                noFallthroughCasesInSwitch: true,
                module: 'system',
                outFile: 'minecraft',
                moduleResolution: 'node',
                skipDefaultLibCheck: true,
                jsx: 'react-jsx',
                baseUrl: '../',
            },
            typedocOptions: {
                entryPoints: [] as string[],
                out: '',
                excludePrivate: true,
                excludeProtected: true,
            },
            include: [] as string[],
        };

        fs.mkdirSync(outputDirectory, { recursive: true });

        Logger.info(`Outputting TypeDoc to path: ${outputDirectory} (tempdir: ${tempTypedocDir})`);

        try {
            const typedocReaders = [new typeDoc.TSConfigReader(), new typeDoc.TypeDocReader()];

            const inputDocFilesRaw = Utils.getFilesRecursively(rootTSOutputDir);
            const inputDocFiles = [];
            for (const docFile of inputDocFilesRaw) {
                inputDocFiles.push(path.resolve(docFile));
            }
            Logger.info(`Input TypeDoc files:\n\t${inputDocFiles.join('\n\t')}`);

            tsconfig.typedocOptions.entryPoints = inputDocFiles;
            tsconfig.typedocOptions.out = outputDirectory;
            tsconfig.include = inputDocFiles;

            const tsconfigPath = path.join(tempTypedocDir, 'tsconfig.json');

            Logger.debug(
                `Writing tsconfig to '${tsconfigPath}' with value:\n${JSON.stringify(tsconfig, undefined, 2)}`
            );
            fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, undefined, 2));

            const app = await typeDoc.Application.bootstrap(
                {
                    entryPoints: inputDocFiles,
                    disableSources: true,
                    tsconfig: tsconfigPath,
                    readme: 'none',
                    hideGenerator: true,
                    name: 'Minecraft',
                    validation: {
                        invalidLink: true,
                    },
                },
                typedocReaders
            );

            const project = await app.convert();
            if (!project) {
                throw new Error('Failed to convert TypeDoc project.');
            }

            await app.generateDocs(project, outputDirectory);
        } catch (e) {
            if (e instanceof Error) {
                Logger.error(`Failed to generate TypeDoc: ${e.message} @ ${e.stack}`);
            }
        } finally {
            fs.rmSync(tempTypedocDir, { recursive: true });
        }

        return Promise.resolve();
    }

    readonly id: string = 'typedoc';
    readonly name: string = 'TypeDoc';
    readonly outputDirectoryName: string = 'typedoc';

    readonly dependencies: string[] = ['ts'];
}
