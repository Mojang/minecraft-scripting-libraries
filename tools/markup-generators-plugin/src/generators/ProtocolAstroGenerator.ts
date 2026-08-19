// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { promises as fs } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import semver from 'semver';

import {
    GeneratorContext,
    Logger,
    MarkupGenerator,
    MinecraftProtocolSchemaObject,
    MinecraftRelease,
} from '@minecraft/api-docs-generator';

type ProtocolTypeCategory = 'array' | 'enum' | 'object' | 'scalar' | 'union' | 'other';

interface RegisteredSchema {
    category: ProtocolTypeCategory | 'packet';
    packetId: number;
    schema: MinecraftProtocolSchemaObject;
    slug: string;
    sourcePath: string;
    title: string;
}

interface ProtocolVariant {
    index: number;
    target?: string;
    title: string;
    type: string;
}

interface ProtocolField {
    children?: ProtocolField[];
    description: string;
    enumValues?: string[];
    name: string;
    ordinal?: number;
    required: boolean;
    serialization: string[];
    target?: string;
    type: string;
    variants?: ProtocolVariant[];
    wireSize: string;
    wireSizeBytes: number;
}

interface ProtocolUse {
    packetSlug: string;
    packetTitle: string;
    path: string[];
}

interface ProtocolWireFormat {
    serialization: string[];
    type: string;
}

interface ProtocolTypeDocument {
    category: ProtocolTypeCategory;
    description: string;
    enumValues: string[];
    fields: ProtocolField[];
    serialization: string[];
    slug: string;
    title: string;
    uses: ProtocolUse[];
    wireFormats: ProtocolWireFormat[];
}

interface ProtocolPacketDocument {
    description: string;
    details: string;
    fields: ProtocolField[];
    id: number;
    slug: string;
    title: string;
}

interface ProtocolPrimitiveDocument {
    category: 'Boolean' | 'Floating point' | 'Signed integer' | 'Text' | 'Unsigned integer';
    encoding: string;
    size: string;
    slug: string;
    title: string;
}

interface ProtocolChangeItem {
    details: string[];
    slug: string;
    title: string;
}

interface ProtocolChangeSet {
    added: ProtocolChangeItem[];
    changed: ProtocolChangeItem[];
    removed: ProtocolChangeItem[];
}

interface ProtocolChangelogRelease {
    minecraftVersion: string;
    packets: ProtocolChangeSet;
    previousProtocolVersion: string;
    previousVersion: string;
    protocolVersion: string;
    protocolVersionShouldHaveChanged: boolean;
    releaseDate: string;
    totalChanges: number;
    types: ProtocolChangeSet;
    version: string;
}

interface ProtocolMetadataDocument {
    changelog: ProtocolChangelogRelease[];
    minecraftVersion: string;
    packets: ProtocolPacketDocument[];
    primitives: ProtocolPrimitiveDocument[];
    protocolVersion: string;
    types: ProtocolTypeDocument[];
}

interface ProtocolReleaseSnapshot {
    metadata: Omit<ProtocolMetadataDocument, 'changelog'>;
    releaseDate: string;
    version: string;
}

type ProtocolPrimitiveDefinition = Omit<ProtocolPrimitiveDocument, 'slug' | 'title'>;

const CHANGELOG_RELEASE_COUNT = 15;

