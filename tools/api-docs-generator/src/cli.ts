#!/usr/bin/env node
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';
import semver from 'semver';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { PreexistingModuleReleasesRecord, IncludeModulesModeUnion } from './Config';
import { LogOptions, LogOptionsRecord } from './Logger';
import { generate } from './generator';

const argv = yargs(hideBin(process.argv))
    .parserConfiguration({
        'boolean-negation': false,
    })
    .usage('Usage: minecraft-api-docs-generator [options]')
    .option('input-directory', {
        alias: 'i',
        type: 'string',
        nargs: 1,
        desc: 'Directory of the API metadata JSON input files.',
    })
    .option('output-directory', {
        alias: 'o',
        type: 'string',
        nargs: 1,
        desc: 'Directory to output generated types and documentation to.',
    })
    .option('docs-directory', {
        alias: 'd',
        type: 'string',
        nargs: 1,
        desc: 'Directory of the documentation info.JSON files that provide description strings for API modules.',
    })
    .option('run-generators', {
        alias: 'g',
        type: 'array',
        string: true,
        desc: `IDs of markup generators to render output files with. Supports multiple arguments. Examples: '-g ts' or '-g msdocs typedoc'`,
    })
    .option('changelog-strategy', {
        type: 'string',
        nargs: 1,
        desc: `String ID of the changelog strategy to use when comparing modules. Default: 'module_version'`,
    })
    .option('minecraft-version', {
        alias: 'mcv',
        type: 'string',
        nargs: 1,
        desc: `Semantic version string for which version of Minecraft to use for versioning. Examples: '--mcv 1.2.3' or '--mcv 1.2.3-beta.5'`,
        coerce: (version: string) => {
            if (semver.valid(version)) {
                return version;
            } else {
                throw new Error(`Provided Minecraft release version '${version}' is not a valid semver string.`);
            }
        },
    })
    .option('preexisting-release-versions', {
        alias: 'prv',
        type: 'string',
        nargs: 1,
        desc: `Path to a JSON file that is a map of module names to arrays of semantic version strings which have been released on NPM. Example JSON: '{"@minecraft/server": ["1.2.3"], "@minecraft/common": ["1.2.3-beta.5"]}'`,
        coerce: (filePath: string) => {
            const preexistingReleasesPath = path.resolve(filePath);
            if (fs.existsSync(preexistingReleasesPath)) {
                const fileContent = fs.readFileSync(preexistingReleasesPath);
                return PreexistingModuleReleasesRecord.check(JSON.parse(fileContent.toString()));
            } else {
                throw new Error(`No preexisting releases file found at '${preexistingReleasesPath}'.`);
            }
        },
    })
    .option('include-modules', {
        alias: 'm',
        type: 'string',
        nargs: 1,
        desc: `Mode which determines which input modules should be included in generation. Options: ${IncludeModulesModeUnion.alternatives.map(m => m.value).join(',')}. Example: '--include-modules latest'. Default: 'all'`,
        coerce: (mode: string) => {
            return IncludeModulesModeUnion.check(mode);
        },
    })
    .option('include-base', {
        alias: 'b',
        type: 'boolean',
        desc: 'If set, will include base modules in generation for metadata that would be merged to a parent module. By default, only the merged module will generate output.',
    })
    .option('skip-merging', {
        type: 'boolean',
        desc: 'If set to true, skip module merging so parented modules are not merged with their child modules.',
        conflicts: ['include-base'],
    })
    .option('plugin', {
        alias: 'p',
        type: 'array',
        string: true,
        desc: `Plugin packages to import generators and templates from. Supports multiple arguments. Example: '--plugin @minecraft/markup-generators-plugin'`,
    })
    .option('config', {
        alias: 'c',
        type: 'string',
        nargs: 1,
        desc: 'Path to a config file with options.',
        conflicts: 'no-config',
        coerce: (filePath: string) => {
            const resolvedConfigPath = path.resolve(filePath);
            if (fs.existsSync(resolvedConfigPath)) {
                return resolvedConfigPath;
            } else {
                throw new Error(`No config file found at ${resolvedConfigPath}`);
            }
        },
    })
    .option('no-config', {
        type: 'boolean',
        desc: 'If set, will not look for any config files.',
        conflicts: 'config',
    })
    .option('log', {
        alias: 'l',
        desc: `Logging options. Options: ${Object.keys(LogOptionsRecord.fields).join(', ')}. Usage: '--log.<option> <value>'. Example: '--log.level debug'`,
        conflicts: 'suppress',
        coerce: (opts: Record<string, unknown>) => {
            if (!opts || typeof opts !== 'object') {
                throw new Error(`Expected to receive options for --log. Usage: '--log.<option> <value>'`);
            }
            for (const key in opts) {
                opts[key] = opts[key] === 'true' ? true : opts[key] === 'false' ? false : opts[key];
            }
            return LogOptionsRecord.check(opts);
        },
    })
    .option('suppress', {
        alias: 's',
        type: 'boolean',
        desc: `If set, will suppress verbose logging and only output errors. Default: false`,
        conflicts: 'log',
    })
    .help('help')
    .alias('help', 'h')
    .parseSync();

module.exports = (async () => {
    if ((!argv.inputDirectory || !argv.outputDirectory) && (!argv.config || argv.noConfig)) {
        throw new Error(
            `Must specify both '--input-directory' and '--output-directory' or a config file path with '--config'`
        );
    }

    const logOptions: LogOptions = argv.log ? argv.log : argv.suppress ? { level: 'error' } : undefined;

    await generate({
        inputDirectory: argv.inputDirectory,
        outputDirectory: argv.outputDirectory,
        documentationDirectory: argv.docsDirectory,
        generatorsToRun: argv.runGenerators,
        changelogStrategy: argv.changelogStrategy,
        minecraftReleaseVersion: argv.minecraftVersion,
        preexistingModuleReleases: argv.preexistingReleaseVersions,
        includeModulesMode: argv.includeModules,
        includeBaseModules: argv.includeBase,
        plugins: argv.plugin,
        configPath: argv.config,
        ignoreConfig: argv.noConfig,
        log: logOptions,
        skipMerging: argv.skipMerging,
    });
})();
