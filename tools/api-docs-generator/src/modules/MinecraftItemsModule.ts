// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Intersect, Literal, Record, Static } from 'runtypes';

import { getCommonVanillaDataFieldsRecord, VanillaModuleNameDataValidator } from './IMinecraftModule';

export const MinecraftItemsModuleRecord = Intersect(
    getCommonVanillaDataFieldsRecord(VanillaModuleNameDataValidator, 'item'),
    Record({
        module_type: Literal('vanilla_data'),
    })
);
export type MinecraftItemsModule = Static<typeof MinecraftItemsModuleRecord>;
