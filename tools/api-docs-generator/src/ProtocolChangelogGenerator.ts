// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import path from 'path';

import { MinecraftRelease } from './MinecraftRelease';
import { MinecraftProtocolSchemaObject } from './modules/MinecraftSchemaObject';

export type ProtocolTypeCategory = 'array' | 'enum' | 'object' | 'scalar' | 'union' | 'other';

export interface ProtocolVariant {
    index: number;
    target?: string;
    title: string;
    type: string;
}

export interface ProtocolField {
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

export interface ProtocolUse {
    packetId?: number;
    packetSlug: string;
    packetTitle: string;
    path: string[];
}

export interface ProtocolWireFormat {
    serialization: string[];
    type: string;
}

export interface ProtocolTypeDocument {
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

export interface ProtocolPacketDocument {
    description: string;
    details: string;
    fields: ProtocolField[];
    id: number;
    slug: string;
    title: string;
}

export interface ProtocolPrimitiveDocument {
    category: 'Boolean' | 'Floating point' | 'Signed integer' | 'Text' | 'Unsigned integer';
    encoding: string;
    size: string;
    slug: string;
    title: string;
}

export interface ProtocolChangeItem {
    changes: ProtocolChange[];
    slug: string;
    title: string;
}

export interface ProtocolChange {
    addedType?: ProtocolTypeChangeContext;
    changedType?: ProtocolTypeChangeContext;
    fieldAdded?: ProtocolFieldAdded;
    fieldEnumValueAdded?: ProtocolFieldEnumValueChange;
    fieldEnumValueOrdinalChanged?: ProtocolFieldEnumValueOrdinalChange;
    fieldEnumValueRemoved?: ProtocolFieldEnumValueChange;
    fieldOrdinalChanged?: ProtocolFieldOrdinalChange;
    fieldRemoved?: ProtocolFieldRemoved;
    fieldRequiredChanged?: ProtocolFieldRequiredChange;
    fieldSerializationOptionAdded?: ProtocolFieldSerializationOptionChange;
    fieldSerializationOptionRemoved?: ProtocolFieldSerializationOptionChange;
    fieldTypeChanged?: ProtocolFieldTypeChange;
    fieldVariantsChanged?: ProtocolFieldVariantsChange;
    removedType?: ProtocolTypeChangeContext;
    typeAdded?: ProtocolTypeAddedOrRemoved;
    typeCategoryChanged?: ProtocolTypeCategoryChange;
    typeEnumValueAdded?: ProtocolTypeEnumValueChange;
    typeEnumValueOrdinalChanged?: ProtocolTypeEnumValueOrdinalChange;
    typeEnumValueRemoved?: ProtocolTypeEnumValueChange;
    typeRemoved?: ProtocolTypeAddedOrRemoved;
    typeSerializationOptionAdded?: ProtocolTypeSerializationOptionChange;
    typeSerializationOptionRemoved?: ProtocolTypeSerializationOptionChange;
}

export interface ProtocolFieldChangeContext {
    path: string;
    target?: string;
}

export interface ProtocolFieldAdded extends ProtocolFieldChangeContext {
    type: string;
}

export interface ProtocolFieldEnumValueChange extends ProtocolFieldChangeContext {
    ordinal: number;
    value: string;
}

export interface ProtocolFieldEnumValueOrdinalChange
    extends ProtocolTypeEnumValueOrdinalChange,
        ProtocolFieldChangeContext {}

export interface ProtocolFieldOrdinalChange extends ProtocolFieldChangeContext {
    ordinal?: number;
    ordinalAssigned: boolean;
    previousOrdinal?: number;
    previousOrdinalAssigned: boolean;
}

export interface ProtocolFieldRemoved extends ProtocolFieldChangeContext {
    type: string;
}

export interface ProtocolFieldRequiredChange extends ProtocolFieldChangeContext {
    required: boolean;
}

export interface ProtocolFieldSerializationOptionChange extends ProtocolFieldChangeContext {
    option: string;
}

export interface ProtocolFieldTypeChange extends ProtocolFieldChangeContext {
    previousTarget?: string;
    previousType: string;
    type: string;
}

export interface ProtocolFieldVariantsChange extends ProtocolFieldChangeContext {}

export interface ProtocolTypeAddedOrRemoved {
    category: ProtocolTypeCategory;
}

export interface ProtocolTypeCategoryChange {
    category: ProtocolTypeCategory;
    previousCategory: ProtocolTypeCategory;
}

export interface ProtocolTypeChangeContext {
    slug?: string;
    title: string;
}

export interface ProtocolTypeEnumValueChange {
    ordinal: number;
    value: string;
}

export interface ProtocolTypeEnumValueOrdinalChange {
    ordinal: number;
    previousOrdinal: number;
    value: string;
}

export interface ProtocolTypeSerializationOptionChange {
    option: string;
}

export interface ProtocolPacketChangeItem extends ProtocolChangeItem {
    packetId: number;
    previousPacketId?: number;
}

export interface ProtocolChangeSet<T extends ProtocolChangeItem = ProtocolChangeItem> {
    added: T[];
    changed: T[];
    removed: T[];
}

export interface ProtocolChangelogRelease {
    minecraftVersion: string;
    packets: ProtocolChangeSet<ProtocolPacketChangeItem>;
    previousProtocolVersion: string;
    previousVersion: string;
    protocolVersion: string;
    releaseDate: string;
    totalChanges: number;
    versionDidChange: boolean;
    version: string;
}

export interface ProtocolReleaseMetadata {
    minecraftVersion: string;
    packets: ProtocolPacketDocument[];
    primitives: ProtocolPrimitiveDocument[];
    protocolVersion: string;
    types: ProtocolTypeDocument[];
}

export interface ProtocolMetadataDocument extends ProtocolReleaseMetadata {
    changelog: ProtocolChangelogRelease[];
}

export interface ProtocolReleaseSnapshot {
    release: MinecraftRelease;
    releaseDate: string;
    version: string;
}

interface NormalizedProtocolReleaseSnapshot extends Omit<ProtocolReleaseSnapshot, 'release'> {
    metadata: ProtocolReleaseMetadata;
}

interface RegisteredSchema {
    category: ProtocolTypeCategory | 'packet';
    packetId: number;
    schema: MinecraftProtocolSchemaObject;
    slug: string;
    sourcePath: string;
    title: string;
}

type ProtocolPrimitiveDefinition = Omit<ProtocolPrimitiveDocument, 'slug' | 'title'>;

const PRIMITIVE_DEFINITIONS: Record<string, ProtocolPrimitiveDefinition> = {
    boolean: {
        category: 'Boolean',
        encoding: 'Written as one byte: 0 for false and 1 for true. Readers accept any nonzero byte as true.',
        size: '1 byte',
    },
    int8: {
        category: 'Signed integer',
        encoding: "Raw two's-complement signed integer bytes.",
        size: '1 byte',
    },
    int16: {
        category: 'Signed integer',
        encoding: "Raw two's-complement signed integer bytes in native byte order.",
        size: '2 bytes',
    },
    int32: {
        category: 'Signed integer',
        encoding: "Raw two's-complement signed integer bytes in native byte order. Big Endian reverses the byte order.",
        size: '4 bytes',
    },
    int64: {
        category: 'Signed integer',
        encoding: "Raw two's-complement signed integer bytes in native byte order.",
        size: '8 bytes',
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
        encoding: 'Raw unsigned integer bytes.',
        size: '1 byte',
    },
    uint16: {
        category: 'Unsigned integer',
        encoding: 'Raw unsigned integer bytes in native byte order.',
        size: '2 bytes',
    },
    uint32: {
        category: 'Unsigned integer',
        encoding: 'Raw unsigned integer bytes in native byte order.',
        size: '4 bytes',
    },
    uint64: {
        category: 'Unsigned integer',
        encoding: 'Raw unsigned integer bytes in native byte order.',
        size: '8 bytes',
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
        encoding: 'Raw 4-byte floating-point representation in native byte order.',
        size: '4 bytes',
    },
    double: {
        category: 'Floating point',
        encoding: 'Raw 8-byte floating-point representation in native byte order.',
        size: '8 bytes',
    },
    string: {
        category: 'Text',
        encoding:
            'Raw string bytes prefixed by their byte length as a varuint32. The stream does not transcode or validate the byte encoding.',
        size: 'Variable',
    },
};

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

/**
 * Compares normalized protocol release metadata and produces release changelogs.
 * Snapshots must be ordered from newest to oldest.
 */
export class ProtocolChangelogGenerator {
    private readonly schemasByKey = new Map<string, RegisteredSchema>();
    private readonly schemasByTitle = new Map<string, RegisteredSchema>();
    private readonly usedPacketSlugs = new Set<string>();
    private readonly usedTypeSlugs = new Set<string>();

