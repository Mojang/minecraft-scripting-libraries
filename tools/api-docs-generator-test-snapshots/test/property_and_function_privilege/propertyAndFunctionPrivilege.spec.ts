// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';
import { join } from 'path';

describe('Property and Function Privilege', () => {
    it('Generates correct output for class property and function privilege value mode', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['msdocs', 'ts'],
            inDir: join(__dirname, 'privilege_value_input'),
            outDir: join(__dirname, 'privilege_value_output'),
        });
    });
    it('Generates correct output for class property and function privilege array modes', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['msdocs', 'ts'],
            inDir: join(__dirname, 'privilege_array_input'),
            outDir: join(__dirname, 'privilege_array_output'),
        });
    });
    it('Generates correct output for class property and function privilege object modes', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['msdocs', 'ts'],
            inDir: join(__dirname, 'privilege_object_input'),
            outDir: join(__dirname, 'privilege_object_output'),
        });
    });
    it('Generates correct output for class property and function privilege changelogs', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['changelog', 'changelog-json'],
            inDir: join(__dirname, 'privilege_changelog_input'),
            outDir: join(__dirname, 'privilege_changelog_output'),
        });
    });
});
