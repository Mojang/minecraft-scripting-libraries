// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parallel } from 'just-scripts';
import esbuild from 'esbuild';

export type BundleTaskParameters = {
    /** Initial script to be evaluated for the build. Documentation: https://esbuild.github.io/api/#entry-points */
    entryPoint: string;

    /** Packages to be considered as external. Documentation: https://esbuild.github.io/api/#external */
    external?: string[];

    /** When enabled, the generated code will be minified instead of pretty-printed. Documentation: https://esbuild.github.io/api/#minify */
    minifyWhitespace?: boolean;

    /** The output file for the bundle. Documentation: https://esbuild.github.io/api/#outfile */
    outfile: string;

    /** Flag to specify how to generate source map. Documentation: https://esbuild.github.io/api/#sourcemap */
    sourcemap?: boolean | 'linked' | 'inline' | 'external' | 'both';
};

export function bundleTask(options: BundleTaskParameters): ReturnType<typeof parallel> {
    return async () => {
        return esbuild.build({
            entryPoints: [options.entryPoint],
            bundle: true,
            format: 'esm',
            minifyWhitespace: options.minifyWhitespace,
            outfile: options.outfile,
            sourcemap: options.sourcemap,
            external: options.external,
        });
    };
}
