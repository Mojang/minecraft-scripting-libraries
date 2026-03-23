// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { promises as fs } from 'fs';
import path from 'path';

import {
    GeneratorContext,
    Logger,
    MarkupGenerator,
    MinecraftRelease,
    MinecraftProtocolSchemaObject,
} from '@minecraft/api-docs-generator';

interface PacketInfo {
    title: string;
    description: string;
    filename: string;
    id: number;
}

type Definitions = Record<string, MinecraftProtocolSchemaObject>;
type EnumCache = Record<string, string[]>;

const HTML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, c => HTML_ESCAPE_MAP[c]);
}

export class ProtocolHTMLGenerator implements MarkupGenerator {
    private getUnderlyingType(schema: MinecraftProtocolSchemaObject, definitions: Definitions): string {
        const serializationOptions = schema['x-serialization-options'];

        if (schema['x-underlying-type']) {
            const underlyingType = schema['x-underlying-type'];
            if (schema.enum) {
                if (serializationOptions && serializationOptions.includes('Enum-as-Value')) {
                    if (serializationOptions.includes('Compression')) {
                        return 'var' + underlyingType;
                    }
                    return underlyingType;
                }
                return schema.type ?? 'unknown';
            }
            if (serializationOptions?.includes('Compression')) {
                return 'var' + underlyingType;
            }
            return underlyingType;
        }

        if (schema.type === 'array') {
            if (schema.items) {
                if (schema.items.$ref) {
                    const refId = schema.items.$ref.split('/').pop() ?? '';
                    if (definitions && refId in definitions) {
                        const refTitle = definitions[refId].title ?? refId;
                        return `array&lt;${refTitle}&gt;`;
                    }
                    return `array&lt;${refId}&gt;`;
                } else if (schema.items['x-underlying-type']) {
                    return `array&lt;${schema.items['x-underlying-type']}&gt;`;
                } else {
                    const itemType = schema.items.type ?? 'unknown';
                    return `array&lt;${itemType}&gt;`;
                }
            }
        }

        if (schema.oneOf) {
            return 'oneOf';
        }

        if (schema.$ref) {
            const refId = schema.$ref.split('/').pop() ?? '';
            if (definitions && refId in definitions) {
                return definitions[refId].title ?? refId;
            }
            return refId;
        }

        if (schema.enum) {
            return schema.title ?? 'enum';
        }

        return schema.type ?? 'unknown';
    }

    private generateEnumTable(enumValues: string[], indentLevel: number): string {
        if (!enumValues || enumValues.length === 0) {
            return '';
        }

        const marginLeft = (indentLevel + 1) * 20;
        return `<div style="margin-left: ${marginLeft}px; margin-top: 5px; margin-bottom: 5px;">
    <strong>Enum Values:</strong>
    <table border="1" cellpadding="3" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 760px; font-size: 12px;">
        <thead>
            <tr style="background-color: #e8e8e8;">
                <th style="width: 40px;">Index</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            ${enumValues
                .map(
                    (value, idx) => `<tr>
            <td style="text-align: center;">${idx}</td>
            <td><code>${escapeHtml(value)}</code></td>
            </tr>`
                )
                .join('\n')}
        </tbody>
    </table>
</div>
`;
    }

