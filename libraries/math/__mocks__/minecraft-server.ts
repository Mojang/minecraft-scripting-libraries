// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { Vector3 } from '@minecraft/server';

export class BlockVolume {
    constructor(from: Vector3, to: Vector3) {
        this.from = from;
        this.to = to;

        this.from.x = Math.floor(this.from.x);
        this.from.y = Math.floor(this.from.y);
        this.from.z = Math.floor(this.from.z);

        this.to.x = Math.floor(this.to.x);
        this.to.y = Math.floor(this.to.y);
        this.to.z = Math.floor(this.to.z);
    }

    from: Vector3;
    to: Vector3;
}

export const createMockServerBindings = () => {
    return { BlockVolume };
};