    constructor(private readonly releaseCount = Number.POSITIVE_INFINITY) {}

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
        if (schema.type === 'array' && schema.items?.$ref) return this.resolveReference(schema.items.$ref, sourcePath);
        return schema.title ? this.schemasByTitle.get(schema.title) : undefined;
    }

    private underlyingType(schema: MinecraftProtocolSchemaObject, sourcePath: string): string {
        const options = serializationOptions(schema);
        if (schema['x-underlying-type']) {
            const underlyingType = schema['x-underlying-type'];
            if (schema.enum && !options.includes('Enum-as-Value')) return schema.title ?? schema.type ?? 'enum';
            const supportsCompression = ['int32', 'int64', 'uint32', 'uint64'].includes(underlyingType);
            return options.includes('Compression') && supportsCompression ? `var${underlyingType}` : underlyingType;
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
            varint32: 5,
            varint64: 10,
            varuint32: 5,
            varuint64: 10,
        };
        const fixedSize = fixedSizes[normalized];
        if (fixedSize) return { bytes: fixedSize, label: `${fixedSize} byte${fixedSize === 1 ? '' : 's'}` };
        const variableMaximum = variableMaximums[normalized];
        if (variableMaximum) return { bytes: variableMaximum, label: `variable (up to ${variableMaximum} bytes)` };
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
                const variantSchemas = field.oneOf ?? field.items?.oneOf;
                const variants = variantSchemas?.map((variant, index) => {
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
        for (const type of types) type.wireFormats.sort((left, right) => left.type.localeCompare(right.type));
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
                type.uses.push({
                    ...(packet.id >= 0 ? { packetId: packet.id } : {}),
                    packetSlug: packet.slug,
                    packetTitle: packet.title,
                    path: usePath,
                });
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

    generateReleaseMetadata(release: MinecraftRelease): ProtocolReleaseMetadata {
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

    private compareFields(
        currentFields: ProtocolField[],
        previousFields: ProtocolField[],
        parentPath = ''
    ): ProtocolChange[] {
        const changes: ProtocolChange[] = [];
        const currentByName = new Map(currentFields.map(field => [field.name, field]));
        const previousByName = new Map(previousFields.map(field => [field.name, field]));
        const fieldPath = (name: string) => (parentPath ? `${parentPath}.${name}` : name);

        for (const field of currentFields) {
            const previous = previousByName.get(field.name);
            const pathName = fieldPath(field.name);
            if (!previous) {
                changes.push({
                    fieldAdded: { path: pathName, ...(field.target ? { target: field.target } : {}), type: field.type },
                });
                continue;
            }
            if (field.type !== previous.type) {
                changes.push({
                    fieldTypeChanged: {
                        path: pathName,
                        ...(previous.target ? { previousTarget: previous.target } : {}),
                        previousType: previous.type,
                        ...(field.target ? { target: field.target } : {}),
                        type: field.type,
                    },
                });
            }
            if (field.required !== previous.required) {
                changes.push({
                    fieldRequiredChanged: {
                        path: pathName,
                        required: field.required,
                        ...(field.target ? { target: field.target } : {}),
                    },
                });
            }
            if (field.ordinal !== previous.ordinal) {
                changes.push({
                    fieldOrdinalChanged: {
                        ordinal: field.ordinal,
                        ordinalAssigned: field.ordinal !== undefined,
                        path: pathName,
                        previousOrdinal: previous.ordinal,
                        previousOrdinalAssigned: previous.ordinal !== undefined,
                        ...(field.target ? { target: field.target } : {}),
                    },
                });
            }
            changes.push(
                ...this.compareFieldSerializationOptions(
                    field.serialization,
                    previous.serialization,
                    pathName,
                    field.target,
                    previous.target
                )
            );
            if (!field.target && !previous.target) {
                const currentEnumValues = field.enumValues ?? [];
                const enumChanges = this.compareEnumValues(currentEnumValues, previous.enumValues ?? []);
                for (const change of enumChanges.added) {
                    changes.push({ fieldEnumValueAdded: { path: pathName, ...change } });
                }
                for (const change of enumChanges.ordinalChanged) {
                    changes.push({ fieldEnumValueOrdinalChanged: { path: pathName, ...change } });
                }
                for (const change of enumChanges.removed) {
                    changes.push({ fieldEnumValueRemoved: { path: pathName, ...change } });
                }
            }

            const variantSignature = (variant: ProtocolVariant) =>
                `${variant.index}\0${variant.title}\0${variant.type}\0${variant.target ?? ''}`;
            if (
                (field.variants ?? []).map(variantSignature).join('\x01') !==
                (previous.variants ?? []).map(variantSignature).join('\x01')
            ) {
                changes.push({
                    fieldVariantsChanged: {
                        path: pathName,
                        ...(field.target ? { target: field.target } : {}),
                    },
                });
            }
            changes.push(...this.compareFields(field.children ?? [], previous.children ?? [], pathName));
        }

        for (const field of previousFields) {
            if (!currentByName.has(field.name)) {
                changes.push({
                    fieldRemoved: {
                        path: fieldPath(field.name),
                        ...(field.target ? { target: field.target } : {}),
                        type: field.type,
                    },
                });
            }
        }
        return changes;
    }

    private compareEnumValues(current: string[], previous: string[]) {
        const currentOrdinals = new Map(current.map((value, ordinal) => [value, ordinal]));
        const previousOrdinals = new Map(previous.map((value, ordinal) => [value, ordinal]));
        return {
            added: current.flatMap((value, ordinal) => (previousOrdinals.has(value) ? [] : [{ ordinal, value }])),
            ordinalChanged: current.flatMap((value, ordinal) => {
                const previousOrdinal = previousOrdinals.get(value);
                return previousOrdinal !== undefined && previousOrdinal !== ordinal
                    ? [{ ordinal, previousOrdinal, value }]
                    : [];
            }),
            removed: previous.flatMap((value, ordinal) => (currentOrdinals.has(value) ? [] : [{ ordinal, value }])),
        };
    }

    private compareFieldSerializationOptions(
        current: string[],
        previous: string[],
        path: string,
        currentTarget?: string,
        previousTarget?: string
    ): ProtocolChange[] {
        const changes: ProtocolChange[] = [];
        const currentValues = new Set(current);
        const previousValues = new Set(previous);
        for (const value of currentValues) {
            if (!previousValues.has(value)) {
                changes.push({
                    fieldSerializationOptionAdded: {
                        option: value,
                        path,
                        ...(currentTarget ? { target: currentTarget } : {}),
                    },
                });
            }
        }
        for (const value of previousValues) {
            if (!currentValues.has(value)) {
                changes.push({
                    fieldSerializationOptionRemoved: {
                        option: value,
                        path,
                        ...(previousTarget ? { target: previousTarget } : {}),
                    },
                });
            }
        }
        return changes;
    }

    private compareTypeSerializationOptions(current: string[], previous: string[]): ProtocolChange[] {
        const changes: ProtocolChange[] = [];
        const currentValues = new Set(current);
        const previousValues = new Set(previous);
        for (const value of currentValues) {
            if (!previousValues.has(value)) {
                changes.push({ typeSerializationOptionAdded: { option: value } });
            }
        }
        for (const value of previousValues) {
            if (!currentValues.has(value)) {
                changes.push({ typeSerializationOptionRemoved: { option: value } });
            }
        }
        return changes;
    }

    private comparePackets(
        currentPackets: ProtocolPacketDocument[],
        previousPackets: ProtocolPacketDocument[]
    ): ProtocolChangeSet<ProtocolPacketChangeItem> {
        const currentByTitle = new Map(currentPackets.map(packet => [packet.title, packet]));
        const previousByTitle = new Map(previousPackets.map(packet => [packet.title, packet]));
        const added: ProtocolPacketChangeItem[] = [];
        const changed: ProtocolPacketChangeItem[] = [];
        const removed: ProtocolPacketChangeItem[] = [];

        for (const packet of currentPackets) {
            const previous = previousByTitle.get(packet.title);
            if (!previous) {
                added.push({ changes: [], packetId: packet.id, slug: packet.slug, title: packet.title });
                continue;
            }
            const changes = this.compareFields(packet.fields, previous.fields);
            const previousPacketId = packet.id === previous.id ? undefined : previous.id;
            if (changes.length > 0 || previousPacketId !== undefined) {
                changed.push({
                    changes,
                    packetId: packet.id,
                    previousPacketId,
                    slug: packet.slug,
                    title: packet.title,
                });
            }
        }
        for (const packet of previousPackets) {
            if (!currentByTitle.has(packet.title)) {
                removed.push({ changes: [], packetId: packet.id, slug: packet.slug, title: packet.title });
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
                const changes: ProtocolChange[] = [{ typeAdded: { category: type.category } }];
                changes.push(...type.enumValues.map((value, ordinal) => ({ typeEnumValueAdded: { ordinal, value } })));
                added.push({ changes, slug: type.slug, title: type.title });
                continue;
            }
            const changes = this.compareFields(type.fields, previous.fields);
            if (type.category !== previous.category) {
                changes.unshift({
                    typeCategoryChanged: { category: type.category, previousCategory: previous.category },
                });
            }
            const enumChanges = this.compareEnumValues(type.enumValues, previous.enumValues);
            for (const change of enumChanges.added) {
                changes.push({ typeEnumValueAdded: change });
            }
            for (const change of enumChanges.ordinalChanged) {
                changes.push({ typeEnumValueOrdinalChanged: change });
            }
            for (const change of enumChanges.removed) {
                changes.push({ typeEnumValueRemoved: change });
            }
            changes.push(...this.compareTypeSerializationOptions(type.serialization, previous.serialization));
            if (changes.length > 0) changed.push({ changes, slug: type.slug, title: type.title });
        }
        for (const type of previousTypes) {
            if (!currentByTitle.has(type.title)) {
                removed.push({
                    changes: [{ typeRemoved: { category: type.category } }],
                    slug: type.slug,
                    title: type.title,
                });
            }
        }
        return this.sortChangeSet({ added, changed, removed });
    }

    // Bake changes into the packet types to make it clear what is changing
    private addTypeChangesToPackets(
        packets: ProtocolChangeSet<ProtocolPacketChangeItem>,
        typeChanges: ProtocolChangeSet,
        currentTypes: ProtocolTypeDocument[],
        previousTypes: ProtocolTypeDocument[]
    ): void {
        const currentTypesByTitle = new Map(currentTypes.map(type => [type.title, type]));
        const previousTypesByTitle = new Map(previousTypes.map(type => [type.title, type]));
        const addedOrRemovedPacketTitles = new Set([...packets.added, ...packets.removed].map(packet => packet.title));
        const packetChangesByTitle = new Map(packets.changed.map(packet => [packet.title, packet]));
        const addChanges = (
            typeChangesToAdd: ProtocolChangeItem[],
            context: 'addedType' | 'changedType' | 'removedType'
        ): void => {
            for (const typeChange of typeChangesToAdd) {
                const currentType = currentTypesByTitle.get(typeChange.title);
                const previousType = previousTypesByTitle.get(typeChange.title);
                const contextType = context === 'removedType' ? previousType : currentType;
                const uses = [...(previousType?.uses ?? []), ...(currentType?.uses ?? [])];
                const affectedPackets = new Map(uses.map(use => [use.packetTitle, use]));

                for (const use of affectedPackets.values()) {
                    if (addedOrRemovedPacketTitles.has(use.packetTitle)) continue;

                    let packetChange = packetChangesByTitle.get(use.packetTitle);
                    if (!packetChange) {
                        packetChange = {
                            changes: [],
                            packetId: use.packetId ?? -1,
                            slug: use.packetSlug,
                            title: use.packetTitle,
                        };
                        packets.changed.push(packetChange);
                        packetChangesByTitle.set(use.packetTitle, packetChange);
                    }

                    for (const change of typeChange.changes) {
                        packetChange.changes.push({
                            ...change,
                            [context]: {
                                ...(contextType ? { slug: contextType.slug } : {}),
                                title: typeChange.title,
                            },
                        });
                    }
                }
            }
        };

        addChanges(typeChanges.added, 'addedType');
        addChanges(typeChanges.changed, 'changedType');
        addChanges(typeChanges.removed, 'removedType');
        this.sortChangeSet(packets);
    }

    private sortChangeSet<T extends ProtocolChangeItem>(changeSet: ProtocolChangeSet<T>): ProtocolChangeSet<T> {
        const byTitle = (left: T, right: T) => left.title.localeCompare(right.title);
        changeSet.added.sort(byTitle);
        changeSet.removed.sort(byTitle);
        changeSet.changed.sort(byTitle);
        return changeSet;
    }

    generateChangelogs(releases: Array<MinecraftRelease | ProtocolReleaseSnapshot>): ProtocolChangelogRelease[] {
        const snapshots: NormalizedProtocolReleaseSnapshot[] = releases.map(value => {
            const snapshot: ProtocolReleaseSnapshot =
                value instanceof MinecraftRelease
                    ? { release: value, releaseDate: '', version: value.minecraft_version }
                    : value;
            return {
                metadata: this.generateReleaseMetadata(snapshot.release),
                releaseDate: snapshot.releaseDate,
                version: snapshot.version,
            };
        });
        const changelog: ProtocolChangelogRelease[] = [];
        const releaseCount = Math.min(this.releaseCount, snapshots.length - 1);
        for (let index = 0; index < releaseCount; index++) {
            const current = snapshots[index];
            const previous = snapshots[index + 1];
            const packets = this.comparePackets(current.metadata.packets, previous.metadata.packets);
            const types = this.compareTypes(current.metadata.types, previous.metadata.types);
            this.addTypeChangesToPackets(packets, types, current.metadata.types, previous.metadata.types);
            const changeCount = (changes: ProtocolChangeSet) =>
                changes.added.length + changes.changed.length + changes.removed.length;
            const totalChanges = changeCount(packets);
            changelog.push({
                minecraftVersion: current.metadata.minecraftVersion,
                packets,
                previousProtocolVersion: previous.metadata.protocolVersion,
                previousVersion: previous.version,
                protocolVersion: current.metadata.protocolVersion,
                releaseDate: current.releaseDate,
                totalChanges,
                versionDidChange: current.metadata.protocolVersion !== previous.metadata.protocolVersion,
                version: current.version,
            });
        }
        return changelog;
    }
}
