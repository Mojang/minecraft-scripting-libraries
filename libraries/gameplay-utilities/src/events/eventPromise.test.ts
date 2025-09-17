// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';
import { world } from '@minecraft/server';
import { nextEvent } from './eventPromise.js';

/*
function createWorldMock() {
    return {
        afterEvents: {
            weatherChange: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn(),
            },
            entityDie: {
                subscribe: vi.fn(),
                unsubscribe: vi.fn(),
            },
        },
    };
}

vi.mock('@minecraft/server', () => {
    const world = createWorldMock();
    return { world } as const;
});
*/

describe('EventPromise', () => {
    it('Event is subscribed', () => {
        void nextEvent(world.afterEvents.weatherChange);
        expect(world.afterEvents.weatherChange).toBeCalled();
    });
});
