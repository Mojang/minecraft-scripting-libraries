// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Intersect, Literal, Record, Static } from 'runtypes';

import { getCommonVanillaDataFieldsRecord, VanillaModuleNameDataValidator } from './IMinecraftModule';

export const MinecraftDimensionsModuleRecord = Intersect(
    getCommonVanillaDataFieldsRecord(VanillaModuleNameDataValidator, 'dimension'),
    Record({
        module_type: Literal('vanilla_data'),
    })
);
export type MinecraftDimensionsModule = Static<typeof MinecraftDimensionsModuleRecord>;