const PRIMITIVE_DEFINITIONS: Record<string, ProtocolPrimitiveDefinition> = {
    boolean: {
        category: 'Boolean',
        encoding: 'Encoded as one unsigned byte. 0 represents false and 1 represents true.',
        size: '1 byte',
    },
    varboolean: {
        category: 'Boolean',
        encoding: 'Encoded through the variable-length unsigned integer path. Valid false and true values are 0 and 1.',
        size: '1 byte for valid boolean values',
    },
    int8: {
        category: 'Signed integer',
        encoding: "Two's-complement signed integer.",
        size: '1 byte',
    },
    int16: {
        category: 'Signed integer',
        encoding: "Two's-complement signed integer, little-endian unless the field specifies Big Endian.",
        size: '2 bytes',
    },
    int32: {
        category: 'Signed integer',
        encoding: "Two's-complement signed integer, little-endian unless the field specifies Big Endian.",
        size: '4 bytes',
    },
    int64: {
        category: 'Signed integer',
        encoding: "Two's-complement signed integer, little-endian unless the field specifies Big Endian.",
        size: '8 bytes',
    },
    varint8: {
        category: 'Signed integer',
        encoding: 'ZigZag-encoded, then written as base-128 groups with the high bit indicating continuation.',
        size: '1-2 bytes',
    },
    varint16: {
        category: 'Signed integer',
        encoding: 'ZigZag-encoded, then written as base-128 groups with the high bit indicating continuation.',
        size: '1-3 bytes',
    },
    varint32: {
        category: 'Signed integer',
        encoding: 'ZigZag-encoded, then written as base-128 groups with the high bit indicating continuation.',
        size: '1-5 bytes',
    },
    varint64: {
        category: 'Signed integer',
        encoding: 'ZigZag-encoded, then written as base-128 groups with the high bit indicating continuation.',
        size: '1-10 bytes',
    },
    uint8: {
        category: 'Unsigned integer',
        encoding: 'Unsigned binary integer.',
        size: '1 byte',
    },
    uint16: {
        category: 'Unsigned integer',
        encoding: 'Unsigned binary integer, little-endian unless the field specifies Big Endian.',
        size: '2 bytes',
    },
    uint32: {
        category: 'Unsigned integer',
        encoding: 'Unsigned binary integer, little-endian unless the field specifies Big Endian.',
        size: '4 bytes',
    },
    uint64: {
        category: 'Unsigned integer',
        encoding: 'Unsigned binary integer, little-endian unless the field specifies Big Endian.',
        size: '8 bytes',
    },
    varuint8: {
        category: 'Unsigned integer',
        encoding: 'Written as base-128 groups with the high bit indicating that another byte follows.',
        size: '1-2 bytes',
    },
    varuint32: {
        category: 'Unsigned integer',
        encoding: 'Written as base-128 groups with the high bit indicating that another byte follows.',
        size: '1-5 bytes',
    },
    varuint64: {
        category: 'Unsigned integer',
        encoding: 'Written as base-128 groups with the high bit indicating that another byte follows.',
        size: '1-10 bytes',
    },
    float: {
        category: 'Floating point',
        encoding: 'IEEE 754 binary32, little-endian unless the field specifies Big Endian.',
        size: '4 bytes',
    },
    double: {
        category: 'Floating point',
        encoding: 'IEEE 754 binary64, little-endian unless the field specifies Big Endian.',
        size: '8 bytes',
    },
    string: {
        category: 'Text',
        encoding: 'UTF-8 bytes prefixed by their byte length as a varuint32.',
        size: 'Variable',
    },
};

const PROJECT_FILES = [
    'README.md',
    'astro.config.mjs',
    'package.json',
    'tsconfig.json',
    'src/components/Datagram.astro',
    'src/components/ChangelogDetail.astro',
    'src/components/FieldTree.astro',
    'src/components/ProtocolSearch.astro',
    'src/components/SerializationTag.astro',
    'src/layouts/Layout.astro',
    'src/pages/changelog/index.astro',
    'src/pages/index.astro',
    'src/pages/packets/[slug].astro',
    'src/pages/primitives/index.astro',
    'src/pages/types/index.astro',
    'src/pages/types/[slug].astro',
    'src/styles/global.css',
    'src/styles/xbox.css',
    'src/types.ts',
] as const;

function schemaCategory(schema: MinecraftProtocolSchemaObject): ProtocolTypeCategory {
    if (schema.enum) return 'enum';
    if (schema.oneOf) return 'union';
    if (schema.type === 'object') return 'object';
    if (schema.type === 'array') return 'array';
    if (schema.type && ['boolean', 'integer', 'number', 'string'].includes(schema.type)) return 'scalar';
    return 'other';
}

function serializationOptions(schema: MinecraftProtocolSchemaObject): string[] {
    const options: unknown = schema['x-serialization-options'];
    if (Array.isArray(options)) return options.map(String);
    return options ? [String(options)] : [];
}

function slugify(value: string): string {
    return (
        value
            .replace(/^enum\s+/i, '')
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase() || 'unnamed'
    );
}

export class ProtocolAstroGenerator implements MarkupGenerator {
    private readonly schemasByKey = new Map<string, RegisteredSchema>();
    private readonly schemasByTitle = new Map<string, RegisteredSchema>();
    private readonly usedPacketSlugs = new Set<string>();
    private readonly usedTypeSlugs = new Set<string>();

    private uniqueSlug(title: string, packet: boolean): string {
        const usedSlugs = packet ? this.usedPacketSlugs : this.usedTypeSlugs;
        const baseSlug = slugify(title);
        let slug = baseSlug;
        let suffix = 2;
        while (usedSlugs.has(slug)) slug = `${baseSlug}-${suffix++}`;
        usedSlugs.add(slug);
        return slug;
    }

