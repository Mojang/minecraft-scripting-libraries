// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { SchemaObject } from 'ajv';

/**
 * JSON schemas from Minecraft adhere to the Draft 7 spec with the addition
 * of custom annotations to indicate the minecraft version used to generate the schema.
 */
export type MinecraftSchemaObject = SchemaObject & {
    'x-minecraft-version'?: string;
    'x-format-version'?: string;
    title: string;
};

export type MinecraftProtocolSchemaObject = MinecraftSchemaObject & {
    'x-protocol-version'?: string;
    'x-underlying-type'?: string;
    'x-serialization-options'?: string;
    'x-ordinal-index'?: number;
    'x-control-value-type'?: string;
    type?: string;
    title?: string;
    description?: string;
    properties?: Record<string, MinecraftProtocolSchemaObject>;
    required?: string[];
    definitions?: Record<string, MinecraftProtocolSchemaObject>;
    enum?: string[];
    items?: MinecraftProtocolSchemaObject;
    oneOf?: MinecraftProtocolSchemaObject[];
    $ref?: string;
    $metaProperties?: Record<string, unknown>;
};

/**
 * Map of JSON schemas where the key is the full path of a schema including its version.
 */
export type MinecraftJsonSchemaMap = Record<string, MinecraftSchemaObject>;

/**
 * Map of protocol schemas where the key is the full path of a schema
 */
export type MinecraftProtocolSchemaMap = Record<string, MinecraftProtocolSchemaObject>;
