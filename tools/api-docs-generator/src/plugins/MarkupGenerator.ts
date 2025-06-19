// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { GeneratorContext } from '../Context';
import { FilterGroup } from '../filters';
import { MinecraftRelease } from '../MinecraftRelease';

/**
 * Configuration options which can be extended per generator
 */
export type MarkupGeneratorOptions = Record<string, unknown>;

/**
 * Represents a file generator that inputs Minecraft API metadata and transforms it into a specified format
 */
export interface MarkupGenerator<TOptions extends MarkupGeneratorOptions = MarkupGeneratorOptions> {
    /**
     * Outputs Minecraft API module metadata
     *
     * @param context Contains global configuration options for the api-docs-generator
     * @param releases API modules sorted into release objects by minecraft release version
     * @param outputDirectory Directory that the generator outputs markup to
     * @param options Generator-specific configuration options
     */
    generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string,
        options?: TOptions
    ): Promise<void>;

    readonly id: string;
    readonly name: string;
    readonly outputDirectoryName: string;

    readonly dependencies?: string[];
    readonly templates?: string[];
    readonly filterGroups?: FilterGroup[];

    readonly defaultOptions?: TOptions;
}
