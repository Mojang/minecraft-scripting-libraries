// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import mustache from 'mustache';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
    CommandDocsValidator,
    CommandExampleDocsValidator,
    CommonFilters,
    GeneratorContext,
    MinecraftCommandArgument,
    MinecraftCommandModule,
    MinecraftRelease,
} from '@minecraft/api-docs-generator';
import { MSDocsMarkdownGenerator } from './generators';

describe('Command documentation', () => {
    let directory: string;
    let give: string;
    let other: string;
    let outputDirectory: string;

    const parameter = (name: string, type: string, optional = false): MinecraftCommandArgument => ({
        name,
        is_optional: optional,
        type: { name: type },
    });

    beforeAll(async () => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'command-docs-'));
        outputDirectory = path.join(directory, 'output');
        const docsDirectory = path.join(directory, 'docs');
        const writeInfo = (segments: string[], data: unknown) => {
            const filename = path.join(docsDirectory, 'test-commands', ...segments, 'info.json');
            fs.mkdirSync(path.dirname(filename), { recursive: true });
            fs.writeFileSync(filename, JSON.stringify(data));
        };
        writeInfo(['commands', 'give'], {
            description: 'Give an item.',
            overloads: [
                {
                    id: 1,
                    header: 'Give items',
                },
            ],
            arguments: [
                { name: 'player', description: 'A **player** or `selector`.' },
                { name: 'amount-int', description: ['Use `1|2`.', 'Default: `1`.'] },
                { name: 'amount-string', description: 'A textual amount.' },
            ],
        });
        const examplesDirectory = path.join(docsDirectory, 'test-commands', 'commands', 'give', '_examples');
        fs.mkdirSync(examplesDirectory);
        fs.writeFileSync(path.join(examplesDirectory, 'building-materials.mcfunction'), '/give @s stone 64\n');
        fs.writeFileSync(
            path.join(examplesDirectory, 'building-materials.json'),
            JSON.stringify({ title: 'Command example' })
        );
        fs.writeFileSync(
            path.join(examplesDirectory, 'components.mcfunction'),
            '/give @p diamond_pickaxe 1 0 {"minecraft:can_destroy":{"blocks":["stone"]}}\r\n/give @s torch\r\n'
        );
        fs.writeFileSync(
            path.join(examplesDirectory, 'components.json'),
            JSON.stringify({
                title: 'Component example',
                description: ['Keep the JSON unchanged.', 'Run this command:'],
                overload: 1,
            })
        );
        writeInfo(['command_types', 'target'], { description: 'Unused primitive metadata.' });
        const typeExamplesDirectory = path.join(docsDirectory, 'test-commands', 'command_types', 'target', '_examples');
        fs.mkdirSync(typeExamplesDirectory);
        fs.writeFileSync(path.join(typeExamplesDirectory, 'ignored.json'), '{');
        const module: MinecraftCommandModule = {
            name: 'test-commands',
            module_type: 'commands',
            minecraft_version: '1.0.0',
            commands: [
                {
                    name: 'give',
                    description: 'Raw description.',
                    aliases: [{ name: 'gift' }, { name: 'present' }],
                    permission_level: 1,
                    requires_cheats: true,
                    overloads: [
                        {
                            name: '1',
                            params: [
                                parameter('player', 'SELECTION'),
                                parameter('itemName', 'ITEM'),
                                parameter('amount', 'INT', true),
                                parameter('components', 'JSON_OBJECT', true),
                            ],
                        },
                        {
                            name: '2',
                            params: [parameter('player', 'SELECTION', true), parameter('amount', 'INT', true)],
                        },
                        {
                            name: '3',
                            params: [
                                parameter('amount', 'ID'),
                                parameter('mode', 'LOCALMODE'),
                                parameter('keyword', 'KEYWORD', true),
                                parameter('objective', 'SCOREBOARDOBJECTIVES', true),
                            ],
                        },
                    ],
                },
                {
                    name: 'other',
                    description: 'Metadata-only command.',
                    permission_level: 0,
                    requires_cheats: false,
                    overloads: [
                        { name: '1', params: [] },
                        { name: '2', params: [parameter('mode', 'KEYWORD')] },
                        {
                            name: '3',
                            params: [
                                parameter('mode', 'KEYWORD', true),
                                parameter('item', 'ITEM'),
                                parameter('value', 'WILDCARDINT', true),
                                parameter('objective', 'SCOREBOARDOBJECTIVES', true),
                            ],
                        },
                    ],
                },
            ],
            command_enums: [
                { name: 'Item', values: [{ value: 'stone' }, { value: 'torch' }] },
                { name: 'Keyword', values: [{ value: 'reset' }] },
                { name: 'LocalMode', values: [{ value: 'first' }, { value: 'second' }] },
                { name: 'ScoreboardObjectives', values: [] },
            ],
        };
        const release = new MinecraftRelease('1.0.0');
        release.command_modules = [module];
        const context = await GeneratorContext.Init({
            inputDirectory: directory,
            outputDirectory,
            documentationDirectory: docsDirectory,
            ignoreConfig: true,
            generatorsToRun: ['msdocs'],
            log: { level: 'error' },
        });
        for (const [, filter] of CommonFilters.filters) {
            filter([release], context.documentationFileLoader);
        }
        await new MSDocsMarkdownGenerator().generateFiles(context, [release], outputDirectory);
        give = fs
            .readFileSync(path.join(outputDirectory, 'commands', 'commands', 'give.md'), 'utf8')
            .replace(/\r\n/g, '\n');
        other = fs
            .readFileSync(path.join(outputDirectory, 'commands', 'commands', 'other.md'), 'utf8')
            .replace(/\r\n/g, '\n');
    });

    afterAll(() => {
        if (directory) {
            fs.rmSync(directory, { recursive: true, force: true });
        }
    });

    it('renders syntax, metadata, and usage tables in parameter order', () => {
        expect(give).toContain('| **Aliases** | `/gift`, `/present` |');
        expect(give).toContain('| **Permission Level** | Game Directors |');
        expect(give).toContain('| **Requires Cheats** | Yes |');
        expect(give).toContain('## Syntax Overview');
        expect(give).toContain('`/give <player: target> <itemName: Item> [amount: int] [components: json]`');
        expect(give).toContain('### Give items');
        expect(give).toContain('| Argument | Type | Required | Description |');
        expect(give).toContain(
            '| `player` | [target](../../CommandTypes/target.md) | Required | A **player** or `selector`. |'
        );
        expect(give).toContain(
            '| `player` | [target](../../CommandTypes/target.md) | Optional | A **player** or `selector`. |'
        );
        expect(give.indexOf('| `player`')).toBeLessThan(give.indexOf('| `itemName`'));
        expect(give.indexOf('| `itemName`')).toBeLessThan(give.indexOf('| `amount`'));
    });

    it('documents every overload and escapes table descriptions without losing Markdown', () => {
        expect(give.match(/\| Optional \| Use `1\\\|2`\.<br>Default: `1`\. \|/g)).toHaveLength(2);
        expect(give).toContain('| `amount` | [string](../../CommandTypes/string.md) | Required | A textual amount. |');
        const reference = give.slice(give.indexOf('## Arguments Reference'));
        expect(reference).toContain('| `amount` | [int](../../CommandTypes/int.md) | Use `1\\|2`.<br>Default: `1`. |');
        expect(reference).toContain('| `amount` | [string](../../CommandTypes/string.md) | A textual amount. |');
        expect(reference.indexOf('| `amount`')).toBeLessThan(reference.indexOf('| `player`'));
    });

    it('renders command and overload examples once, retaining JSON and multiple lines', () => {
        expect(give.match(/## Examples/g)).toHaveLength(1);
        expect(give.match(/\*\*Examples:\*\*/g)).toHaveLength(1);
        expect(give.match(/\/give @s stone 64/g)).toHaveLength(1);
        expect(give).toContain('### Command example\n\n```text\n/give @s stone 64\n```');
        expect(give).toContain('Keep the JSON unchanged.\n\nRun this command:');
        expect(give).toContain(
            '```text\n/give @p diamond_pickaxe 1 0 {"minecraft:can_destroy":{"blocks":["stone"]}}\n/give @s torch\n```'
        );
    });

    it('preserves metadata-only commands, literal syntax, optional keywords, and inline enums', () => {
        expect(other).toContain('Metadata-only command.');
        expect(other).toContain('| **Requires Cheats** | No |');
        expect(other).not.toContain('Examples');
        expect(other).toContain('`/other reset`');
        expect(other).toContain(
            '`/other [reset: Keyword] <item: Item> [value: wildcard int] [objective: ScoreboardObjectives]`'
        );
        expect(other.match(/\| Argument \| Type \| Required \| Description \|/g)).toHaveLength(1);
        expect(other).toContain('| `reset` | Keyword | Optional |  |');
        expect(give).toContain('### `LocalMode`');
        expect(give).toContain('| `mode` | LocalMode | Required |  |');
        expect(give).toContain('| `objective` | ScoreboardObjectives | Optional |  |');
    });

    it('keeps links to handwritten primitive docs and generates linked enum pages', () => {
        const commandDirectory = path.join(outputDirectory, 'commands', 'commands');
        for (const markdown of [give, other]) {
            for (const match of markdown.matchAll(/\]\((\.\.\/enums\/[^)]+)\)/g)) {
                expect(fs.existsSync(path.resolve(commandDirectory, decodeURIComponent(match[1])))).toBe(true);
            }
        }
        expect(give).toContain('[target](../../CommandTypes/target.md)');
        expect(give).toContain('[int](../../CommandTypes/int.md)');
        expect(other).toContain('[wildcard int](../../CommandTypes/wildcard%20int.md)');
        expect(give).not.toContain('../types/');
        expect(fs.existsSync(path.join(outputDirectory, 'CommandTypes'))).toBe(false);
        expect(fs.existsSync(path.join(outputDirectory, 'commands', 'types'))).toBe(false);
        const summary = fs.readFileSync(path.join(outputDirectory, 'commands', 'commands.md'), 'utf8');
        expect(summary).not.toContain('./types/');
        expect(summary).not.toContain('Unused primitive metadata.');
        expect(summary).toContain('[`Item`](./enums/Item.md)');
        const toc = fs.readFileSync(path.join(outputDirectory, 'commands', 'TOC.yml'), 'utf8');
        expect(toc).not.toContain('types/');
        expect(toc).toContain('href: commands/give.md');
    });

    it('adds section navigation and a handwritten type index link to the command summary', () => {
        const summary = fs
            .readFileSync(path.join(outputDirectory, 'commands', 'commands.md'), 'utf8')
            .replace(/\r\n/g, '\n');
        expect(summary).toContain('# Minecraft Commands');
        expect(summary).toContain('[Built-in command argument types](../CommandTypes/index.md)');
        expect(summary.slice(summary.indexOf('## Contents'), summary.indexOf('## Commands'))).toBe(
            '## Contents\n\n- [Commands](#commands)\n- [Command enums](#command-enums)\n\n'
        );
        expect(summary).toContain('## Command enums');
        expect(summary).toContain('[`/give`](./commands/give.md)');
        expect(summary).toContain('[`Item`](./enums/Item.md)');
    });

    it.each([{ commandEnums: undefined }, { commandEnums: [] }])(
        'omits enum navigation from the summary when enums are $commandEnums',
        ({ commandEnums }) => {
            const template = fs.readFileSync(
                path.join(__dirname, '..', 'templates', 'msdocs', 'commands', 'summary.mustache'),
                'utf8'
            );
            const summary = mustache.render(template, { commands: [], command_enums: commandEnums });
            expect(summary).toContain('- [Commands](#commands)');
            expect(summary).toContain('## Commands');
            expect(summary).toContain('[Built-in command argument types](../CommandTypes/index.md)');
            expect(summary).not.toContain('[Command enums](#command-enums)');
            expect(summary).not.toContain('## Command enums');
        }
    );

    it('adds a section TOC before enum values without listing individual values', () => {
        const markdown = fs
            .readFileSync(path.join(outputDirectory, 'commands', 'enums', 'Item.md'), 'utf8')
            .replace(/\r\n/g, '\n');
        const contents = markdown.slice(markdown.indexOf('## Contents'), markdown.indexOf('## Values'));
        expect(contents).toBe('## Contents\n\n- [Values](#values)\n- [References](#references)\n\n');
        expect(markdown).toContain('## Values\n- `stone`\n- `torch`');
        expect(markdown).toContain('## References');
        expect(markdown).toContain('- [give](../commands/give.md)');
    });

    it.each([{ commandReferences: undefined }, { commandReferences: [] }])(
        'omits the References TOC entry when references are $commandReferences',
        ({ commandReferences }) => {
            const template = fs.readFileSync(
                path.join(__dirname, '..', 'templates', 'msdocs', 'commands', 'enum.mustache'),
                'utf8'
            );
            const markdown = mustache.render(template, {
                enum_name: 'Test',
                values: [{ value: 'first' }, { value: 'second' }],
                command_references: commandReferences,
            });
            expect(markdown).toContain('- [Values](#values)');
            expect(markdown).toContain('## Values');
            expect(markdown).not.toContain('- [References](#references)');
            expect(markdown).not.toContain('## References');
        }
    );

    it('accepts existing documentation and validates optional example sidecars', () => {
        expect(CommandDocsValidator.guard({ description: 'Existing docs.', overloads: [{ id: 1 }] })).toBe(true);
        expect(CommandExampleDocsValidator.guard({})).toBe(true);
        expect(
            CommandExampleDocsValidator.guard({
                title: 'Example',
                description: 'A description.',
                overload: 1,
            })
        ).toBe(true);
        expect(CommandExampleDocsValidator.guard({ title: 42 })).toBe(false);
        expect(CommandExampleDocsValidator.guard({ overload: '1' })).toBe(false);
    });
});
