// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SchemaObject } from 'ajv';

/**
 * JSON schemas from Minecraft adhere to the Draft 7 spec with the addition
 * of a single custom annotation to indicate the minecraft version used to
 * generate the schema.
 */
export type MinecraftSchemaObject = SchemaObject & {
    'x-minecraft-version'?: string;
    'x-format-version'?: string;
    title: string;
};

/**
 * Map of JSON schema where the key is the full "path" of a schema including
 * its version.
 */
export type MinecraftJsonSchemaMap = Record<string, MinecraftSchemaObject>;
