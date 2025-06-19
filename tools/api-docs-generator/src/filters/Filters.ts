// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { FileLoader } from '../FileLoader';
import { MinecraftRelease } from '../MinecraftRelease';

/**
 * Type alias representing a 'filter' function that processes API metadata.
 *
 * Format: ['filter-name', filterFunc]
 */
export type Filter = [string, (releases: MinecraftRelease[], fileLoader?: FileLoader) => void];

/**
 * Represents a group of filters that a MarkupGenerator can depend on,
 * specifying filters that should be ran before and after the common filter group.
 */
export type FilterGroup = {
    id: string;
    filtersBeforeCommon?: Filter[];
    filters?: Filter[];
};
