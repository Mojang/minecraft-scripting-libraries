// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';

import { GeneratorContext, Logger, MarkupGenerator, MinecraftRelease } from '@minecraft/api-docs-generator';

type FieldData = Record<string, unknown>;
type Definitions = Record<string, SchemaData>;

interface SchemaData {
    type?: string;
    title?: string;
    description?: string;
    properties?: Record<string, FieldData>;
    required?: string[];
    definitions?: Definitions;
    enum?: string[];
    items?: FieldData;
    oneOf?: FieldData[];
    $ref?: string;
    'x-underlying-type'?: string;
    'x-serialization-options'?: string;
    'x-ordinal-index'?: number;
    'x-control-value-type'?: string;
    $metaProperties?: Record<string, unknown>;
    [key: string]: unknown;
}

interface PacketInfo {
    title: string;
    description: string;
    filename: string;
    id: number;
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export class ProtocolHTMLGenerator implements MarkupGenerator {
    private static getUnderlyingType(fieldData: FieldData, definitions: Definitions): string {
        const serializationOptions = (fieldData['x-serialization-options'] as string | undefined) ?? undefined;

        if ('x-underlying-type' in fieldData) {
            const underlyingType = fieldData['x-underlying-type'] as string;
            if ('enum' in fieldData) {
                if (serializationOptions && serializationOptions.includes('Enum-as-Value')) {
                    if (serializationOptions.includes('Compression')) {
                        return 'var' + underlyingType;
                    }
                    return underlyingType;
                }
                return (fieldData.type as string | undefined) ?? 'unknown';
            }
            if (serializationOptions?.includes('Compression')) {
                return 'var' + underlyingType;
            }
            return underlyingType;
        }

        if (fieldData.type === 'array') {
            const items = (fieldData.items as FieldData | undefined) ?? {};
            if ('$ref' in items) {
                const refId = (items['$ref'] as string).split('/').pop() ?? '';
                if (definitions && refId in definitions) {
                    const refTitle = definitions[refId].title ?? refId;
                    return `array&lt;${refTitle}&gt;`;
                }
                return `array&lt;${refId}&gt;`;
            } else if ('x-underlying-type' in items) {
                return `array&lt;${items['x-underlying-type'] as string}&gt;`;
            } else {
                const itemType = (items.type as string | undefined) ?? 'unknown';
                return `array&lt;${itemType}&gt;`;
            }
        }

        if ('oneOf' in fieldData) {
            return 'oneOf';
        }

        if ('$ref' in fieldData) {
            const refId = (fieldData['$ref'] as string).split('/').pop() ?? '';
            if (definitions && refId in definitions) {
                return definitions[refId].title ?? refId;
            }
            return refId;
        }

        if ('enum' in fieldData) {
            return (fieldData.title as string | undefined) ?? 'enum';
        }

        return (fieldData.type as string | undefined) ?? 'unknown';
    }

    private static getOrdinalIndex(fieldData: FieldData): number {
        return (fieldData['x-ordinal-index'] as number | undefined) ?? 9999;
    }

    private generateEnumTable(enumValues: string[], indentLevel: number): string {
        if (!enumValues || enumValues.length === 0) {
            return '';
        }

        const marginLeft = (indentLevel + 1) * 20;
        const html: string[] = [];

        html.push(`<div style="margin-left: ${marginLeft}px; margin-top: 5px; margin-bottom: 5px;">`);
        html.push('<strong>Enum Values:</strong>');
        html.push(
            '<table border="1" cellpadding="3" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 760px; font-size: 12px;">'
        );
        html.push('<thead>');
        html.push('<tr style="background-color: #e8e8e8;">');
        html.push('<th style="width: 40px;">Index</th>');
        html.push('<th>Value</th>');
        html.push('</tr>');
        html.push('</thead>');
        html.push('<tbody>');

        for (let idx = 0; idx < enumValues.length; idx++) {
            html.push('<tr>');
            html.push(`<td style="text-align: center;">${idx}</td>`);
            html.push(`<td><code>${escapeHtml(enumValues[idx])}</code></td>`);
            html.push('</tr>');
        }

        html.push('</tbody>');
        html.push('</table>');
        html.push('</div>');

        return html.join('\n');
    }

    private generateOneOfTable(fieldData: FieldData, indentLevel: number, definitions: Definitions): string {
        if (!('oneOf' in fieldData)) {
            return '';
        }

        const controlValueType = (fieldData['x-control-value-type'] as string | undefined) ?? 'varuint32';
        const oneOfItems = fieldData.oneOf as FieldData[];
        let oneofType = 'oneOf<';
        const oneOfMembersHtml: string[] = [];
        const expandedDefinitionsHtml: string[] = [];

        for (let idx = 0; idx < oneOfItems.length; idx++) {
            const oneOfItem = oneOfItems[idx];
            const underlyingType = ProtocolHTMLGenerator.getUnderlyingType(oneOfItem, definitions);
            oneofType += underlyingType + ', ';

            const details: string[] = [];
            if ('x-underlying-type' in oneOfItem) {
                details.push(`Underlying: ${oneOfItem['x-underlying-type'] as string}`);
            }
            if ('x-serialization-options' in oneOfItem) {
                details.push(`Serialization: ${oneOfItem['x-serialization-options'] as string}`);
            }
            if ('title' in oneOfItem) {
                details.push(`Title: ${oneOfItem.title as string}`);
            }

            const detailsStr = details.length > 0 ? details.join(', ') : '-';

            oneOfMembersHtml.push('<tr>');
            oneOfMembersHtml.push(`<td>${idx}</td>`);
            oneOfMembersHtml.push(`<td><strong>${underlyingType}</strong></td>`);
            oneOfMembersHtml.push(`<td>${detailsStr}</td>`);
            oneOfMembersHtml.push('</tr>');

            if ('$ref' in oneOfItem) {
                const refId = (oneOfItem['$ref'] as string).split('/').pop() ?? '';
                if (refId in definitions) {
                    const refSchema = definitions[refId];
                    const refTitle = refSchema.title ?? refId;

                    if (!refTitle.endsWith('Payload')) {
                        const nestedHtml = this.generateNestedTable(refSchema, definitions, '', indentLevel + 2);
                        if (nestedHtml) {
                            const detailHtml: string[] = [];
                            detailHtml.push(
                                `<details style="margin-left: ${(indentLevel + 1) * 20}px; margin-top: 10px;">`
                            );
                            detailHtml.push(
                                `<summary style="cursor: pointer; font-weight: bold; padding: 5px; background-color: #f0f0f0; border: 1px solid #ddd;"><strong>${refTitle} (Variant ${idx})</strong></summary>`
                            );
                            detailHtml.push(nestedHtml);
                            detailHtml.push('</details>');
                            expandedDefinitionsHtml.push(detailHtml.join('\n'));
                        }
                    }
                }
            }
        }

        oneofType = oneofType.replace(/, $/, '') + '>';
        oneofType = escapeHtml(oneofType);
        const marginLeft = (indentLevel + 1) * 20;
        const html: string[] = [];

        html.push(`<div style="margin-left: ${marginLeft}px; margin-top: 0px; margin-bottom: 0px;">`);
        html.push(`<strong>${oneofType}:</strong>`);
        html.push(
            '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 760px; margin-top: 5px;">'
        );
        html.push('<thead>');
        html.push('<tr style="background-color: #e8e8e8;">');
        html.push(`<th>Control Value [${controlValueType}]</th>`);
        html.push('<th>Type</th>');
        html.push('<th>Details</th>');
        html.push('</tr>');
        html.push('</thead>');
        html.push('<tbody>');
        html.push(...oneOfMembersHtml);
        html.push('</tbody>');
        html.push('</table>');

        if (expandedDefinitionsHtml.length > 0) {
            html.push(...expandedDefinitionsHtml);
        }

        html.push('</div>');

        return html.join('\n');
    }

    private generateNestedTable(
        schema: SchemaData,
        definitions: Definitions,
        title: string,
        indentLevel: number = 0
    ): string {
        if (schema.type !== 'object') {
            return '';
        }

        const properties = schema.properties ?? {};
        const required: string[] = schema.required ?? [];

        if (Object.keys(properties).length === 0) {
            return '';
        }

        const sortedProperties = Object.entries(properties).sort(
            ([, a], [, b]) => ProtocolHTMLGenerator.getOrdinalIndex(a) - ProtocolHTMLGenerator.getOrdinalIndex(b)
        );

        const html: string[] = [];
        const marginLeft = indentLevel * 20;

        html.push(`<div style="margin-left: ${marginLeft}px; margin-top: 10px;">`);
        if (title) {
            html.push(`<h3>${escapeHtml(title)}</h3>`);
        }

        html.push(
            '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 800px;">'
        );
        html.push('<thead>');
        html.push('<tr style="background-color: #f0f0f0;">');
        html.push('<th>Field Name</th>');
        html.push('<th>Type</th>');
        html.push('<th>Field Index</th>');
        html.push('<th>Description</th>');
        html.push('</tr>');
        html.push('</thead>');
        html.push('<tbody>');

        for (const [fieldName, fieldData] of sortedProperties) {
            let underlyingType = ProtocolHTMLGenerator.getUnderlyingType(fieldData, definitions);
            const ordinal = ProtocolHTMLGenerator.getOrdinalIndex(fieldData);
            const description = escapeHtml((fieldData.description as string | undefined) ?? '');
            const isRequired = required.includes(fieldName);

            const displayFieldName = isRequired ? `${fieldName} (Required)` : fieldName;
            const ordinalDisplay = ordinal !== 9999 ? String(ordinal) : '';

            let enumHtml = '';
            let nestedHtml = '';
            let oneofHtml = '';

            if ('oneOf' in fieldData) {
                oneofHtml = this.generateOneOfTable(fieldData, 0, definitions);
            } else if ('enum' in fieldData) {
                enumHtml = this.generateEnumTable(fieldData.enum as string[], 0);
            } else if (((fieldData.title as string | undefined) ?? '') in this.protocolEnums) {
                const enumTitle = fieldData.title as string;
                enumHtml = this.generateEnumTable(this.protocolEnums[enumTitle], 0);
            } else if ('$ref' in fieldData) {
                const refId = (fieldData['$ref'] as string).split('/').pop() ?? '';
                if (refId in definitions) {
                    const refSchema = definitions[refId];
                    const refTitle = refSchema.title ?? refId;
                    underlyingType = refTitle;
                    if (!refTitle.endsWith('Payload')) {
                        nestedHtml = this.generateNestedTable(refSchema, definitions, refTitle, 1);
                    }
                }
            } else if (fieldData.type === 'array') {
                const items = (fieldData.items as FieldData | undefined) ?? {};
                if ('$ref' in items) {
                    const refId = (items['$ref'] as string).split('/').pop() ?? '';
                    if (refId in definitions) {
                        const refSchema = definitions[refId];
                        let refTitle = refSchema.title ?? refId;
                        if ('x-serialization-options' in fieldData) {
                            refTitle += ` (${fieldData['x-serialization-options'] as string})`;
                        }
                        if (!refTitle.endsWith('Payload')) {
                            nestedHtml = this.generateNestedTable(
                                refSchema,
                                definitions,
                                `${refTitle} (Array Item)`,
                                1
                            );
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
            html.push(`<td>${underlyingType}</td>`);
            html.push(`<td>${ordinalDisplay}</td>`);
            html.push(`<td>${description}</td>`);
            html.push('</tr>');

            if (oneofHtml) {
                html.push('<tr>');
                html.push(`<td colspan="3" style="padding: 0;">${oneofHtml}</td>`);
                html.push('</tr>');
            } else if (enumHtml) {
                html.push('<tr>');
                html.push(`<td colspan="3">${enumHtml}</td>`);
                html.push('</tr>');
            } else if (nestedHtml) {
                html.push('<tr>');
                html.push(`<td colspan="3">${nestedHtml}</td>`);
                html.push('</tr>');
            }
        }

        html.push('</tbody>');
        html.push('</table>');
        html.push('</div>');

        return html.join('\n');
    }

    private getPageHtml(title: string, content: string, backLink: boolean = true): string {
        const backHtml = backLink ? '<p><a href="index.html">← Back to Index</a></p>' : '';
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
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
        ${backHtml}
        ${content}
    </div>
</body>
</html>`;
    }

    private generateIndexPage(packets: PacketInfo[], outputDirectory: string): void {
        const htmlParts: string[] = [];

        htmlParts.push('<h1>Game Protocol Documentation</h1>');
        htmlParts.push(`<p>Documentation for ${packets.length} protocol packets.</p>`);
        htmlParts.push('<h2>Packet List</h2>');
        htmlParts.push('<ul class="packet-list">');

        packets.sort((a, b) => a.id - b.id);

        for (const packet of packets) {
            const title = escapeHtml(packet.title);
            const desc =
                packet.description.length > 100
                    ? escapeHtml(packet.description.substring(0, 100) + '...')
                    : escapeHtml(packet.description);

            htmlParts.push('<li>');
            htmlParts.push(`<a href="${packet.filename}"><strong>${title}</strong></a>`);
            if (packet.description) {
                htmlParts.push(`<br><span style="color: #666; font-size: 0.9em;">${desc}</span>`);
            }
            htmlParts.push('</li>');
        }

        htmlParts.push('</ul>');

        const content = htmlParts.join('\n');
        const indexPath = path.join(outputDirectory, 'index.html');
        fs.writeFileSync(indexPath, this.getPageHtml('Game Protocol Documentation', content, false), 'utf-8');
    }

    private processSchema(
        data: SchemaData,
        key: string
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
            if (Object.keys(metaProperties).length > 0) {
                packetId = (metaProperties['[cereal:packet]'] as number | undefined) ?? -1;
                title += ` (${packetId})`;

                const packetDetails = metaProperties['[cereal:packet_details]'];
                if (packetDetails !== undefined) {
                    extraDetails = String(packetDetails);
                }
            }

            const htmlParts: string[] = [];
            htmlParts.push(`<h1>${escapeHtml(title)}</h1>`);

            if (description) {
                htmlParts.push(`<div class="description">${escapeHtml(description)}</div>`);
            }
            if (extraDetails) {
                htmlParts.push(`<div class="description">${escapeHtml(extraDetails)}</div>`);
            }

            const properties = data.properties ?? {};
            const propertyKeys = Object.keys(properties);

            if (
                data.type === 'object' &&
                propertyKeys.length === 1 &&
                'mPayload' in properties &&
                '$ref' in properties.mPayload
            ) {
                const refId = (properties.mPayload['$ref'] as string).split('/').pop() ?? '';
                if (refId in definitions) {
                    const payloadSchema = definitions[refId];
                    const payloadTitle = payloadSchema.title ?? '';
                    if (payloadTitle.endsWith('Payload')) {
                        htmlParts.push(this.generateNestedTable(payloadSchema, definitions, '', 0));
                    } else {
                        htmlParts.push(this.generateNestedTable(data, definitions, '', 0));
                    }
                } else {
                    htmlParts.push(this.generateNestedTable(data, definitions, '', 0));
                }
            } else if (data.type === 'object' && data.properties) {
                htmlParts.push(this.generateNestedTable(data, definitions, '', 0));
            }

            return { title, description, content: htmlParts.join('\n'), packetId };
        } catch (e) {
            Logger.error(`Error processing schema '${key}': ${String(e)}`);
            return { title: '', description: '', content: '', packetId: -1 };
        }
    }

    generateFiles(_context: GeneratorContext, releases: MinecraftRelease[], outputDirectory: string): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return Promise.resolve();
        }
        if (Object.keys(releases[0].json_schemas).length === 0) {
            Logger.warn(`No JSON schemas found, '${this.name}' generation not possible.`);
            return Promise.resolve();
        }

        this.protocolEnums = {};

        fs.mkdirSync(outputDirectory, { recursive: true });

        for (const [key, schema] of Object.entries(releases[0].json_schemas)) {
            if (!path.basename(key).startsWith('enum_')) {
                continue;
            }
            const data = schema as unknown as SchemaData;
            const title = data.title ?? '';
            if (title && data.enum) {
                this.protocolEnums[title] = data.enum;
            }
        }

        const packets: PacketInfo[] = [];

        const packetEntries = Object.entries(releases[0].json_schemas)
            .filter(([key]) => !path.basename(key).startsWith('enum_'))
            .sort(([a], [b]) => a.localeCompare(b));

        for (const [key, schema] of packetEntries) {
            const data = schema as unknown as SchemaData;
            const { title, description, content, packetId } = this.processSchema(data, key);

            if (!title) {
                continue;
            }

            const stem = path.basename(key, '.json');
            const outputFilename = `${stem}.html`;
            const outputPath = path.join(outputDirectory, outputFilename);

            fs.writeFileSync(outputPath, this.getPageHtml(title, content, true), 'utf-8');

            packets.push({ title, description, filename: outputFilename, id: packetId });
        }

        this.generateIndexPage(packets, outputDirectory);

        return Promise.resolve();
    }

    private protocolEnums: Record<string, string[]> = {};

    readonly id: string = 'protocol';
    readonly name: string = 'Protocol HTML Generator';
    readonly outputDirectoryName: string = 'protocol';
}
