// Copyright (c) Mojang AB.  All rights reserved.

import { describe, expect, it } from 'vitest';
import { ContentsData, GenerateContentsJsonParameters, generateContentsJson } from './generateContentsJson';
import path from 'path';

function _createParameters(targetPath: string, ignoreTargetFolderExists: boolean): GenerateContentsJsonParameters {
    return {
        outputFile: 'TEST',
        targetPath: targetPath,
        ignoreTargetFolderExists: ignoreTargetFolderExists,
    };
}

describe('generate contents Json', () => {
    it('Path with two files', async () => {
        const parameters = _createParameters(
            path.join(__dirname, '../static/testFiles/subDirectory/subSubDirectory'),
            false,
        );
        const jsonContents = await generateContentsJson(parameters);
        expect(jsonContents).toBeDefined();
        if (jsonContents) {
            const contentsData = JSON.parse(jsonContents) as ContentsData;
            expect(contentsData).toBeDefined();
            expect(contentsData.content.length).toBe(2);
            expect(contentsData.content[0].path).toBe('1_sub_sub.txt');
            expect(contentsData.content[1].path).toBe('2_sub_sub.txt');
        }
    });

    it('Path with two files and sub directory', async () => {
        const parameters = _createParameters(path.join(__dirname, '../static/testFiles/subDirectory'), false);
        const jsonContents = await generateContentsJson(parameters);
        expect(jsonContents).toBeDefined();
        if (jsonContents) {
            const contentsData = JSON.parse(jsonContents) as ContentsData;
            expect(contentsData).toBeDefined();
            expect(contentsData.content.length).toBe(4);
            expect(contentsData.content[0].path).toBe('1_sub.txt');
            expect(contentsData.content[1].path).toBe('2_sub.txt');
            expect(contentsData.content[2].path).toBe('subSubDirectory/1_sub_sub.txt');
            expect(contentsData.content[3].path).toBe('subSubDirectory/2_sub_sub.txt');
        }
    });

    it('Path with one file and sub directory with sub directory', async () => {
        const parameters = _createParameters(path.join(__dirname, '../static/testFiles'), false);
        const jsonContents = await generateContentsJson(parameters);
        expect(jsonContents).toBeDefined();
        if (jsonContents) {
            const contentsData = JSON.parse(jsonContents) as ContentsData;
            expect(contentsData).toBeDefined();
            expect(contentsData.content.length).toBe(5);
            expect(contentsData.content[0].path).toBe('1.txt');
            expect(contentsData.content[1].path).toBe('subDirectory/1_sub.txt');
            expect(contentsData.content[2].path).toBe('subDirectory/2_sub.txt');
            expect(contentsData.content[3].path).toBe('subDirectory/subSubDirectory/1_sub_sub.txt');
            expect(contentsData.content[4].path).toBe('subDirectory/subSubDirectory/2_sub_sub.txt');
        }
    });
});
