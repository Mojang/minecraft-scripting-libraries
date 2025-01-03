// Core build tasks build is separate from just to minimize dependencies

import { buildSync } from 'esbuild';
import { execSync } from 'node:child_process';

/* This goes through a few steps
 * 1. .d.ts file generation
 * 2. CJS Bundle Creation
 * 3. ESM Bundle Creation
 *
 * Core build tasks is bundled because just.js can only truly function with CommonJS, as it imports dependencies
 * with require. However, some packages we use (such as octokit) are ESM only. To bridge this gap, we bundle
 * core build tasks with both modes. However, to ensure we aren't fully locking in consumers to specific versions
 * of dependencies, the top level dependencies are treated as external (TS, ESLint, ESBuild, Prettier)
 */
const externalDependencies = [
    'esbuild',
    '@microsoft/api-extractor',
    'typescript',
    'eslint',
    'vitest',
    'prettier',
    'just-scripts',
];

execSync('tsc --project tsconfig.types.json');

const commonOptions = {
    entryPoints: ['./src/index.ts'],
    bundle: true,
    external: externalDependencies,
    platform: 'node',
};
let result = buildSync({
    ...commonOptions,
    tsconfig: './tsconfig.cjs.json',
    outdir: 'lib-cjs',
    format: 'cjs',
    write: true,
});
result = buildSync({
    ...commonOptions,
    format: 'esm',
    tsconfig: './tsconfig.esm.json',
    outdir: 'lib',
    write: true,
});
