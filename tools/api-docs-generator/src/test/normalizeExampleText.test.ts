// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FileLoader } from '../FileLoader';
import { CommonFilters } from '../filters';
import { MinecraftRelease } from '../MinecraftRelease';
import { MinecraftScriptModule } from '../modules/MinecraftScriptModule';
import { normalizeExampleText } from '../utilities';

describe('normalizeExampleText', () => {
    it.each([
        { name: 'text without a final newline', input: 'first\nsecond', expected: 'first\nsecond' },
        { name: 'a leading BOM', input: '\uFEFFfirst', expected: 'first' },
        { name: 'an embedded BOM', input: 'first\uFEFFsecond', expected: 'first\uFEFFsecond' },
        { name: 'LF line endings', input: 'first\nsecond\n', expected: 'first\nsecond' },
        { name: 'CRLF line endings', input: 'first\r\nsecond\r\n', expected: 'first\nsecond' },
        { name: 'CR line endings', input: 'first\rsecond\r', expected: 'first\nsecond' },
        { name: 'mixed line endings', input: 'first\r\nsecond\rthird\n', expected: 'first\nsecond\nthird' },
        { name: 'leading blank lines', input: '\n\nfirst\n', expected: '\n\nfirst' },
        { name: 'extra trailing blank lines', input: 'first\n\n\n', expected: 'first\n\n' },
        { name: 'indentation and trailing spaces', input: '\tfirst  \n  second \n', expected: '\tfirst  \n  second ' },
        { name: 'empty input', input: '', expected: '' },
        { name: 'a newline only', input: '\n', expected: '' },
        { name: 'a BOM only', input: '\uFEFF', expected: '' },
        { name: 'spaces only', input: '  ', expected: '  ' },
    ])('handles $name', ({ input, expected }) => {
        expect(normalizeExampleText(input)).toBe(expected);
    });
});

describe('Script example normalization', () => {
    let directory: string;

    beforeEach(() => {
        directory = fs.mkdtempSync(path.join(os.tmpdir(), 'script-example-normalization-'));
    });

    afterEach(() => {
        fs.rmSync(directory, { recursive: true, force: true });
    });

    it.each([
        {
            name: 'LF input with whitespace and a blank line',
            input: '/* comment */\n  const value = 1;  \n\n',
            expected: ['/* comment */', '  const value = 1;  ', ''],
        },
        {
            name: 'a BOM and mixed line endings',
            input: '\uFEFF/* comment */\rconst first = 1;\r\nconst second = 2;\n',
            expected: ['/* comment */', 'const first = 1;', 'const second = 2;'],
        },
        { name: 'empty input', input: '', expected: [] },
        { name: 'one blank line', input: '\n', expected: [''] },
        { name: 'two blank lines', input: '\r\n\r\n', expected: ['', ''] },
    ])('normalizes local and shared examples with $name', ({ input, expected }) => {
        const module: MinecraftScriptModule = {
            name: 'test-module',
            uuid: '411a0018-bbd6-43a5-96eb-ce7c4162f491',
            version: '1.0.0',
            minecraft_version: '1.0.0',
            module_type: 'script',
        };
        const moduleDirectory = path.join(directory, module.name);
        fs.mkdirSync(path.join(moduleDirectory, '_examples'), { recursive: true });
        fs.mkdirSync(path.join(moduleDirectory, '_shared_examples'));
        fs.writeFileSync(path.join(moduleDirectory, '_examples', 'local.ts'), input);
        fs.writeFileSync(path.join(moduleDirectory, '_shared_examples', 'shared.ts'), input);
        fs.writeFileSync(path.join(moduleDirectory, '_example_files.json'), JSON.stringify(['shared.ts']));

        const release = new MinecraftRelease('1.0.0');
        release.script_modules = [module];
        const loader = new FileLoader(directory, ['.json', '.ts']);
        for (const [, filter] of CommonFilters.filters) {
            filter([release], loader);
        }

        expect(module.examples.map(example => example.name)).toEqual(['local.ts', 'shared.ts']);
        for (const example of module.examples) {
            expect(example.code.text).toEqual(expected);
            expect(example.code.escaped_text).toEqual(
                expected.map(line => line.replace(/\/\*/g, '/\\*').replace(/\*\//g, '*\\/'))
            );
        }
    });
});
