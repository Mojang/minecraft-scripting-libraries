// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * MinecraftApiDocsGenerator is primarily a command line tool, but we export the main generation logic
 * to allow extending it with custom generators.
 */

export * from './ChangelogStrategy';
export { Config, GenerateOptions } from './Config';
export { GeneratorContext } from './Context';
export { FileLoader } from './FileLoader';
export * from './filters';
export { generate } from './generator';
export * as Logger from './Logger';
export * from './MinecraftRelease';
export * from './modules';
export { MarkupGenerator, MarkupGeneratorOptions, Plugin } from './plugins';
export { PRETTIER_CONFIGURATION } from './PrettierConfiguration';
export * as Utils from './utilities';
