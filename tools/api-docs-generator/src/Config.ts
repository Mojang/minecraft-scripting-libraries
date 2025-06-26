// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { cosmiconfig, CosmiconfigResult } from 'cosmiconfig';
import * as rt from 'runtypes';

import { LogOptionsRecord } from './Logger';

export const CONFIG_NAME = 'api-docs-generator';

/**
 * Helper for finding the config file using cosmiconfig.
 */
export async function findConfig(): Promise<CosmiconfigResult> {
    return await cosmiconfig(CONFIG_NAME, { searchStrategy: 'project' }).search();
}

/**
 * Helper for type validating config file.
 */
export function checkConfig(config: Config): Config {
    return ConfigOptionsRecord.check(config);
}

export const PreexistingModuleReleasesRecord = rt.Dictionary(rt.Array(rt.String), rt.String);
export type PreexistingModuleReleases = rt.Static<typeof PreexistingModuleReleasesRecord>;

export const IncludeModulesModeUnion = rt.Union(rt.Literal('all'), rt.Literal('latest'));
export type IncludeModulesMode = rt.Static<typeof IncludeModulesModeUnion>;

const PluginOptionsRecord = rt.Intersect(
    rt.Record({
        path: rt.Optional(rt.String),
    }),
    rt.Dictionary(rt.Unknown, rt.String)
);
export type PluginOptions = rt.Static<typeof PluginOptionsRecord>;

const PluginConfigRecord = rt.Union(
    rt.String,
    rt.Tuple(rt.String, PluginOptionsRecord),
    rt.Array(rt.String).withConstraint(arr => arr.length === 1)
);

/**
 * The plugin config is a tuple of plugin module names and objects containing plugin-specific options.
 *
 * Plugins will be imported from node_modules by name or from a path if specified.
 *
 * Example:
 * ```
 * [
 *   'plugin-module',
 *   ['plugin-with-options', { path: './path/to/plugin.js' }]
 * ]
 * ```
 */
export type PluginConfig = rt.Static<typeof PluginConfigRecord>;

const ConfigOptionsRecord = rt.Record({
    inputDirectory: rt.Optional(rt.String),
    outputDirectory: rt.Optional(rt.String),
    documentationDirectory: rt.Optional(rt.String),
    generatorsToRun: rt.Optional(rt.Array(rt.String)),
    changelogStrategy: rt.Optional(rt.String),
    minecraftReleaseVersion: rt.Optional(rt.String),
    preexistingModuleReleases: rt.Optional(PreexistingModuleReleasesRecord),
    includeModulesMode: rt.Optional(IncludeModulesModeUnion),
    includeBaseModules: rt.Optional(rt.Boolean),
    skipMerging: rt.Optional(rt.Boolean),
    plugins: rt.Optional(rt.Array(PluginConfigRecord)),
    generators: rt.Optional(rt.Dictionary(rt.Dictionary(rt.Unknown, rt.String), rt.String)),
    log: rt.Optional(LogOptionsRecord),
});

/**
 * Options used by generate() that can be invoked through CLI.
 */
export type GenerateOptions = rt.Static<typeof ConfigOptionsRecord> & {
    configPath?: string;
    ignoreConfig?: boolean;
};

/**
 * 'api-generator.config.mjs' config schema.
 */
export type Config = rt.Static<typeof ConfigOptionsRecord>;

/**
 * Options from config files and generate() arguments.
 */
export type ConfigOptions = GenerateOptions & Config;
