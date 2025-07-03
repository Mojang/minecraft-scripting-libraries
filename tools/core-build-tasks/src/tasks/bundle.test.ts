// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';
import { BundleTaskParameters, postProcessOutputFiles } from './bundle';
import { BuildOptions, BuildResult } from 'esbuild';
import path from 'path';

function _createParameters(
    sourcemap: boolean | 'linked' | 'inline' | 'external' | 'both' | undefined,
    outputFile: string,
    outputSourcemapPath: string | undefined
): {
    options: BundleTaskParameters;
    buildResult: BuildResult<BuildOptions>;
} {
    return {
        options: {
            entryPoint: '',
            outfile: outputFile,
            sourcemap: sourcemap,
            outputSourcemapPath: outputSourcemapPath,
        },
        buildResult: {
            outputFiles: [
                { path: outputFile, contents: new Uint8Array(), hash: '', text: '' },
                {
                    path: 'main.js.map',
                    contents: new Uint8Array(),
                    hash: '',
                    text: '{"version":3,"sources":["../../scripts/main.ts"],"sourcesContent":[""],"mappings":";AAAA,SAAS,OAAO;","names":[]}',
                },
            ],
            errors: [],
            warnings: [],
            metafile: { inputs: {}, outputs: {} },
            mangleCache: {},
        },
    };
}

describe('postProcessOutputFiles with source map files at different path', () => {
    it('sourcemap `true` - Dictionary populated correctly', () => {
        const sourcemap = true;
        const debugPath = path.resolve('./dist/debug');
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/debug');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=../debug/main.js.map\n';
        const expectedSourceMapFile = '../scripts/main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `linked` - Dictionary populated correctly', () => {
        const sourcemap = 'linked';
        const debugPath = path.resolve('./dist/debug');
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/debug');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=../debug/main.js.map\n';
        const expectedSourceMapFile = '../scripts/main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `external` - Dictionary populated correctly', () => {
        const sourcemap = 'external';
        const debugPath = path.resolve('./dist/debug');
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/debug');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = '../scripts/main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `both` - Dictionary populated correctly', () => {
        const sourcemap = 'both';
        const debugPath = path.resolve('./dist/debug');
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/debug');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = '../scripts/main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `inline` - Dictionary populated correctly', () => {
        const sourcemap = 'inline';
        const debugPath = path.resolve('./dist/debug');
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/debug');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/debug/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = '../scripts/main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
});

describe('postProcessOutputFiles with source map files at same path', () => {
    it('sourcemap `true` - Dictionary populated correctly using undefined', () => {
        const sourcemap = true;
        const debugPath = undefined;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/scripts');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=main.js.map\n';
        const expectedSourceMapFile = 'main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `true` - Dictionary populated correctly using same path explicitly', () => {
        const sourcemap = true;
        const debugPath = path.resolve('./dist/scripts');
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/scripts');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=main.js.map\n';
        const expectedSourceMapFile = 'main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `linked` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'linked';
        const debugPath = undefined;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/scripts');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '\n//# sourceMappingURL=main.js.map\n';
        const expectedSourceMapFile = 'main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `external` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'external';
        const debugPath = undefined;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/scripts');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = 'main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `both` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'both';
        const debugPath = undefined;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/scripts');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = 'main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
    it('sourcemap `inline` - Dictionary populated correctly using undefined', () => {
        const sourcemap = 'inline';
        const debugPath = undefined;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, debugPath);
        const expectedSourceMapDirectory = path.resolve('./dist/scripts');
        const expectedOutputDirectory = path.resolve('./dist/scripts');
        const expectedOutputFilePath = outputFile;
        const expectedSourceMapFilePath = path.resolve('./dist/scripts/main.js.map');
        const expectedSourceMappingURL = '';
        const expectedSourceMapFile = 'main.js';

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeDefined();
        if (result) {
            expect(result.outputDirectory).toBe(expectedOutputDirectory);
            expect(result.sourceMapDirectory).toBe(expectedSourceMapDirectory);
            expect(Object.keys(result.generatedFiles).length).toBe(2);
            expect(result.generatedFiles[expectedOutputFilePath]).toBeDefined();
            expect(result.generatedFiles[expectedOutputFilePath]).toBe(expectedSourceMappingURL);
            expect(result.generatedFiles[expectedSourceMapFilePath]).toBeDefined();
            const sourceMap = JSON.parse(result.generatedFiles[expectedSourceMapFilePath]) as { file: string };
            expect(sourceMap).toBeDefined();
            expect(sourceMap.file).toBeDefined();
            expect(sourceMap.file).toBe(expectedSourceMapFile);
        }
    });
});

describe('postProcessOutputFiles with no files', () => {
    it('sourcemap `true` - Returns undefined', () => {
        const sourcemap = true;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, undefined);
        parameters.buildResult.outputFiles = undefined;

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeUndefined();
    });
    it('sourcemap `false` - Returns undefined', () => {
        const sourcemap = false;
        const outputFile = path.resolve('./dist/scripts/main.js');
        const parameters = _createParameters(sourcemap, outputFile, undefined);
        parameters.buildResult.outputFiles = undefined;

        const result = postProcessOutputFiles(parameters.options, parameters.buildResult);

        expect(result).toBeUndefined();
    });
});