    private generateOneOfTable(
        schema: MinecraftProtocolSchemaObject,
        indentLevel: number,
        definitions: Definitions,
        enumCache: EnumCache
    ): string {
        if (!schema.oneOf) {
            return '';
        }

        const controlValueType = schema['x-control-value-type'] ?? 'varuint32';
        const oneOfItems = schema.oneOf;
        const oneofTypeMembers: string[] = [];
        const oneOfMembersHtml: string[] = [];
        const expandedDefinitionsHtml: string[] = [];

        for (let idx = 0; idx < oneOfItems.length; idx++) {
            const oneOfItem = oneOfItems[idx];
            const underlyingType = this.getUnderlyingType(oneOfItem, definitions);
            oneofTypeMembers.push(underlyingType);

            const details: string[] = [];
            if (oneOfItem['x-underlying-type']) {
                details.push(`Underlying: ${oneOfItem['x-underlying-type']}`);
            }
            if (oneOfItem['x-serialization-options']) {
                details.push(`Serialization: ${oneOfItem['x-serialization-options']}`);
            }
            if (oneOfItem.title) {
                details.push(`Title: ${oneOfItem.title}`);
            }

            const detailsStr = details.length > 0 ? details.join(', ') : '-';

            oneOfMembersHtml.push(`<tr>
                <td>${idx}</td>
                <td><strong>${underlyingType}</strong></td>
                <td>${detailsStr}</td>
            </tr>`);

            if (oneOfItem.$ref) {
                const refId = oneOfItem.$ref.split('/').pop() ?? '';
                if (refId in definitions) {
                    const refSchema = definitions[refId];
                    const refTitle = refSchema.title ?? refId;

                    if (!refTitle.endsWith('Payload')) {
                        const nestedTable = this.generateNestedTable(
                            refSchema,
                            definitions,
                            enumCache,
                            '',
                            indentLevel + 2
                        );
                        if (nestedTable) {
                            expandedDefinitionsHtml.push(`<details style="margin-left: ${(indentLevel + 1) * 20}px; margin-top: 10px;">
                                <summary style="cursor: pointer; font-weight: bold; padding: 5px; background-color: #f0f0f0; border: 1px solid #ddd;"><strong>${refTitle} (Variant ${idx})</strong></summary>
                                ${nestedTable}
                            </details>`);
                        }
                    }
                }
            }
        }

        const oneofType = escapeHtml(`oneOf<${oneofTypeMembers.join(', ')}>`);
        const marginLeft = (indentLevel + 1) * 20;

        return `<div style="margin-left: ${marginLeft}px; margin-top: 0px; margin-bottom: 0px;">
    <strong>${oneofType}:</strong>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 760px; margin-top: 5px;">
        <thead>
            <tr style="background-color: #e8e8e8;">
                <th>Control Value [${controlValueType}]</th>
                <th>Type</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
            ${oneOfMembersHtml.join('\n')}
        </tbody>
    </table>
    ${expandedDefinitionsHtml.join('\n')}
</div>
`;
    }

    private getOrdinalIndex(schema: MinecraftProtocolSchemaObject): number {
        return schema['x-ordinal-index'] ?? 9999;
    }

    private generateNestedTable(
        schema: MinecraftProtocolSchemaObject,
        definitions: Definitions,
        enumCache: EnumCache,
        title: string,
        indentLevel: number = 0
    ): string {
        if (schema.type !== 'object') {
            return '';
        }

        const properties = schema.properties ?? {};
        const required = new Set<string>(schema.required ?? []);

        if (Object.keys(properties).length === 0) {
            return '';
        }

        const sortedProperties = Object.entries(properties).sort(
            ([, a], [, b]) => this.getOrdinalIndex(a) - this.getOrdinalIndex(b)
        );

        const html: string[] = [];
        const marginLeft = indentLevel * 20;

        html.push(`<div style="margin-left: ${marginLeft}px; margin-top: 10px;">`);
        if (title) {
            html.push(`<h3>${escapeHtml(title)}</h3>`);
        }

        html.push(`<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 800px;">
        <thead>
            <tr style="background-color: #f0f0f0;">
                <th>Field Name</th>
                <th>Type</th>
                <th>Field Index</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>`);

        for (const [fieldName, fieldSchema] of sortedProperties) {
            let underlyingType = this.getUnderlyingType(fieldSchema, definitions);
            const ordinal = this.getOrdinalIndex(fieldSchema);
            const description = escapeHtml(fieldSchema.description ?? '');
            const isRequired = required.has(fieldName);

            const displayFieldName = isRequired ? `${fieldName} (Required)` : fieldName;
            const ordinalDisplay = ordinal !== 9999 ? String(ordinal) : '';

            let enumHtml = '';
            let nestedHtml = '';
            let oneofHtml = '';

            if (fieldSchema.oneOf) {
                oneofHtml = this.generateOneOfTable(fieldSchema, 0, definitions, enumCache);
            } else if (fieldSchema.enum) {
                enumHtml = this.generateEnumTable(fieldSchema.enum, 0);
            } else if ((fieldSchema.title ?? '') in enumCache) {
                const enumTitle = fieldSchema.title;
                enumHtml = this.generateEnumTable(enumCache[enumTitle], 0);
            } else if (fieldSchema.$ref) {
                const refId = fieldSchema.$ref.split('/').pop() ?? '';
                if (refId in definitions) {
                    const refSchema = definitions[refId];
                    const refTitle = refSchema.title ?? refId;
                    underlyingType = refTitle;
                    if (!refTitle.endsWith('Payload')) {
                        nestedHtml = this.generateNestedTable(refSchema, definitions, enumCache, refTitle, 1);
                    }
                }
            } else if (fieldSchema.type === 'array') {
                if (fieldSchema.items) {
                    if (fieldSchema.items.$ref) {
                        const refId = fieldSchema.items.$ref.split('/').pop() ?? '';
                        if (refId in definitions) {
                            const refSchema = definitions[refId];
                            let refTitle = refSchema.title ?? refId;
                            if (fieldSchema['x-serialization-options']) {
                                refTitle += ` (${fieldSchema['x-serialization-options']})`;
                            }
                            if (!refTitle.endsWith('Payload')) {
                                nestedHtml = this.generateNestedTable(
                                    refSchema,
                                    definitions,
                                    enumCache,
                                    `${refTitle} (Array Item)`,
                                    1
                                );
                            }
                        }
                    }
                }
            }

            html.push('<tr>');
            if (enumHtml || nestedHtml || oneofHtml) {
                html.push(`<td rowspan="2"><strong>${escapeHtml(displayFieldName)}</strong></td>`);
            } else {
                html.push(`<td><strong>${escapeHtml(displayFieldName)}</strong></td>`);
            }
            html.push(`<td>${underlyingType}</td>
                <td>${ordinalDisplay}</td>
                <td>${description}</td>
            </tr>`);

            if (oneofHtml) {
                html.push(`<tr>
                    <td colspan="3" style="padding: 0;">${oneofHtml}</td>
                </tr>`);
            } else if (enumHtml) {
                html.push(`<tr>
                    <td colspan="3">${enumHtml}</td>
                </tr>`);
            } else if (nestedHtml) {
                html.push(`<tr>
                    <td colspan="3">${nestedHtml}</td>
                </tr>`);
            }
        }

        html.push(`</tbody>
    </table>
</div>`);
        return html.join('\n');
    }

