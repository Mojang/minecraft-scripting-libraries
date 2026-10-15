// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// Releases all public workspace packages with multi-semantic-release.
//
// Usage (from this directory):
//   npm run release            Full release. Only intended to run in the release GitHub workflow.
//   npm run release:dry-run    Preview what would be released. Run from an up-to-date `main` checkout; no npm or
//                              GitHub release credentials are needed, but you must have push access to the repo.

import multiSemanticRelease from '@anolilab/multi-semantic-release';
import { fileURLToPath } from 'node:url';
import { multiReleaseFlags, previewOptions, semanticReleaseOptions } from './release.config.mjs';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const dryRun = process.argv.includes('--dry-run');

const options = dryRun ? previewOptions : semanticReleaseOptions;
const flags = dryRun ? { ...multiReleaseFlags, dryRun: true, ci: false } : multiReleaseFlags;

// `npm version` (run by @semantic-release/npm) would otherwise reinstall the workspace after bumping. Released
// manifests depend on `^<released version>` of sibling packages that are still `0.0.0-semantically-released` in the
// checkout, so that reinstall would pull those siblings from the registry.
process.env.npm_config_workspaces_update = 'false';

try {
    await multiSemanticRelease(null, options, { cwd: repoRoot }, flags);
} catch (error) {
    console.error(error);
    process.exit(1);
}
