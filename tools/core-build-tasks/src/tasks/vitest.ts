// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { execSync } from 'child_process';

export interface VitestTaskOptions {
    test?: string;
    update?: boolean;
}

export function vitestTask(options: VitestTaskOptions = {}) {
    return () => {
        const cmd = [
            'npx',
            'vitest',
            // Use --passWithNoTests so that turbo doesn't fail on packages without a matching test
            ...(options.test ? ['--passWithNoTests', options.test] : []),
            ...(options.update ? ['--update'] : []),
        ].join(' ');
        return execSync(cmd, { stdio: 'inherit' });
    };
}
