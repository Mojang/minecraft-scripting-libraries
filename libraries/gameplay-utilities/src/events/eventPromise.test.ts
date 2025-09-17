// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it, vi } from 'vitest';
import { nextEvent } from './eventPromise.js';
import { WeatherChangeAfterEvent } from '@minecraft/server';

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

describe('EventPromise', () => {
    it('Event is subscribed', () => {
        const world = createWorldMock();
        let receivedCallback: ((event: WeatherChangeAfterEvent) => void) | undefined = undefined;
        expect(receivedCallback).toBeUndefined();
        vi.spyOn(world.afterEvents.weatherChange, 'subscribe').mockImplementation(callback => {
            receivedCallback = callback as (event: WeatherChangeAfterEvent) => void;
        });
        void nextEvent(world.afterEvents.weatherChange);
        expect(world.afterEvents.weatherChange.subscribe).toBeCalled();
        expect(receivedCallback).toBeDefined();
    });
});
