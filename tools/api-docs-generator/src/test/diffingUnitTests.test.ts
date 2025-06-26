// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as utils from '../utilities';
import { describe, expect, it } from 'vitest';
import deepEqual from 'deep-equal';

type MetadataType = {
    name: string;
};

type ChangedMetadataType = {
    $added?: boolean;
    $removed?: boolean;
};

type DiffTestInfo = {
    $old: MetadataType[];
    $new: MetadataType[];
    expectedDiff: (MetadataType & ChangedMetadataType)[];
    expectedLCS: string[];
    testName: string;
};

const DiffTestInfos: DiffTestInfo[] = [
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        $new: [{ name: 'B' }, { name: 'C' }, { name: 'D' }],
        expectedDiff: [{ name: 'A', $removed: true }, { name: 'B' }, { name: 'C' }, { name: 'D', $added: true }],
        expectedLCS: ['B', 'C'],
        testName: 'Smoke Test, remove first, add to end',
    },
    {
        $old: [{ name: 'A' }],
        $new: [{ name: 'A' }, { name: 'B' }],
        expectedDiff: [{ name: 'A' }, { name: 'B', $added: true }],
        expectedLCS: ['A'],
        testName: 'Add to back',
    },
    {
        $old: [{ name: 'A' }],
        $new: [{ name: 'B' }, { name: 'A' }],
        expectedDiff: [{ name: 'B', $added: true }, { name: 'A' }],
        expectedLCS: ['A'],
        testName: 'Add to front',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }],
        $new: [{ name: 'A' }, { name: 'C' }, { name: 'B' }],
        expectedDiff: [{ name: 'A' }, { name: 'C', $added: true }, { name: 'B' }],
        expectedLCS: ['A', 'B'],
        testName: 'Add to middle',
    },
    {
        $old: [],
        $new: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        expectedDiff: [
            { name: 'A', $added: true },
            { name: 'B', $added: true },
            { name: 'C', $added: true },
        ],
        expectedLCS: [],
        testName: 'All new',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        $new: [],
        expectedDiff: [
            { name: 'A', $removed: true },
            { name: 'B', $removed: true },
            { name: 'C', $removed: true },
        ],
        expectedLCS: [],
        testName: 'All old',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        $new: [{ name: 'A' }, { name: 'C' }],
        expectedDiff: [{ name: 'A' }, { name: 'B', $removed: true }, { name: 'C' }],
        expectedLCS: ['A', 'C'],
        testName: 'Remove Middle',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        $new: [{ name: 'B' }, { name: 'C' }],
        expectedDiff: [{ name: 'A', $removed: true }, { name: 'B' }, { name: 'C' }],
        expectedLCS: ['B', 'C'],
        testName: 'Remove front',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        $new: [{ name: 'A' }, { name: 'B' }],
        expectedDiff: [{ name: 'A' }, { name: 'B' }, { name: 'C', $removed: true }],
        expectedLCS: ['A', 'B'],
        testName: 'Remove end',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
        $new: [{ name: 'C' }, { name: 'A' }, { name: 'B' }],
        expectedDiff: [{ name: 'C', $added: true }, { name: 'A' }, { name: 'B' }, { name: 'C', $removed: true }],
        expectedLCS: ['A', 'B'],
        testName: 'Moving endcaps',
    },
    {
        $old: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
        $new: [{ name: 'A' }, { name: 'C' }, { name: 'B' }, { name: 'D' }],
        expectedDiff: [
            { name: 'A' },
            { name: 'C', $added: true },
            { name: 'B' },
            { name: 'C', $removed: true },
            { name: 'D' },
        ],
        expectedLCS: ['A', 'B', 'D'],
        testName: 'Moving middle',
    },
    {
        $old: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
            { name: 'D' },
            { name: 'E' },
            { name: 'F' },
            { name: 'G' },
            { name: 'H' },
            { name: 'I' },
            { name: 'J' },
            { name: 'K' },
        ],
        $new: [
            { name: 'B' },
            { name: 'C' },
            { name: 'K' },
            { name: 'E' },
            { name: 'F' },
            { name: 'H' },
            { name: 'J' },
            { name: 'L' },
        ],
        expectedDiff: [
            { name: 'A', $removed: true },
            { name: 'B' },
            { name: 'C' },
            { name: 'D', $removed: true },
            { name: 'K', $added: true },
            { name: 'E' },
            { name: 'F' },
            { name: 'G', $removed: true },
            { name: 'H' },
            { name: 'I', $removed: true },
            { name: 'J' },
            { name: 'K', $removed: true },
            { name: 'L', $added: true },
        ],
        expectedLCS: ['B', 'C', 'E', 'F', 'H', 'J'],
        testName: 'Stress 1',
    },
    {
        $old: [
            { name: '0' },
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
            { name: 'D' },
            { name: 'F' },
            { name: 'G' },
            { name: 'H' },
            { name: 'J' },
            { name: 'Q' },
            { name: 'Z' },
        ],
        $new: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
            { name: 'D' },
            { name: 'E' },
            { name: 'F' },
            { name: 'G' },
            { name: 'I' },
            { name: 'J' },
            { name: 'K' },
            { name: 'R' },
            { name: 'X' },
            { name: 'Y' },
            { name: 'Z' },
        ],
        expectedDiff: [
            { name: '0', $removed: true },
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
            { name: 'D' },
            { name: 'E', $added: true },
            { name: 'F' },
            { name: 'G' },
            { name: 'H', $removed: true },
            { name: 'I', $added: true },
            { name: 'J' },
            { name: 'Q', $removed: true },
            { name: 'K', $added: true },
            { name: 'R', $added: true },
            { name: 'X', $added: true },
            { name: 'Y', $added: true },
            { name: 'Z' },
        ],
        expectedLCS: ['A', 'B', 'C', 'D', 'F', 'G', 'J', 'Z'],
        testName: 'Stress 2',
    },
];

const $key = 'name';

describe('LCS Unit Tests', () => {
    for (const testInfo of DiffTestInfos) {
        it(testInfo.testName, () => {
            const actual = utils.longestCommonSubsequence(testInfo.$old, testInfo.$new, $key);
            expect(deepEqual(testInfo.expectedLCS, actual)).toBeTruthy();
        });
    }
});

describe('Diffing Array Unit Tests', () => {
    for (const testInfo of DiffTestInfos) {
        it(testInfo.testName, () => {
            const actual = utils.diffArray(testInfo.$old, testInfo.$new, $key);
            expect(deepEqual(testInfo.expectedDiff, actual)).toBeTruthy();
        });
    }
});
