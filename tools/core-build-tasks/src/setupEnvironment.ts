// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import dotenv from 'dotenv';

/**
 * Loads the environment variables.
 * @param envPath - path to the .env file.
 */
export function setupEnvironment(envPath: string) {
    dotenv.config({ path: envPath });
}
