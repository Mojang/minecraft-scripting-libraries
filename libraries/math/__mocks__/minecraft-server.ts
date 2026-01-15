// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Vector3 } from '@minecraft/server';
import { Vector3Utils } from '../src/vector3/coreHelpers.js';

export class BlockVolume {
    constructor(
        public from: Vector3,
        public to: Vector3
    ) {
        this.from = Vector3Utils.floor(from);
        this.to = Vector3Utils.floor(to);
    }
}

export const createMockServerBindings = () => {
    return { BlockVolume };
};
