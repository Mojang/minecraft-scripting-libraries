// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import semver from 'semver';

/**
 * Appends unique build info to pre-release tags to ensure unique module names per release.
 *
 * If 'onlyUsePrereleaseInfo' is set to true, we only use the prerelease part of the Minecraft version,
 * e.g. "-preview.5" out of "1.2.3-preview.5"
 */
export function appendMinecraftVersion(
    parsedVersion: semver.SemVer,
    minecraftVersion: semver.SemVer,
    onlyUsePrereleaseInfo?: boolean
): string {
    const versionToAppend =
        onlyUsePrereleaseInfo && minecraftVersion.prerelease.length > 0
            ? minecraftVersion.prerelease.join('.')
            : minecraftVersion.toString();

    let correctedVersion = !onlyUsePrereleaseInfo
        ? parsedVersion
        : semver.parse(`${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch}`);

    if (minecraftVersion.prerelease.length === 2) {
        // Pre-release Minecraft
        if (correctedVersion.prerelease.length > 0) {
            // Pre-release module
            correctedVersion = semver.parse(`${correctedVersion.format()}.${versionToAppend}`);
        } else {
            // Stable module
            correctedVersion = semver.parse(
                `${correctedVersion.format()}-${onlyUsePrereleaseInfo ? '' : 'rc.'}${versionToAppend}`
            );
        }
    } else if (minecraftVersion.prerelease.length === 0) {
        // Stable Minecraft
        if (correctedVersion.prerelease.length > 0) {
            // Pre-release module
            correctedVersion = semver.parse(`${correctedVersion.format()}.${versionToAppend}-stable`);
        }
    } else {
        throw new Error(`Unexpected prerelease tag in Minecraft version '${minecraftVersion.format()}'.`);
    }

    return correctedVersion.format();
}
