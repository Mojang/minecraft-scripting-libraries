// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Array, Boolean, Intersect, Literal, Optional, Record, Static, String, Union } from 'runtypes';

import {
    CommonModuleDataValidator,
    IMinecraftModule,
    ModuleNameDataValidator,
    RuntimeDataModule,
} from './IMinecraftModule';
import { MinecraftEngineDataModule } from './MinecraftEngineDataModules';

export const afterEventsOrderModuleName = 'engine-after_events_ordering';
export function getAfterEventsOrderingModuleFrom(engineModuleArray: RuntimeDataModule<MinecraftEngineDataModule>[]) {
    return engineModuleArray.find(module => module.name === afterEventsOrderModuleName);
}

export const MinecraftAfterEventOrderRecord = Record({ name: String });
export type MinecraftEventOrder = Static<typeof MinecraftAfterEventOrderRecord>;

export const MinecraftAfterEventsOrderByVersionRecord = Intersect(
    ModuleNameDataValidator,
    Record({
        version_is_prerelease: Optional(Boolean),
        module_prerelease_tag: Optional(
            Union(Literal('alpha'), Literal('beta'), Literal('internal'), Literal('preview'), Literal('rc'))
        ),
        version: String,
        event_order: Array(MinecraftAfterEventOrderRecord),
    })
);
export type MinecraftAfterEventsOrderByVersion = Static<typeof MinecraftAfterEventsOrderByVersionRecord>;

export const MinecraftAfterEventsOrderModuleRecord = Intersect(
    CommonModuleDataValidator,
    Record({
        module_type: Literal('after_events_ordering'),

        after_events_order_by_version: Array(MinecraftAfterEventsOrderByVersionRecord),
    })
);
export type MinecraftAfterEventsOrderModule = Static<typeof MinecraftAfterEventsOrderModuleRecord>;

export function isAfterEventsOrderModule(module: IMinecraftModule): module is MinecraftAfterEventsOrderModule {
    return module !== undefined && module.module_type === 'after_events_ordering';
}