    private packetId(schema: MinecraftProtocolSchemaObject): number {
        const packetId: unknown = schema.$metaProperties?.['[cereal:packet]'];
        return typeof packetId === 'number' ? packetId : -1;
    }

    private isPacket(key: string, schema: MinecraftProtocolSchemaObject): boolean {
        return this.packetId(schema) >= 0 || path.basename(key, '.json').endsWith('Packet');
    }

    private registerSchema(
        key: string,
        sourcePath: string,
        schema: MinecraftProtocolSchemaObject,
        packet: boolean = false
    ): RegisteredSchema | undefined {
        if (!schema.title) return undefined;

        const existing = !packet ? this.schemasByTitle.get(schema.title) : undefined;
        if (existing) {
            this.schemasByKey.set(key, existing);
            return existing;
        }

        const registered: RegisteredSchema = {
            category: packet ? 'packet' : schemaCategory(schema),
            packetId: packet ? this.packetId(schema) : -1,
            schema,
            slug: this.uniqueSlug(schema.title, packet),
            sourcePath,
            title: schema.title,
        };
        this.schemasByKey.set(key, registered);
        if (!packet) this.schemasByTitle.set(schema.title, registered);
        return registered;
    }

    private registerNestedSchemas(schema: MinecraftProtocolSchemaObject, key: string, sourcePath: string): void {
        for (const [definitionId, definition] of Object.entries(schema.definitions ?? {})) {
            const definitionKey = `${sourcePath}#/definitions/${definitionId}`;
            this.registerSchema(definitionKey, sourcePath, definition);
            this.registerNestedSchemas(definition, definitionKey, sourcePath);
        }

        for (const [fieldName, field] of Object.entries(schema.properties ?? {})) {
            const fieldKey = `${key}/properties/${encodeURIComponent(fieldName)}`;
            if (field.title && (field.enum || field.oneOf || field.type === 'object')) {
                this.registerSchema(fieldKey, sourcePath, field);
            }
            this.registerNestedSchemas(field, fieldKey, sourcePath);
        }
    }

    private indexSchemas(schemas: Record<string, MinecraftProtocolSchemaObject>): void {
        this.schemasByKey.clear();
        this.schemasByTitle.clear();
        this.usedPacketSlugs.clear();
        this.usedTypeSlugs.clear();

        const entries = Object.entries(schemas).sort(([left], [right]) => left.localeCompare(right));
        for (const [sourcePath, schema] of entries) {
            this.registerSchema(sourcePath, sourcePath, schema, this.isPacket(sourcePath, schema));
        }
        for (const [sourcePath, schema] of entries) this.registerNestedSchemas(schema, sourcePath, sourcePath);
    }

    private resolveReference(reference: string, sourcePath: string): RegisteredSchema | undefined {
        const hashIndex = reference.indexOf('#');
        const fileReference = hashIndex >= 0 ? reference.substring(0, hashIndex) : reference;
        const fragment = hashIndex >= 0 ? reference.substring(hashIndex) : '';
        const referencedPath = fileReference ? path.resolve(path.dirname(sourcePath), fileReference) : sourcePath;
        return this.schemasByKey.get(`${referencedPath}${fragment}`);
    }

    private referencedSchema(schema: MinecraftProtocolSchemaObject, sourcePath: string): RegisteredSchema | undefined {
        if (schema.$ref) return this.resolveReference(schema.$ref, sourcePath);
        if (schema.type === 'array' && schema.items?.$ref) {
            return this.resolveReference(schema.items.$ref, sourcePath);
        }
        return schema.title ? this.schemasByTitle.get(schema.title) : undefined;
    }

    private underlyingType(schema: MinecraftProtocolSchemaObject, sourcePath: string): string {
        const options = serializationOptions(schema);
        if (schema['x-underlying-type']) {
            const underlyingType = schema['x-underlying-type'];
            if (schema.enum && !options.includes('Enum-as-Value')) return schema.title ?? schema.type ?? 'enum';
            return options.includes('Compression') ? `var${underlyingType}` : underlyingType;
        }
        if (schema.type === 'array') {
            return `array<${schema.items ? this.underlyingType(schema.items, sourcePath) : 'unknown'}>`;
        }
        if (schema.oneOf) {
            return `oneOf<${schema.oneOf.map(item => this.underlyingType(item, sourcePath)).join(', ')}>`;
        }
        const target = this.referencedSchema(schema, sourcePath);
        if (target) return target.title;
        return schema.title ?? schema.type ?? 'unknown';
    }

