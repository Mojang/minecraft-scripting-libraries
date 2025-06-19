// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import semver from 'semver';
import { MinecraftRelease } from '../MinecraftRelease';
import * as utils from '../utilities';
import { FilterGroup } from './Filters';

function addTOCName(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            scriptModule.display_changelog_in_toc = !!scriptModule.is_latest_module;
            scriptModule.md_toc_name = scriptModule.name.replace('@', '');
            if (!scriptModule.is_latest_module) {
                scriptModule.md_toc_name += ' ' + semver.major(scriptModule.version) + '.x.x';
            }
        }
    }
}

function addVersionBookmarkNames(releases: MinecraftRelease[]) {
    for (const release of releases) {
        for (const scriptModule of release.script_modules) {
            utils.scanObjectForMemberWithName(scriptModule, 'version', jsonObject => {
                if (typeof jsonObject.version === 'string') {
                    jsonObject.version_bookmark_name = jsonObject.version.replaceAll('.', '');
                }
            });
        }
    }
}

export const MarkdownFilters: FilterGroup = {
    id: 'md',
    filters: [
        ['add_toc_names', addTOCName],
        ['add_version_bookmark_names', addVersionBookmarkNames],
    ],
};
