// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it } from 'vitest';
import { runGeneratorForTest } from '../runGeneratorForTest';
import { join } from 'path';

describe('Type Linking', () => {
    it('Properly generates documentation for types that are linked', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
            expectedLoggedErrorMessages: [
                '[ERROR] Link(s) not found in @minecraft/example-module-2 version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem}","@minecraft/example-module.ExampleProblem"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module-2 version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem2}","@minecraft/example-module.ExampleProblem2"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module-2 version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem3}","@minecraft/example-module.ExampleProblem3"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem4}","@minecraft/example-module.ExampleProblem4"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module version 1.1.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem4}","@minecraft/example-module.ExampleProblem4"]]',
            ],
        });
    });

    it('Properly generates documentation for types that are linked with including base module', () => {
        runGeneratorForTest({
            testDir: __dirname,
            generators: ['ts', 'msdocs'],
            additionalArgs: '--include-base',
            outDir: join(__dirname, 'include_base_output'),
            expectedLoggedErrorMessages: [
                '[ERROR] Link(s) not found in @minecraft/example-module-2 version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem}","@minecraft/example-module.ExampleProblem"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module-2 version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem2}","@minecraft/example-module.ExampleProblem2"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module-2 version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem3}","@minecraft/example-module.ExampleProblem3"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module version 1.0.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem4}","@minecraft/example-module.ExampleProblem4"]]',
                '[ERROR] Link(s) not found in @minecraft/example-module version 1.1.0. Please check spelling or if the modules or members are defined: [["{@link @minecraft/example-module.ExampleProblem4}","@minecraft/example-module.ExampleProblem4"]]',
            ],
        });
    });
});