    private wireSize(type: string): { bytes: number; label: string } {
        const normalized = type.toLowerCase();
        const fixedSizes: Record<string, number> = {
            boolean: 1,
            double: 8,
            float: 4,
            int8: 1,
            int16: 2,
            int32: 4,
            int64: 8,
            uint8: 1,
            uint16: 2,
            uint32: 4,
            uint64: 8,
        };
        const variableMaximums: Record<string, number> = {
            varboolean: 1,
            varint8: 2,
            varint16: 3,
            varint32: 5,
            varint64: 10,
            varuint8: 2,
            varuint32: 5,
            varuint64: 10,
        };
        const fixedSize = fixedSizes[normalized];
        if (fixedSize) {
            return { bytes: fixedSize, label: `${fixedSize} byte${fixedSize === 1 ? '' : 's'}` };
        }
        const variableMaximum = variableMaximums[normalized];
        if (variableMaximum) {
            return { bytes: variableMaximum, label: `variable (up to ${variableMaximum} bytes)` };
        }
        return { bytes: 8, label: 'variable' };
    }

    private createFields(schema: MinecraftProtocolSchemaObject, sourcePath: string): ProtocolField[] {
        const required = new Set(schema.required ?? []);
        return Object.entries(schema.properties ?? {})
            .sort(([, left], [, right]) => (left['x-ordinal-index'] ?? 9999) - (right['x-ordinal-index'] ?? 9999))
            .map(([name, field]) => {
                const target = this.referencedSchema(field, sourcePath);
                const type = this.underlyingType(field, sourcePath);
                const wireSize = this.wireSize(type);
                const ordinal = field['x-ordinal-index'];
                const variants = field.oneOf?.map((variant, index) => {
                    const variantTarget = this.referencedSchema(variant, sourcePath);
                    return {
                        index,
                        target: variantTarget?.slug,
                        title: variant.title ?? variantTarget?.title ?? `Variant ${index}`,
                        type: this.underlyingType(variant, sourcePath),
                    };
                });
                const children = !target && field.type === 'object' ? this.createFields(field, sourcePath) : undefined;
                return {
                    children: children?.length ? children : undefined,
                    description: field.description ?? '',
                    enumValues: target?.schema.enum ?? field.enum,
                    name,
                    ordinal: ordinal === undefined ? undefined : ordinal,
                    required: required.has(name),
                    serialization: serializationOptions(field),
                    target: target?.slug,
                    type,
                    variants,
                    wireSize: wireSize.label,
                    wireSizeBytes: wireSize.bytes,
                };
            });
    }

    private packetPayload(packet: RegisteredSchema): RegisteredSchema | undefined {
        if (packet.schema.$ref) return this.resolveReference(packet.schema.$ref, packet.sourcePath);
        const payload = packet.schema.properties?.mPayload;
        return payload?.$ref ? this.resolveReference(payload.$ref, packet.sourcePath) : undefined;
    }

    private packetPayloadSlugs(): Set<string> {
        const payloadSlugs = new Set<string>();
        for (const schema of new Set(this.schemasByKey.values())) {
            if (schema.category !== 'packet') continue;
            const payload = this.packetPayload(schema);
            if (payload) payloadSlugs.add(payload.slug);
        }
        return payloadSlugs;
    }

    private createPackets(): ProtocolPacketDocument[] {
        return Array.from(this.schemasByKey.values())
            .filter((schema, index, all) => schema.category === 'packet' && all.indexOf(schema) === index)
            .map(packet => {
                const payload = this.packetPayload(packet);
                const packetDetails = packet.schema.$metaProperties?.['[cereal:packet_details]'];
                return {
                    description: packet.schema.description ?? '',
                    details: packetDetails ? String(packetDetails) : '',
                    fields: this.createFields(
                        payload?.schema ?? packet.schema,
                        payload?.sourcePath ?? packet.sourcePath
                    ),
                    id: packet.packetId,
                    slug: packet.slug,
                    title: packet.title,
                };
            })
            .sort((left, right) => {
                if (left.id < 0 && right.id >= 0) return 1;
                if (right.id < 0 && left.id >= 0) return -1;
                return left.id - right.id || left.title.localeCompare(right.title);
            });
    }

