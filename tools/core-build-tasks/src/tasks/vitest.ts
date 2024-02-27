// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from 'child_process';

export function vitestTask() {
    return () => {
        execSync('vitest', { stdio: 'inherit' });
    };
}
