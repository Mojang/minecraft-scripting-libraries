// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parallel } from 'just-scripts';
import esbuild, { BuildResult, OutputFile } from 'esbuild';
import fs from 'fs';
import path from 'path';

const MAP_EXTENSION = '.map';

export type BundleTaskParameters = {
    /** Initial script to be evaluated for the build. Documentation: https://esbuild.github.io/api/#entry-points */
    entryPoint: string;

    /** Packages to be considered as external. Documentation: https://esbuild.github.io/api/#external */
    external?: string[];

    /** When enabled, the generated code will be minified instead of pretty-printed. Documentation: https://esbuild.github.io/api/#minify */
    minifyWhitespace?: boolean;

    /** The output file for the bundle. Documentation: https://esbuild.github.io/api/#outfile */
    outfile: string;

    /** Flag to specify to generate a source map file.*/
    sourcemap?: boolean;

    /** The output path for the source map file. Only when sourcemap option is set to true. */
    outputSourcemapPath?: string;
};

function linkSourceMaps(
    sourceMapDirectory: string,
    outputDirectory: string,
    outputFiles: OutputFile[]
): Map<string, string> {
    const generatedFiles = new Map<string, string>();
    outputFiles.forEach(element => {
        if (element.path.endsWith(MAP_EXTENSION)) {
            const parsedPath = path.parse(element.path);
            const sourceMapFilePath = path.join(sourceMapDirectory, parsedPath.base);
            const sourceMapContent = JSON.parse(element.text);

            // Add JS file location.
            sourceMapContent.file = path
                .relative(sourceMapDirectory, path.join(outputDirectory, parsedPath.name))
                .replace(/\\/g, '/');
            generatedFiles.set(sourceMapFilePath, JSON.stringify(sourceMapContent));
        } else {
            // Link to the source map file.
            const dir = path.parse(element.path).dir;
            const targetSourceMap = path
                .join(path.relative(dir, sourceMapDirectory), path.parse(element.path).base)
                .replace(/\\/g, '/');
            generatedFiles.set(
                element.path,
                element.text + `\n//# sourceMappingURL=${targetSourceMap}${MAP_EXTENSION}\n`
            );
        }
    });

    return generatedFiles;
}

function writeFiles(sourceMapDirectory: string, outputDirectory: string, generatedFiles: Map<string, string>) {
    fs.mkdirSync(outputDirectory, { recursive: true });
    if (sourceMapDirectory !== outputDirectory) {
        fs.mkdirSync(sourceMapDirectory, { recursive: true });
    }

    for (const [path, content] of generatedFiles.entries()) {
        fs.writeFileSync(path, content);
    }
}

export function bundleTask(options: BundleTaskParameters): ReturnType<typeof parallel> {
    return () => {
        const buildResult: BuildResult = esbuild.buildSync({
            entryPoints: [options.entryPoint],
            bundle: true,
            format: 'esm',
            minifyWhitespace: options.minifyWhitespace,
            outfile: options.outfile,
            sourcemap: options.sourcemap ? 'external' : false,
            external: options.external,
            write: !options.sourcemap,
        });

        if (buildResult.errors.length == 0) {
            if (options.sourcemap) {
                if (!buildResult.outputFiles) {
                    process.exitCode = 1;
                    return Promise.reject(new Error('Output files are not generated'));
                }

                const outputDirectory = path.parse(options.outfile).dir;
                const sourceMapDirectory = path.resolve(options.outputSourcemapPath ?? outputDirectory);
                const generatedFiles = linkSourceMaps(sourceMapDirectory, outputDirectory, buildResult.outputFiles);
                writeFiles(sourceMapDirectory, outputDirectory, generatedFiles);
            }

            process.exitCode = 0;
            return Promise.resolve();
        }

        process.exitCode = 1;
        return Promise.reject(new Error(buildResult.errors.join('\n')));
    };
}