    private createTypes(excludedSlugs: Set<string>): ProtocolTypeDocument[] {
        return Array.from(this.schemasByKey.values())
            .filter(
                (schema, index, all) =>
                    schema.category !== 'packet' && !excludedSlugs.has(schema.slug) && all.indexOf(schema) === index
            )
            .map(type => ({
                category: type.category as ProtocolTypeCategory,
                description: type.schema.description ?? '',
                enumValues: type.schema.enum ?? [],
                fields: this.createFields(type.schema, type.sourcePath),
                serialization: serializationOptions(type.schema),
                slug: type.slug,
                title: type.title,
                uses: [],
                wireFormats: [],
            }))
            .sort(
                (left, right) => left.category.localeCompare(right.category) || left.title.localeCompare(right.title)
            );
    }

    private addObservedWireFormats(packets: ProtocolPacketDocument[], types: ProtocolTypeDocument[]): void {
        const typesBySlug = new Map(types.map(type => [type.slug, type]));
        const addFormat = (targetSlug: string | undefined, wireType: string, serialization: string[]): void => {
            if (!targetSlug) return;
            const target = typesBySlug.get(targetSlug);
            if (!target || target.category !== 'enum' || wireType === target.title) return;

            const formatKey = `${wireType}\0${serialization.join('\0')}`;
            if (
                !target.wireFormats.some(format => `${format.type}\0${format.serialization.join('\0')}` === formatKey)
            ) {
                target.wireFormats.push({ serialization, type: wireType });
            }
        };
        const visitFields = (fields: ProtocolField[]): void => {
            for (const field of fields) {
                addFormat(field.target, field.type, field.serialization);
                for (const variant of field.variants ?? []) addFormat(variant.target, variant.type, []);
                visitFields(field.children ?? []);
            }
        };

        for (const packet of packets) visitFields(packet.fields);
        for (const type of types) visitFields(type.fields);
        for (const type of types) {
            type.wireFormats.sort((left, right) => left.type.localeCompare(right.type));
        }
    }

    private addIncludeHierarchy(packets: ProtocolPacketDocument[], types: ProtocolTypeDocument[]): void {
        const typesBySlug = new Map(types.map(type => [type.slug, type]));
        const visitFields = (
            packet: ProtocolPacketDocument,
            fields: ProtocolField[],
            pathParts: string[],
            ancestors: Set<string>
        ): void => {
            for (const field of fields) {
                const fieldPath = [...pathParts, field.name];
                if (field.target) visitType(packet, field.target, fieldPath, ancestors);
                visitFields(packet, field.children ?? [], fieldPath, ancestors);
                for (const variant of field.variants ?? []) {
                    if (variant.target) visitType(packet, variant.target, [...fieldPath, variant.title], ancestors);
                }
            }
        };
        const visitType = (
            packet: ProtocolPacketDocument,
            typeSlug: string,
            pathParts: string[],
            ancestors: Set<string>
        ): void => {
            const type = typesBySlug.get(typeSlug);
            if (!type) return;
            const usePath = [...pathParts, type.title];
            if (!type.uses.some(use => use.packetSlug === packet.slug && use.path.join('\0') === usePath.join('\0'))) {
                type.uses.push({ packetSlug: packet.slug, packetTitle: packet.title, path: usePath });
            }
            if (ancestors.has(typeSlug)) return;
            visitFields(packet, type.fields, usePath, new Set(ancestors).add(typeSlug));
        };

        for (const packet of packets) visitFields(packet, packet.fields, [], new Set());
        for (const type of types) {
            type.uses.sort(
                (left, right) =>
                    left.packetTitle.localeCompare(right.packetTitle) ||
                    left.path.join('/').localeCompare(right.path.join('/'))
            );
        }
    }

    private createPrimitives(
        packets: ProtocolPacketDocument[],
        types: ProtocolTypeDocument[]
    ): ProtocolPrimitiveDocument[] {
        const encountered = new Set<string>();
        const collectType = (type: string): void => {
            for (const token of type.match(/[A-Za-z][A-Za-z0-9]*/g) ?? []) {
                if (token in PRIMITIVE_DEFINITIONS) encountered.add(token);
            }
        };
        const collectFields = (fields: ProtocolField[]): void => {
            for (const field of fields) {
                collectType(field.type);
                for (const variant of field.variants ?? []) collectType(variant.type);
                collectFields(field.children ?? []);
            }
        };

        for (const packet of packets) collectFields(packet.fields);
        for (const type of types) collectFields(type.fields);

        return Object.entries(PRIMITIVE_DEFINITIONS)
            .filter(([title]) => encountered.has(title))
            .map(([title, definition]) => ({ ...definition, slug: slugify(title), title }));
    }

