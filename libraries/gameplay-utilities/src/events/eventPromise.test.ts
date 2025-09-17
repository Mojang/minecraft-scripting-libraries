// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { afterEach, describe, it, vi, expect } from 'vitest';

import {
    clearMockState,
    createMockServerBindings,
    MockWeatherChangeEventHandlers,
    createWeatherEvent,
    MockEntityRemoveEventHandlers,
} from '../../__mocks__/minecraft-server.js';

vi.mock('@minecraft/server', () => createMockServerBindings());

import { nextEvent } from './eventPromise.js';

describe('EventPromise', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        clearMockState();
    });

    it('Event is subscribed', () => {
        const server = createMockServerBindings();
        void nextEvent(server.world.afterEvents.weatherChange);
        expect(MockWeatherChangeEventHandlers.length).toBe(1);
    });

    // specifically this test differs from above because this signal supports filters
    it('Event is subscribed without filter', () => {
        const server = createMockServerBindings();
        void nextEvent(server.world.afterEvents.entityRemove);
        expect(MockEntityRemoveEventHandlers.length).toBe(1);
    });

    it('Event is subscribed with filter', () => {
        const server = createMockServerBindings();
        void nextEvent(server.world.afterEvents.entityRemove, { entityTypes: ['foobar'] });
        expect(MockEntityRemoveEventHandlers.length).toBe(1);
    });

    it('Event is unsubscribed when called', async () => {
        const server = createMockServerBindings();
        const prom = nextEvent(server.world.afterEvents.weatherChange);
        const event = createWeatherEvent('foo');
        MockWeatherChangeEventHandlers.forEach(handler => {
            handler(event);
        });
        await prom;
        expect(MockWeatherChangeEventHandlers.length).toBe(0);
    });

    it('Event is gathered from await promise', async () => {
        const server = createMockServerBindings();
        const eventExpected = createWeatherEvent('foobar');
        setTimeout(() => {
            MockWeatherChangeEventHandlers.forEach(handler => {
                handler(eventExpected);
            });
        }, 100);
        const eventActual = await nextEvent(server.world.afterEvents.weatherChange);
        expect(eventActual).toBe(eventExpected);
    });
});
