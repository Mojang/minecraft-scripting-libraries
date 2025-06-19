// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as utils from '../utilities';
import semver from 'semver';
import { describe, expect, it } from 'vitest';

interface VersionEqualityTestCase {
    testDescription: string;
    expectedString: string;
    inputModuleVersion: semver.SemVer;
    inputMinecraftVersion: semver.SemVer;
    onlyUsePrereleaseInfo: boolean;
}

const versionEqualityTestCases: VersionEqualityTestCase[] = [
    {
        testDescription: 'Appending to beta version with minecraft preview version',
        expectedString: '1.2.3-beta.4.5.6-preview.7',
        inputModuleVersion: semver.parse('1.2.3-beta'),
        inputMinecraftVersion: semver.parse('4.5.6-preview.7'),
        onlyUsePrereleaseInfo: false,
    },
    {
        testDescription: 'Appending to beta version with minecraft non-preview version',
        expectedString: '1.2.3-beta.4.5.6-stable',
        inputModuleVersion: semver.parse('1.2.3-beta'),
        inputMinecraftVersion: semver.parse('4.5.6'),
        onlyUsePrereleaseInfo: false,
    },
    {
        testDescription: 'Appending to non-beta version with minecraft preview version',
        expectedString: '1.2.3-rc.4.5.6-preview.7',
        inputModuleVersion: semver.parse('1.2.3'),
        inputMinecraftVersion: semver.parse('4.5.6-preview.7'),
        onlyUsePrereleaseInfo: false,
    },
    {
        testDescription: 'Appending to non-beta version with minecraft non-preview version',
        expectedString: '1.2.3',
        inputModuleVersion: semver.parse('1.2.3'),
        inputMinecraftVersion: semver.parse('4.5.6'),
        onlyUsePrereleaseInfo: false,
    },
    {
        testDescription: 'Only leveraging pre-release information for minecraft version',
        expectedString: '1.2.3-preview.20',
        inputModuleVersion: semver.parse('1.2.3'),
        inputMinecraftVersion: semver.parse('4.5.6-preview.20'),
        onlyUsePrereleaseInfo: true,
    },
    {
        testDescription: 'Does not use minecraft version override if it is not a pre-release version',
        expectedString: '1.2.3',
        inputModuleVersion: semver.parse('1.2.3'),
        inputMinecraftVersion: semver.parse('4.5.6'),
        onlyUsePrereleaseInfo: true,
    },
    {
        testDescription:
            'Removes prerelease info from minecraft version override when only using prerelease info from input',
        expectedString: '1.2.3-preview.20',
        inputModuleVersion: semver.parse('1.2.3-beta.0'),
        inputMinecraftVersion: semver.parse('4.5.6-preview.20'),
        onlyUsePrereleaseInfo: true,
    },
];

interface VersionOrderTestCase {
    expectedOrder: number;
    moduleVersion: semver.SemVer;
    minecraftVersion: semver.SemVer;
}

describe(`Version Parsing`, () => {
    for (const versionTest of versionEqualityTestCases) {
        it(versionTest.testDescription, function () {
            expect(versionTest.expectedString).toEqual(
                utils.appendMinecraftVersion(
                    versionTest.inputModuleVersion,
                    versionTest.inputMinecraftVersion,
                    versionTest.onlyUsePrereleaseInfo
                )
            );
        });
    }

    it('Sorts Versions Correctly', () => {
        const versionOrderTestCases: VersionOrderTestCase[] = [
            {
                expectedOrder: 2,
                moduleVersion: semver.parse('1.0.0-beta'),
                minecraftVersion: semver.parse('1.1.0-preview.1'),
            },
            {
                expectedOrder: 0,
                moduleVersion: semver.parse('1.0.0-beta'),
                minecraftVersion: semver.parse('1.0.0-preview.1'),
            },
            {
                expectedOrder: 1,
                moduleVersion: semver.parse('1.0.0-beta'),
                minecraftVersion: semver.parse('1.0.0'),
            },
            {
                expectedOrder: 5,
                moduleVersion: semver.parse('1.0.0'),
                minecraftVersion: semver.parse('1.2.0'),
            },
            {
                expectedOrder: 3,
                moduleVersion: semver.parse('1.0.0-beta'),
                minecraftVersion: semver.parse('1.1.0'),
            },
            {
                expectedOrder: 4,
                moduleVersion: semver.parse('1.0.0'),
                minecraftVersion: semver.parse('1.2.0-preview.1'),
            },
            {
                expectedOrder: 6,
                moduleVersion: semver.parse('1.1.0-beta'),
                minecraftVersion: semver.parse('1.1.0-preview.1'),
            },
        ];

        const sortedVersions = versionOrderTestCases.sort((a, b) => {
            const aVersion = utils.appendMinecraftVersion(a.moduleVersion, a.minecraftVersion);
            const bVersion = utils.appendMinecraftVersion(b.moduleVersion, b.minecraftVersion);
            return semver.compare(aVersion, bVersion);
        });

        for (let i = 0; i < sortedVersions.length; ++i) {
            expect(i).toEqual(sortedVersions[i].expectedOrder);
        }
    });

    it("Beta Minecraft release modules are 'less than' non-beta release modules", () => {
        const betaMinecraftRelease = semver.parse('1.2.3-preview.4');
        const nonBetaMinecraftRelease = semver.parse('1.2.3');

        const betaModule = utils.appendMinecraftVersion(semver.parse('1.0.0-beta'), betaMinecraftRelease);
        const nonBetaModule = utils.appendMinecraftVersion(semver.parse('1.0.0-beta'), nonBetaMinecraftRelease);

        expect(semver.lt(betaModule, nonBetaModule)).toBeTruthy();
        expect(semver.gt(nonBetaModule, betaModule)).toBeTruthy();
    });
});