    private compareFields(currentFields: ProtocolField[], previousFields: ProtocolField[], parentPath = ''): string[] {
        const details: string[] = [];
        const currentByName = new Map(currentFields.map(field => [field.name, field]));
        const previousByName = new Map(previousFields.map(field => [field.name, field]));
        const fieldPath = (name: string) => (parentPath ? `${parentPath}.${name}` : name);

        for (const field of currentFields) {
            const previous = previousByName.get(field.name);
            const pathName = fieldPath(field.name);
            if (!previous) {
                details.push(`Added field ${pathName} (${field.type}).`);
                continue;
            }
            if (field.type !== previous.type) {
                details.push(`Changed ${pathName} type from ${previous.type} to ${field.type}.`);
            }
            if (field.required !== previous.required) {
                details.push(`${pathName} is now ${field.required ? 'required' : 'optional'}.`);
            }
            if (field.ordinal !== previous.ordinal) {
                details.push(
                    `Moved ${pathName} from field ${previous.ordinal ?? 'unassigned'} to ${field.ordinal ?? 'unassigned'}.`
                );
            }
            details.push(
                ...this.compareSerializationAnnotations(field.serialization, previous.serialization, pathName)
            );
            const currentEnumValues = new Set(field.enumValues ?? []);
            const previousEnumValues = new Set(previous.enumValues ?? []);
            for (const value of currentEnumValues) {
                if (!previousEnumValues.has(value)) details.push(`Added ${pathName} enum value ${value}.`);
            }
            for (const value of previousEnumValues) {
                if (!currentEnumValues.has(value)) details.push(`Removed ${pathName} enum value ${value}.`);
            }

            const variantSignature = (variant: ProtocolVariant) =>
                `${variant.index}\0${variant.title}\0${variant.type}\0${variant.target ?? ''}`;
            if (
                (field.variants ?? []).map(variantSignature).join('\x01') !==
                (previous.variants ?? []).map(variantSignature).join('\x01')
            ) {
                details.push(`Changed ${pathName} variants.`);
            }
            details.push(...this.compareFields(field.children ?? [], previous.children ?? [], pathName));
        }

        for (const field of previousFields) {
            if (!currentByName.has(field.name)) details.push(`Removed field ${fieldPath(field.name)} (${field.type}).`);
        }
        return details;
    }

    private compareSerializationAnnotations(current: string[], previous: string[], subject: string): string[] {
        const details: string[] = [];
        const currentValues = new Set(current);
        const previousValues = new Set(previous);
        for (const value of currentValues) {
            if (!previousValues.has(value)) details.push(`Added ${value} to ${subject} serialization.`);
        }
        for (const value of previousValues) {
            if (!currentValues.has(value)) details.push(`Removed ${value} from ${subject} serialization.`);
        }
        return details;
    }

    private comparePackets(
        currentPackets: ProtocolPacketDocument[],
        previousPackets: ProtocolPacketDocument[]
    ): ProtocolChangeSet {
        const currentByTitle = new Map(currentPackets.map(packet => [packet.title, packet]));
        const previousByTitle = new Map(previousPackets.map(packet => [packet.title, packet]));
        const added: ProtocolChangeItem[] = [];
        const changed: ProtocolChangeItem[] = [];
        const removed: ProtocolChangeItem[] = [];

        for (const packet of currentPackets) {
            const previous = previousByTitle.get(packet.title);
            if (!previous) {
                added.push({ details: [`Packet ID ${packet.id}.`], slug: packet.slug, title: packet.title });
                continue;
            }
            const details = this.compareFields(packet.fields, previous.fields);
            if (packet.id !== previous.id) details.unshift(`Changed packet ID from ${previous.id} to ${packet.id}.`);
            if (details.length > 0) changed.push({ details, slug: packet.slug, title: packet.title });
        }
        for (const packet of previousPackets) {
            if (!currentByTitle.has(packet.title)) {
                removed.push({ details: [`Packet ID ${packet.id}.`], slug: packet.slug, title: packet.title });
            }
        }
        return this.sortChangeSet({ added, changed, removed });
    }

