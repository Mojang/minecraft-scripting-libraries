// This file uses the ESM syntax as @octokit/core does not support CommonJS. This appeases the TS build, and compatibility with commonjs is handled by esbuild

import { Octokit } from '@octokit/rest';
import archiver from 'archiver';
import { createWriteStream, readFileSync, unlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Configuration for publishing the release
 */
export type PublishReleaseTaskConfig = {
    /**
     * A custom message to include in the release
     */
    message: string;
    /**
     * Repo Owner/Organization
     */
    repoOwner: string;
    /**
     * Name of the repository
     */
    repoName: string;
    /**
     * GitHub token used for creating the release. If not specified, will attempt to use REPO_PAT environment variable
     */
    token?: string;
};

export function publishReleaseTask(config: PublishReleaseTaskConfig) {
    return async () => {
        // Get token from environment variable, or passed in as an argument
        const token = config.token ?? process.env.REPO_PAT;
        if (!token) {
            throw new Error(
                'No repo token is available, pass it in via configuration or set the REPO_PAT environment variable. Unable to create release.'
            );
        }

        const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
        const publishedVersion = packageJson['version'];
        const name = packageJson['name'];

        // To get the body of the release, read in the CHANGELOG.json file, read the "entries" array, get the first entry, go to the comments object,
        // then collect the "body" field of each comment. Join all of these together with a newline character. There is a comments key for each type
        // of release "major", "minor", "patch", "none"
        const changelog = JSON.parse(readFileSync('./CHANGELOG.json', 'utf-8'));
        const firstEntry = changelog['entries'][0];
        if (!firstEntry) {
            throw new Error(
                'No entries found in the CHANGELOG.json file. Did beachball have an error? Unable to create release notes.'
            );
        }

        const comments: { [version: string]: { author: string; commit: string; comment: string }[] } =
            firstEntry['comments'];
        let body: string = `${config.message}\n\n# Changes\n\n`;
        for (const [key, value] of Object.entries(comments)) {
            // Key is the version type, value is an array of entries
            body += `## ${key[0].toUpperCase()}${key.slice(1)}\n\n${value
                .map(entry => `- ${entry.author} (${entry.commit}):\n${entry.comment}`)
                .join('\n')}\n\n`;
        }

        // Package everything in the dist folder into a release
        const octokit = new Octokit({ auth: token });
        const tagName = `${name}_v${publishedVersion}`;
        const response = await octokit.rest.repos.createRelease({
            owner: config.repoOwner,
            repo: config.repoName,
            tag_name: tagName,
            name: `${name} ${publishedVersion}`,
            body,
            draft: true,
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

        // Release is created, so let's get our assets and upload them
        const releaseFile = `${tagName}.zip`.replaceAll('/', '_').replaceAll('@', '');

        // Outputs to the cwd but deletes the file after publish
        const outputPath = resolve(`${releaseFile}`);
        const output = createWriteStream(outputPath);
        try {
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.on('error', function (err) {
                throw new Error(`Failed to create archive for release: ${err}`);
            });

            // Get all files in the dist folder
            archive.pipe(output);
            archive.glob('**/*', { cwd: resolve('dist') });
            await archive.finalize();
            output.close();

            // Now we have the asset, load it into a buffer, and upload
            const data = (await readFile(outputPath)) as unknown as string;
            const response = await octokit.rest.repos.uploadReleaseAsset({
                mediaType: {
                    format: 'application/zip',
                },
                owner: config.repoOwner,
                repo: config.repoName,
                release_id: releaseId,
                data,
                name: releaseFile,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            });

            if (response.status !== 201) {
                throw new Error(`Failed to create release. Status: ${response.status}`);
            }
        } finally {
            // Clean up file always
            unlinkSync(outputPath);
        }
    };
}
