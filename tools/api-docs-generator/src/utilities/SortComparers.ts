// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import semver from 'semver';

export function nameSortComparer(element1: Record<'name', string>, element2: Record<'name', string>): number {
    return element1.name.localeCompare(element2.name);
}

export function semVerSortComparer<SemVerKey extends 'version' | 'minecraft_version' | 'schema_version'>(
    semverKeyName: SemVerKey
): (element1: Record<SemVerKey, string>, element2: Record<SemVerKey, string>) => number {
    return (element1, element2) => semver.compare(element1[semverKeyName], element2[semverKeyName]);
}

export function reverseSemVerSortComparer<SemVerKey extends 'version' | 'minecraft_version' | 'schema_version'>(
    semverKeyName: SemVerKey
): (element1: Record<SemVerKey, string>, element2: Record<SemVerKey, string>) => number {
    return (element1, element2) => semver.rcompare(element1[semverKeyName], element2[semverKeyName]);
}