    private compareTypes(
        currentTypes: ProtocolTypeDocument[],
        previousTypes: ProtocolTypeDocument[]
    ): ProtocolChangeSet {
        const currentByTitle = new Map(currentTypes.map(type => [type.title, type]));
        const previousByTitle = new Map(previousTypes.map(type => [type.title, type]));
        const added: ProtocolChangeItem[] = [];
        const changed: ProtocolChangeItem[] = [];
        const removed: ProtocolChangeItem[] = [];

        for (const type of currentTypes) {
            const previous = previousByTitle.get(type.title);
            if (!previous) {
                const details = [`${type.category} type.`];
                if (type.category === 'enum') {
                    details.push(...type.enumValues.map(value => `Added enum value ${value}.`));
                }
                added.push({ details, slug: type.slug, title: type.title });
                continue;
            }
            const details = this.compareFields(type.fields, previous.fields);
            if (type.category !== previous.category) {
                details.unshift(`Changed category from ${previous.category} to ${type.category}.`);
            }
            const currentValues = new Set(type.enumValues);
            const previousValues = new Set(previous.enumValues);
            for (const value of currentValues) {
                if (!previousValues.has(value)) details.push(`Added enum value ${value}.`);
            }
            for (const value of previousValues) {
                if (!currentValues.has(value)) details.push(`Removed enum value ${value}.`);
            }
            details.push(...this.compareSerializationAnnotations(type.serialization, previous.serialization, 'type'));
            if (details.length > 0) changed.push({ details, slug: type.slug, title: type.title });
        }
        for (const type of previousTypes) {
            if (!currentByTitle.has(type.title)) {
                removed.push({ details: [`${type.category} type.`], slug: type.slug, title: type.title });
            }
        }
        return this.sortChangeSet({ added, changed, removed });
    }

    private sortChangeSet(changeSet: ProtocolChangeSet): ProtocolChangeSet {
        const byTitle = (left: ProtocolChangeItem, right: ProtocolChangeItem) => left.title.localeCompare(right.title);
        changeSet.added.sort(byTitle);
        changeSet.changed.sort(byTitle);
        changeSet.removed.sort(byTitle);
        return changeSet;
    }

    private readGitProtocolSchemas(
        repositoryRoot: string,
        protocolDirectory: string,
        tag: string
    ): Record<string, MinecraftProtocolSchemaObject> {
        const pathOutput = execFileSync(
            'git',
            ['-C', repositoryRoot, 'ls-tree', '-r', '-z', '--name-only', tag, '--', protocolDirectory],
            { maxBuffer: 16 * 1024 * 1024 }
        );
        const paths = pathOutput
            .toString('utf-8')
            .split('\0')
            .filter(filePath => filePath.endsWith('.json'));
        if (paths.length === 0) return {};

        const references = paths.map(filePath => `${tag}:${filePath}`).join('\n') + '\n';
        const batchOutput = execFileSync('git', ['-C', repositoryRoot, 'cat-file', '--batch'], {
            input: references,
            maxBuffer: 128 * 1024 * 1024,
        });
        const schemas: Record<string, MinecraftProtocolSchemaObject> = {};
        let offset = 0;
        for (const filePath of paths) {
            const headerEnd = batchOutput.indexOf(0x0a, offset);
            if (headerEnd < 0) throw new Error(`Invalid git cat-file output for ${tag}.`);
            const header = batchOutput.subarray(offset, headerEnd).toString('utf-8');
            const size = Number(header.split(' ').at(-1));
            if (!Number.isFinite(size)) throw new Error(`Unable to read ${filePath} from ${tag}.`);
            const contentStart = headerEnd + 1;
            const contentEnd = contentStart + size;
            schemas[path.resolve(repositoryRoot, filePath)] = JSON.parse(
                batchOutput.subarray(contentStart, contentEnd).toString('utf-8')
            ) as MinecraftProtocolSchemaObject;
            offset = contentEnd + 1;
        }
        return schemas;
    }

