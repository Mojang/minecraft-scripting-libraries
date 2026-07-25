// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { runGeneratorForTest } from '../runGeneratorForTest';

function getDiagnosticMessages(program: ts.Program): string[] {
    return ts.getPreEmitDiagnostics(program).map(diagnostic => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        if (!diagnostic.file || diagnostic.start === undefined) {
            return message;
        }

        const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return `${diagnostic.file.fileName}:${position.line + 1}:${position.character + 1} ${message}`;
    });
}

describe('generic metadata', () => {
    it('generates ordered declarations, applications, links, and NativeClass support', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs', 'changelog', 'changelog-json'],
            skipMerging: true,
        });

        const typescriptDirectory = path.join(__dirname, 'actual_output', 'typescript');
        const fixturesDeclaration = path.join(typescriptDirectory, '@minecraft', 'generic-fixtures@1.1.0.d.ts');
        const baseDeclaration = path.join(typescriptDirectory, '@minecraft', 'generic-base@1.0.0.d.ts');
        const declarationText = fs.readFileSync(fixturesDeclaration, 'utf8');

        expect(declarationText.match(/export interface NativeClass<T>/g)).toHaveLength(1);
        expect(declarationText).toContain(
            'static get<TFixture extends BaseFixture>(classType: NativeClass<TFixture>): TFixture | undefined;'
        );
        expect(declarationText).toContain(
            'export class GenericFixture<TZebra extends minecraftgenericbase.CrossModuleBase, TAlpha = string>'
        );
        expect(declarationText).toContain(
            'export class GenericDerived<TZebra, TAlpha> extends minecraftgenericbase.GenericBase<TAlpha, TZebra>'
        );
        expect(declarationText).toContain('convert<TZebra, TAlpha>(value: TZebra): TAlpha;');
        expect(declarationText).toContain('getCurrent(): TAlpha[];');
        expect(declarationText).toContain('getPair(): minecraftgenericbase.BasePair<string, boolean>;');
        expect(declarationText).toContain('readonly pair: minecraftgenericbase.BasePair<string, boolean>;');
        expect(declarationText).toContain('export function pick<TZebra, TAlpha>(value: TZebra): TAlpha;');

        const inputFiles = fs
            .readdirSync(path.join(__dirname, 'input'))
            .filter(file => file.includes('generic-fixtures'))
            .map(
                file =>
                    JSON.parse(fs.readFileSync(path.join(__dirname, 'input', file), 'utf8')) as Record<string, unknown>
            );
        expect(
            inputFiles.some(input => {
                const interfaces = input.interfaces as { name: string }[] | undefined;
                return interfaces?.some(interfaceRecord => interfaceRecord.name === 'NativeClass');
            })
        ).toBe(false);

        const program = ts.createProgram({
            rootNames: [path.join(__dirname, 'type-tests', 'native-class.ts')],
            options: {
                baseUrl: __dirname,
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                noEmit: true,
                paths: {
                    '@minecraft/generic-base': [baseDeclaration],
                    '@minecraft/generic-fixtures': [fixturesDeclaration],
                },
                strict: true,
                target: ts.ScriptTarget.ESNext,
            },
        });
        expect(getDiagnosticMessages(program)).toEqual([]);
    });
});
