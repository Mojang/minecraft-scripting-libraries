// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This file uses the ESM syntax as @octokit/core does not support CommonJS. This appeases the TS build, and compatibility with commonjs is handled by esbuild.
import { Octokit } from '@octokit/rest';
import archiver from 'archiver';
import { TaskFunction } from 'just-scripts';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Describes an artifact published with a release.
 */
export type PublishReleaseArtifact = {
    /**
     * Paths to files/directories to include in this artifact.
     */
    files?: string[];
    /**
     * Source file formats to process, determines whether files need to be compressed or uploaded as-is.
     * Defaults to `files`.
     *
     * `files`: All files and directories for this artifact are compressed and uploaded as a single archive.
     * `npm-tarball`: Upload the generated NPM tarball. Specify its directory in `files`.
     */
    sourceFormat?: 'files' | 'npm-tarball';
};

/**
 * Configuration for publishing the release.
 */
export type PublishReleaseTaskConfig = {
    /**
     * Repo Owner/Organization.
     */
    repoOwner: string;
    /**
     * Name of the repository.
     */
    repoName: string;
    /**
     * A custom message to include in the release. If not specified, uses the package description.
     */
    message?: string;
    /**
     * Artifact to include in the release. If not specified, will archive the `dist` folder.
     */
    artifact?: PublishReleaseArtifact;
    /**
     * GitHub token used for creating the release. If not specified, will attempt to use `REPO_PAT` environment variable.
     */
    token?: string;
};

export function publishReleaseTask(config: PublishReleaseTaskConfig): TaskFunction {
    return async () => {
        // Get token from environment variable, or passed in as an argument
        const token = config.token ?? process.env.REPO_PAT;
        if (!token) {
            throw new Error(
                'No repo token is available, pass it in via configuration or set the REPO_PAT environment variable. Unable to create release.'
            );
        }

        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8')) as {
            name: string;
            version: string;
            description: string;
        };

        const publishedVersion = packageJson['version'];
        const name = packageJson['name'];
        const message = config.message ?? packageJson['description'];

        const artifact = config.artifact ?? { files: ['dist'], sourceFormat: 'files' };

        // To get the body of the release, read in the CHANGELOG.json file, read the "entries" array, get the first entry, go to the comments object,
        // then collect the "body" field of each comment. Join all of these together with a newline character. There is a comments key for each type
        // of release "major", "minor", "patch", "none"
        const changelog = JSON.parse(fs.readFileSync('./CHANGELOG.json', 'utf-8'));
        const firstEntry = changelog['entries'][0];
        if (!firstEntry) {
            throw new Error(
                'No entries found in the CHANGELOG.json file. Did beachball have an error? Unable to create release notes.'
            );
        }

        const comments: { [version: string]: { author: string; commit: string; comment: string }[] } =
            firstEntry['comments'];
        let body: string = `${message}\n\n# Changes\n\n`;
        for (const [key, value] of Object.entries(comments)) {
            // Key is the version type, value is an array of entries
            body += `## ${key[0].toUpperCase()}${key.slice(1)}\n\n${value
                .map(entry => `- ${entry.author} (${entry.commit}):\n${entry.comment}`)
                .join('\n')}\n\n`;
        }

        // Create GitHub release
        const octokit = new Octokit({ auth: token });
        const tagName = `${name}_v${publishedVersion}`;
        const response = await octokit.rest.repos.createRelease({
            owner: config.repoOwner,
            repo: config.repoName,
            tag_name: tagName,
            name: `${name} ${publishedVersion}`,
            body,
            draft: false,
            prerelease: false,
            generate_release_notes: false,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });

        if (response.status !== 201) {
            throw new Error(`Failed to create release. Status: ${response.status}`);
        }
        const releaseId = response.data.id;

        const uploadArtifact = async (archivePath: string) => {
            const data = fs.readFileSync(archivePath) as unknown as string;
            const response = await octokit.rest.repos.uploadReleaseAsset({
                mediaType: {
                    format: 'application/zip',
                },
                owner: config.repoOwner,
                repo: config.repoName,
                release_id: releaseId,
                data,
                name: path.basename(archivePath),
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            });

            if (response.status !== 201) {
                throw new Error(`Failed to create release. Status: ${response.status}`);
            }
        };

        switch (artifact.sourceFormat) {
            default:
            case 'files': {
                if (!artifact.files || artifact.files.length === 0) {
                    throw new Error(`Artifact has no files specified, cannot create release.`);
                }

                const releaseArchiveName = `${tagName}.zip`.replaceAll('/', '_').replaceAll('@', '');

                // Outputs to the cwd but deletes the file after publish
                const outputPath = path.resolve(`${releaseArchiveName}`);
                const output = fs.createWriteStream(outputPath);
                try {
                    const archive = archiver('zip', { zlib: { level: 9 } });
                    archive.on('error', err => {
                        throw new Error(`Failed to create archive for release: ${err}`);
                    });

                    archive.pipe(output);
                    for (const filePath of artifact.files) {
                        const resolvedFilePath = path.resolve(filePath);
                        if (
                            !fs.existsSync(resolvedFilePath) ||
                            (fs.lstatSync(resolvedFilePath).isDirectory() &&
                                fs.readdirSync(resolvedFilePath).length === 0)
                        ) {
                            throw new Error(
                                `Path '${resolvedFilePath}' does not exist or is an empty directory, unable to create release artifact.`
                            );
                        }

                        // If there are multiple directories, archive them as directories within the zip,
                        // otherwise archive all files to the root of the zip
                        if (fs.lstatSync(resolvedFilePath).isDirectory()) {
                            archive.directory(
                                resolvedFilePath,
                                artifact.files.length > 1 ? path.basename(resolvedFilePath) : false
                            );
                        } else {
                            archive.file(resolvedFilePath, { name: path.basename(resolvedFilePath) });
                        }
                    }

                    await archive.finalize();
                    output.close();

                    console.log(`Uploading zip archive artifact to release: ${path.basename(outputPath)}`);
                    uploadArtifact(outputPath);
                } finally {
                    // Clean up file always
                    fs.unlinkSync(outputPath);
                }
                break;
            }
            case 'npm-tarball': {
                if (!artifact.files || artifact.files.length !== 1) {
                    throw new Error(`Must specify the directory of the NPM tarball artifact to upload.`);
                }

                const resolvedTarballDir = path.resolve(artifact.files[0]);
                if (!fs.existsSync(resolvedTarballDir) || !fs.lstatSync(resolvedTarballDir).isDirectory()) {
                    throw new Error(
                        `NPM tarball artifact directory does not exist or is not a directory. Path: ${resolvedTarballDir}`
                    );
                }

                const tarballDirFiles = fs.readdirSync(resolvedTarballDir);
                if (tarballDirFiles.length !== 1) {
                    throw new Error(
                        `NPM tarball artifact directory must only contain the NPM tarball, found '${tarballDirFiles.length}' items instead. Path: ${resolvedTarballDir}`
                    );
                }

                console.log(`Uploading NPM tarball artifact to release: ${path.basename(tarballDirFiles[0])}`);
                uploadArtifact(tarballDirFiles[0]);
                break;
            }
        }
    };
}
