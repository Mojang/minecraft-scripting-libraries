// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { expect } from 'vitest';

export type RunGeneratorForTestOptions = {
    testDir: string;
    configPath?: string;
    inDir?: string;
    outDir?: string;
    docsDir?: string;
    generators?: string[];
    minecraftVersion?: string;
    additionalArgs?: string;
    excludedFiles?: string[];
    skipMerging?: boolean;
};

function getAllFiles(dirPath: string): string[] {
    const files = fs.readdirSync(dirPath);
    const arrayOfFiles: string[] = [];

    files.forEach(file => {
        if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
            arrayOfFiles.push(...getAllFiles(dirPath + '/' + file));
        } else {
            arrayOfFiles.push(path.join(dirPath, file));
        }
    });

    return arrayOfFiles;
}

export function runGeneratorForTest(options: RunGeneratorForTestOptions): void {
    const { additionalArgs, configPath, generators, minecraftVersion, testDir } = options;
    let { inDir, outDir, docsDir } = options;

    inDir = inDir ?? path.join(testDir, 'input');
    outDir = outDir ?? path.join(testDir, 'actual_output');
    docsDir = docsDir ?? path.join(testDir, 'docs');

    const generatorCmd = [
        'node',
        path.resolve(__dirname, '../../../tools/api-docs-generator/lib/cli.js'),
        ...(configPath ? ['--config', configPath] : ['--no-config']),
        ...['--input-directory', inDir],
        ...['--output-directory', outDir],
        ...(fs.existsSync(docsDir) ? ['--docs-directory', docsDir] : []),
        ...(generators && generators.length > 0 ? ['--run-generators', ...generators] : []),
        ...(minecraftVersion ? ['--minecraft-version', `${minecraftVersion}`] : []),
        '--log.level debug --log.allMessages',
        ...(options.skipMerging ? ['--skip-merging'] : ['']),
        additionalArgs,
    ].join(' ');

    const testOutputPath = path.join(testDir, `${path.basename(outDir)}.run.log`);

    let testOutput: string | undefined;
    try {
        testOutput = execSync(generatorCmd, {
            encoding: 'utf-8',
        });
    } catch (e) {
        console.error(`Errors detected in test '${path.basename(testDir)}', see log for details: ${testOutputPath}`);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        testOutput = `${e.stdout ? `${e.stdout.toString()}\n` : ''}${e.stderr ? `ERROR:\n${e.stderr.toString()}` : ''}`;

        throw e;
    } finally {
        if (testOutput) {
            fs.writeFileSync(testOutputPath, testOutput);
        }
    }

    // At this point, the `outDir` should be populated, so let's create some snapshots
    expect(fs.existsSync(outDir)).toBeTruthy();

    // We always write one snapshot for the number of files written to disk, as this will protect against files
    // not being generated (like generation failures)
    const outputFiles = getAllFiles(outDir).sort();
    expect(outputFiles.length).toMatchSnapshot('# Of Files Generated');

    const excludedFiles = options?.excludedFiles ?? [];
    for (const file of outputFiles) {
        if (excludedFiles.some(exclusion => file.includes(exclusion))) {
            console.log(`Excluding ${file} from snapshot`);
            continue;
        }
        const contents = fs.readFileSync(file).toString('utf-8');
        const relativeOutputPath = path.relative(outDir, file);
        const fileSegments = relativeOutputPath.split(path.sep);
        expect(contents).toMatchSnapshot(fileSegments.join('/'));
    }
}
