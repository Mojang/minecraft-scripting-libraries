// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { EntityEventOptions, WeatherChangeAfterEvent, EntityRemoveAfterEvent } from '@minecraft/server';

export enum WeatherType {
    Clear = 'Clear',
    Rain = 'Rain',
    Thunder = 'Thunder',
}
export function createWeatherEvent(dim: string): WeatherChangeAfterEvent {
    return { dimension: dim, newWeather: WeatherType.Clear, previousWeather: WeatherType.Rain };
}
export type WeatherChangeAfterEventCallback = (event: WeatherChangeAfterEvent) => void;
export const MockWeatherChangeEventHandlers: WeatherChangeAfterEventCallback[] = [];

export type EntityRemoveAfterEventCallback = (event: EntityRemoveAfterEvent) => void;
export type MockEntityRemoveAfterEventCallbackData = {
    callback: EntityRemoveAfterEventCallback;
    options?: EntityEventOptions;
};
export const MockEntityRemoveEventHandlers: MockEntityRemoveAfterEventCallbackData[] = [];

export function clearMockState() {
    MockWeatherChangeEventHandlers.length = 0;
    MockEntityRemoveEventHandlers.length = 0;
}

export const createMockServerBindings = () => {
    return {
        world: {
            afterEvents: {
                weatherChange: {
                    subscribe: (callback: WeatherChangeAfterEventCallback) => {
                        MockWeatherChangeEventHandlers.push(callback);
                        return callback;
                    },
                    unsubscribe: (callback: WeatherChangeAfterEventCallback) => {
                        const index = MockWeatherChangeEventHandlers.indexOf(callback);
                        if (index !== -1) {
                            MockWeatherChangeEventHandlers.splice(index, 1);
                        }
                    },
                },
                entityRemove: {
                    subscribe: (callback: EntityRemoveAfterEventCallback, options?: EntityEventOptions) => {
                        MockEntityRemoveEventHandlers.push({ callback, options });
                        return callback;
                    },
                    unsubscribe: (callback: EntityRemoveAfterEventCallback) => {
                        const index = MockEntityRemoveEventHandlers.findIndex(value => value.callback === callback);
                        if (index !== -1) {
                            MockEntityRemoveEventHandlers.splice(index, 1);
                        }
                    },
                },
            },
        },
    };
};
