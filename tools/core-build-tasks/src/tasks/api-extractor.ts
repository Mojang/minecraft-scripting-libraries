// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Extractor, ExtractorConfig, ExtractorResult } from '@microsoft/api-extractor';

/**
 * A just task which executes API extractor based on the api-extractor.json configuration in the root of a package.
 * @param jsonFile - the api-extractor.json file to use
 * @beta
 */
export function apiExtractorTask(jsonFile: string, localBuild: boolean) {
    return () => {
        console.log(`Running a ${localBuild ? 'local' : 'production'} api extractor build.`);

        const apiExtractorJsonPath: string = jsonFile;
        const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);

        const extractorResult: ExtractorResult = Extractor.invoke(extractorConfig, {
            // Equivalent to the "--local" command-line parameter
            localBuild,

            // Equivalent to the "--verbose" command-line parameter
            showVerboseMessages: true,
        });

        if (extractorResult.succeeded) {
            console.log(`API Extractor completed successfully`);
            process.exitCode = 0;
            return Promise.resolve();
        }

        const message = `API Extractor did not complete successfully. ${extractorResult.errorCount} errors found and ${extractorResult.warningCount} warnings found. These must be addressed for the test to succeed.`;

        console.error(message);
        process.exitCode = 1;
        return Promise.reject(new Error(message));
    };
}
