// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FileSystem } from '@rushstack/node-core-library';
import path from 'path';
import { CopyTaskParameters } from '.';
import { Zip } from 'zip-lib';
import { TaskFunction, parallel, series, task } from 'just-scripts';

export type ZipTaskParameters = CopyTaskParameters & {
    /**
     * The path to the output file to write the zip file to.
     */
    outputFile: string;
};

export type ZipContent = {
    /**
     * The contents to add to the zip.
     */
    contents: string[];
    /**
     * The relative path to the root. In case of provided contents are added into this folder inside the zip.
     */
    targetPath?: string;
};

function addContentsToZip(zipContents: ZipContent[], zip: Zip) {
    for (const content of zipContents) {
        for (const originPath of content.contents) {
            const inputPath = path.resolve(originPath);
            const pathStats = FileSystem.getLinkStatistics(inputPath);

            if (pathStats.isDirectory()) {
                console.log(`Adding folder ${inputPath} to package`);
                zip.addFolder(inputPath, content.targetPath);
            } else {
                const metadataPath = content.targetPath
                    ? path.join(content.targetPath, path.parse(inputPath).base)
                    : undefined;
                console.log(`Adding file ${inputPath} to package`);
                zip.addFile(inputPath, metadataPath);
            }
        }
    }
}

/**
 * A just task which compresses files into a specified output file.
 */
export function zipTask(outputFile: string, zipContents: ZipContent[]): ReturnType<typeof parallel> {
    return async function zip() {
        if (zipContents.length === 0 || !zipContents.some(content => content.contents.length > 0)) {
            process.exitCode = 0;
            return Promise.resolve();
        }

        const zip = new Zip();

        addContentsToZip(zipContents, zip);

        let isSucceeded = true;
        let errorMessage = '';
        await zip.archive(outputFile).then(
            function () {
                console.error(`Compressed file created at ${outputFile}`);
            },
            function (err) {
                isSucceeded = false;
                errorMessage = `Compressed file failed to be created at ${outputFile}: ${err}`;
                console.error(errorMessage);
            }
        );

        if (isSucceeded) {
            process.exitCode = 0;
            return Promise.resolve();
        }

        process.exitCode = 1;
        return Promise.reject(new Error(errorMessage));
    };
}

/**
 * A just task which creates the mcaddon file.
 */
export function mcaddonTask(params: ZipTaskParameters): TaskFunction {
    const targetFolder = path.parse(params.outputFile).dir;
    const outputFileName = path.parse(params.outputFile).name;
    const behaviorPackFile = path.join(targetFolder, `${outputFileName}_bp.mcpack`);
    const resourcePackFile = path.join(targetFolder, `${outputFileName}_rp.mcpack`);
    const mcaddonContents: ZipContent = { contents: [behaviorPackFile] };
    if (params.copyToResourcePacks && params.copyToResourcePacks.length > 0) {
        mcaddonContents.contents.push(resourcePackFile);
    }

    task(
        'packBP',
        zipTask(behaviorPackFile, [
            { contents: params.copyToBehaviorPacks },
            { contents: params.copyToScripts, targetPath: 'scripts' },
        ])
    );
    task('packRP', zipTask(resourcePackFile, [{ contents: params.copyToResourcePacks ?? [] }]));
    task('packMcaddon', zipTask(params.outputFile, [mcaddonContents]));
    return series(parallel('packBP', 'packRP'), 'packMcaddon');
}
