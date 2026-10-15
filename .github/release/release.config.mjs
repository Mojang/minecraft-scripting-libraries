// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Releases never commit back to the repository. Packages are checked in at version `0.0.0-semantically-released` and
// the git tags are the source of truth: at release time the next version and internal dependency ranges are written
// into the CI checkout's package.json files only, then the package is published to npm, tagged, and given a GitHub
// release with notes.

/**
 * Flags for @anolilab/multi-semantic-release.
 */
export const multiReleaseFlags = {
    // Matches the tag format previously produced by beachball (e.g. `@minecraft/math_v2.4.0`), so existing tags are
    // picked up as the last release of each package.
    tagFormat: '${name}_v${version}',
    ignorePrivate: true,
    deps: {
        // Internal dependencies are checked in as "*" (to link the unversioned workspace packages), so always rewrite
        // them to `^<released version>` in the published manifest.
        bump: 'override',
        // Release dependents with a patch when one of their internal dependencies is released.
        release: 'patch',
        prefix: '^',
    },
};

const commitAnalyzer = ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }];
const releaseNotesGenerator = ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }];

/**
 * semantic-release options applied to every public workspace package. Plugins run with `cwd` set to the package
 * directory.
 */
export const semanticReleaseOptions = {
    branches: ['main'],
    plugins: [
        commitAnalyzer,
        releaseNotesGenerator,
        // Publishes with npm trusted publishing (OIDC) when run from the release workflow. Also packs the tarball (after
        // the version and dependency ranges have been written to package.json) so it can be attached to the GitHub
        // release.
        ['@semantic-release/npm', { tarballDir: 'release-artifacts' }],
        [
            '@semantic-release/github',
            {
                assets: [{ path: 'release-artifacts/*.tgz' }],
                releaseNameTemplate:
                    "<%= nextRelease.gitTag.slice(0, nextRelease.gitTag.lastIndexOf('_v')) %> <%= nextRelease.version %>",
                // Only needs `contents: write`; don't comment on, label, or open issues.
                successComment: false,
                failComment: false,
                failTitle: false,
                releasedLabels: false,
            },
        ],
    ],
};

/**
 * Options used for local `--dry-run` previews. Only analyzes commits and generates notes, so no npm or GitHub
 * credentials are required.
 */
export const previewOptions = {
    ...semanticReleaseOptions,
    plugins: [commitAnalyzer, releaseNotesGenerator],
};
