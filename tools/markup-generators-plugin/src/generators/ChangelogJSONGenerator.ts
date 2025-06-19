// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import fs from 'fs';
import path from 'path';

import {
    DisabledChangelogStrategy,
    GeneratorContext,
    IMinecraftModule,
    Logger,
    MarkupGenerator,
    MinecraftRelease,
    getAfterEventsOrderingModuleFrom,
    moduleHasChangelog,
} from '@minecraft/api-docs-generator';

export class ChangelogJSONGenerator implements MarkupGenerator {
    generateFiles(context: GeneratorContext, releases: MinecraftRelease[], outputDirectory: string): Promise<void> {
        if (releases.length === 0) {
            Logger.warn(`No releases found, '${this.name}' generation not possible.`);
            return;
        }
        if (context.changelogStrategy instanceof DisabledChangelogStrategy) {
            Logger.warn(`Generator '${this.name}' requires a changelog strategy!`);
            return;
        }

        let modulesToChangelog: IMinecraftModule[] = releases[0].getLatestScriptModules();
        modulesToChangelog = modulesToChangelog.concat(releases[0].command_modules);

        const afterEventsModule = getAfterEventsOrderingModuleFrom(releases[0].engine_data_modules);
        if (afterEventsModule) {
            modulesToChangelog = modulesToChangelog.concat(afterEventsModule);
        }

        for (const moduleJson of modulesToChangelog) {
            if (moduleHasChangelog(moduleJson)) {
                const moduleName = moduleJson.name;

                const changelogsFile = path.join(outputDirectory, `${moduleName}.json`);
                Logger.info(`Writing changelog to disk: ${changelogsFile}`);
                fs.mkdirSync(path.dirname(changelogsFile), { recursive: true });

                let fileContents = JSON.stringify(moduleJson.changelog, undefined, 2);
                fileContents = fileContents.replace(/\r?\n/g, '\r\n');
                fs.writeFileSync(changelogsFile, fileContents);
            }
        }

        return Promise.resolve();
    }

    readonly id: string = 'changelog-json';
    readonly name: string = 'Changelog JSON';
    readonly outputDirectoryName: string = 'changelog';
}