    private createChangelog(context: GeneratorContext): ProtocolChangelogRelease[] {
        try {
            const repositoryRoot = execFileSync('git', ['-C', context.inputDirectory, 'rev-parse', '--show-toplevel'], {
                encoding: 'utf-8',
            }).trim();
            const tagOutput = execFileSync(
                'git',
                [
                    '-C',
                    repositoryRoot,
                    'for-each-ref',
                    '--format=%(refname:short)%09%(creatordate:short)',
                    'refs/tags/release/',
                ],
                { encoding: 'utf-8' }
            );
            const versions = tagOutput
                .split(/\r?\n/)
                .map(line => {
                    const [tag, releaseDate] = line.split('\t');
                    return { releaseDate, tag, version: tag.replace(/^release\//, '') };
                })
                .filter(entry => entry.tag && semver.valid(entry.version))
                .sort((left, right) => semver.rcompare(left.version, right.version))
                .slice(0, CHANGELOG_RELEASE_COUNT + 1);
            if (versions.length < 2) return [];

            const protocolDirectory = path
                .relative(repositoryRoot, path.join(context.inputDirectory, 'json_schemas', 'protocol'))
                .split(path.sep)
                .join('/');
            const snapshots: ProtocolReleaseSnapshot[] = [];
            for (const entry of versions) {
                const schemas = this.readGitProtocolSchemas(repositoryRoot, protocolDirectory, entry.tag);
                if (Object.keys(schemas).length === 0) continue;
                const firstSchema = Object.values(schemas)[0];
                const release = new MinecraftRelease(firstSchema['x-minecraft-version'] ?? entry.version);
                release.protocol_schemas = schemas;
                snapshots.push({
                    metadata: this.createReleaseMetadata(release),
                    releaseDate: entry.releaseDate,
                    version: entry.version,
                });
            }

            const changelog: ProtocolChangelogRelease[] = [];
            for (let index = 0; index < Math.min(CHANGELOG_RELEASE_COUNT, snapshots.length - 1); index++) {
                const current = snapshots[index];
                const previous = snapshots[index + 1];
                const packets = this.comparePackets(current.metadata.packets, previous.metadata.packets);
                const types = this.compareTypes(current.metadata.types, previous.metadata.types);
                const changeCount = (changes: ProtocolChangeSet) =>
                    changes.added.length + changes.changed.length + changes.removed.length;
                const totalChanges = changeCount(packets) + changeCount(types);
                changelog.push({
                    minecraftVersion: current.metadata.minecraftVersion,
                    packets,
                    previousProtocolVersion: previous.metadata.protocolVersion,
                    previousVersion: previous.version,
                    protocolVersion: current.metadata.protocolVersion,
                    protocolVersionShouldHaveChanged:
                        totalChanges > 0 && current.metadata.protocolVersion === previous.metadata.protocolVersion,
                    releaseDate: current.releaseDate,
                    totalChanges,
                    types,
                    version: current.version,
                });
            }
            return changelog;
        } catch (error) {
            Logger.warn(`Unable to generate protocol changelog: ${String(error)}`);
            return [];
        }
    }

    private createReleaseMetadata(release: MinecraftRelease): Omit<ProtocolMetadataDocument, 'changelog'> {
        this.indexSchemas(release.protocol_schemas);
        const packetPayloadSlugs = this.packetPayloadSlugs();
        const packets = this.createPackets();
        const types = this.createTypes(packetPayloadSlugs);
        this.addObservedWireFormats(packets, types);
        this.addIncludeHierarchy(packets, types);
        const firstSchema = Object.values(release.protocol_schemas)[0];
        const protocolVersion: unknown = firstSchema?.['x-protocol-version'];
        return {
            minecraftVersion: release.minecraft_version || firstSchema?.['x-minecraft-version'] || 'unknown',
            packets,
            primitives: this.createPrimitives(packets, types),
            protocolVersion: protocolVersion === undefined ? 'unknown' : String(protocolVersion),
            types,
        };
    }

    async generateFiles(
        context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0 || Object.keys(releases[0].protocol_schemas).length === 0) {
            Logger.warn(`No protocol schemas found, '${this.name}' generation not possible.`);
            return;
        }

        const { 'protocol-astro': templates } = context.getTemplates(...this.templates);
        const writes = PROJECT_FILES.map(async projectFile => {
            const outputPath = path.join(outputDirectory, projectFile);
            await fs.mkdir(path.dirname(outputPath), { recursive: true });
            await fs.writeFile(outputPath, templates.readFileAsString(projectFile), 'utf-8');
        });
        const metadataPath = path.join(outputDirectory, 'src', 'data', 'protocol.json');
        await fs.mkdir(path.dirname(metadataPath), { recursive: true });
        const metadata: ProtocolMetadataDocument = {
            ...this.createReleaseMetadata(releases[0]),
            changelog: this.createChangelog(context),
        };
        writes.push(fs.writeFile(metadataPath, JSON.stringify(metadata, undefined, 2) + '\n', 'utf-8'));
        await Promise.all(writes);
    }

    readonly id: string = 'protocol-astro';
    readonly name: string = 'Protocol Astro Generator';
    readonly outputDirectoryName: string = 'protocol-astro';
    readonly templates: string[] = ['protocol-astro'];
}