    private static readonly PAGE_HTML_BEFORE_TITLE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>`;

    private static readonly PAGE_HTML_AFTER_TITLE = `</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 0;
        }
        h2 {
            color: #34495e;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        h4 {
            color: #666;
            margin-top: 15px;
            margin-bottom: 8px;
        }
        table {
            background-color: white;
            font-size: 14px;
            margin-bottom: 10px;
        }
        th {
            font-weight: bold;
            text-align: left;
            padding: 8px !important;
        }
        td {
            padding: 8px !important;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e8f4f8;
        }
        .description {
            color: #555;
            font-style: italic;
            margin: 10px 0 20px 0;
            padding: 10px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .packet-list {
            columns: 3;
            column-gap: 20px;
        }
        .packet-list li {
            margin-bottom: 8px;
            break-inside: avoid;
        }
        details {
            margin: 10px 0;
        }
        summary {
            cursor: pointer;
            font-weight: bold;
            padding: 8px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 4px;
            user-select: none;
        }
        summary:hover {
            background-color: #e8e8e8;
        }
        details[open] summary {
            background-color: #d4edff;
            border-color: #3498db;
            border-left: 4px solid #3498db;
        }
        @media (max-width: 900px) {
            .packet-list {
                columns: 2;
            }
        }
        @media (max-width: 600px) {
            .packet-list {
                columns: 1;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        `;

    private static readonly PAGE_HTML_SUFFIX = `
    </div>
</body>
</html>`;

    private getPageHtml(title: string, content: string, backLink: boolean = true): string {
        const backLinkHtml = backLink ? '<p><a href="index.html">← Back to Index</a></p>' : '';
        return (
            ProtocolHTMLGenerator.PAGE_HTML_BEFORE_TITLE +
            escapeHtml(title) +
            ProtocolHTMLGenerator.PAGE_HTML_AFTER_TITLE +
            backLinkHtml +
            '\n        ' +
            content +
            ProtocolHTMLGenerator.PAGE_HTML_SUFFIX
        );
    }

    private async generateIndexPage(packets: PacketInfo[], outputDirectory: string): Promise<void> {
        const indexHtml = `<h1>Game Protocol Documentation</h1>
    <p>Documentation for ${packets.length} protocol packets.</p>
    <h2>Packet List</h2>
    <ul class="packet-list">
        ${packets
            .map(
                value =>
                    `<li><a href="${value.filename}"><strong>${escapeHtml(value.title)}</strong></a><br><span style="color: #666; font-size: 0.9em;">${escapeHtml(
                        value.description.length > 100 ? value.description.substring(0, 100) + '...' : value.description
                    )}</span></li>`
            )
            .join('\n')}
    </ul>`;

        const indexPath = path.join(outputDirectory, 'index.html');
        await fs.writeFile(indexPath, this.getPageHtml('Game Protocol Documentation', indexHtml, false), 'utf-8');
    }

    private processSchema(
        data: MinecraftProtocolSchemaObject,
        key: string,
        enumCache: EnumCache
    ): { title: string; description: string; content: string; packetId: number } {
        try {
            let title = data.title ?? path.basename(key, '.json');
            const description = data.description ?? '';
            let extraDetails = '';
            const definitions: Definitions = data.definitions ?? {};
            const metaProperties = data['$metaProperties'] ?? {};

            if (title.endsWith('Payload')) {
                return { title: '', description: '', content: '', packetId: -1 };
            }

            let packetId = -1;
            if ('[cereal:packet]' in metaProperties) {
                packetId = (metaProperties['[cereal:packet]'] as number | undefined) ?? -1;
                title += ` (${packetId})`;

                const packetDetails = metaProperties['[cereal:packet_details]'];
                if (packetDetails) {
                    extraDetails = String(packetDetails);
                }
            }

            const html: string[] = [];
            html.push(`<h1>${escapeHtml(title)}</h1>`);

            if (description) {
                html.push(`<div class="description">${escapeHtml(description)}</div>`);
            }
            if (extraDetails) {
                html.push(`<div class="description">${escapeHtml(extraDetails)}</div>`);
            }

            const properties = data.properties ?? {};
            const propertyKeys = Object.keys(properties);

            if (
                data.type === 'object' &&
                propertyKeys.length === 1 &&
                'mPayload' in properties &&
                properties.mPayload.$ref
            ) {
                const refId = properties.mPayload.$ref.split('/').pop() ?? '';
                if (refId in definitions) {
                    const payloadSchema = definitions[refId];
                    const payloadTitle = payloadSchema.title ?? '';
                    if (payloadTitle.endsWith('Payload')) {
                        html.push(this.generateNestedTable(payloadSchema, definitions, enumCache, ''));
                    } else {
                        html.push(this.generateNestedTable(data, definitions, enumCache, ''));
                    }
                } else {
                    html.push(this.generateNestedTable(data, definitions, enumCache, ''));
                }
            } else if (data.type === 'object' && data.properties) {
                html.push(this.generateNestedTable(data, definitions, enumCache, ''));
            }

            return { title, description, content: html.join('\n'), packetId };
        } catch (e) {
            Logger.error(`Error processing schema '${key}': ${String(e)}`);
            return { title: '', description: '', content: '', packetId: -1 };
        }
    }

    async generateFiles(
        _context: GeneratorContext,
        releases: MinecraftRelease[],
        outputDirectory: string
    ): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }
        if (Object.keys(releases[0].protocol_schemas).length === 0) {
            Logger.warn(`No protocol schemas found, '${this.name}' generation not possible.`);
            return;
        }

        const enumCache: EnumCache = {};

        for (const [_, schema] of Object.entries(releases[0].protocol_schemas)) {
            const data = schema as unknown as MinecraftProtocolSchemaObject;
            if (!data.title) {
                continue;
            }
            if (data.enum) {
                enumCache[data.title] = data.enum;
            }
        }

        await fs.mkdir(outputDirectory, { recursive: true });

        const packetEntries = Object.entries(releases[0].protocol_schemas)
            .filter(([key]) => !path.basename(key).startsWith('enum_'))
            .sort(([a], [b]) => a.localeCompare(b));

        if (packetEntries.length === 0) {
            Logger.warn(`No packets found, '${this.name}' generation not possible.`);
            return;
        }

        const writePromises: Promise<void>[] = [];
        const packets: PacketInfo[] = [];
        for (const [key, schema] of packetEntries) {
            const data = schema as unknown as MinecraftProtocolSchemaObject;
            const { title, description, content, packetId } = this.processSchema(data, key, enumCache);
            if (!title) {
                continue;
            }

            const stem = path.basename(key, '.json');
            const outputFilename = `${stem}.html`;
            const outputPath = path.join(outputDirectory, outputFilename);

            writePromises.push(fs.writeFile(outputPath, this.getPageHtml(title, content, true), 'utf-8'));
            packets.push({ title, description, filename: outputFilename, id: packetId });
        }

        packets.sort((a, b) => a.id - b.id);
        writePromises.push(this.generateIndexPage(packets, outputDirectory));

        await Promise.all(writePromises);
    }

    readonly id: string = 'protocol';
    readonly name: string = 'Protocol HTML Generator';
    readonly outputDirectoryName: string = 'protocol';
}
