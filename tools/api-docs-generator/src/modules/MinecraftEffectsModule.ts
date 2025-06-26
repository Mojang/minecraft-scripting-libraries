// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Intersect, Literal, Record, Static } from 'runtypes';

import { getCommonVanillaDataFieldsRecord, VanillaModuleNameDataValidator } from './IMinecraftModule';

export const MinecraftEffectsModuleRecord = Intersect(
    getCommonVanillaDataFieldsRecord(VanillaModuleNameDataValidator, 'effect'),
    Record({
        module_type: Literal('vanilla_data'),
    })
);
export type MinecraftEffectsModule = Static<typeof MinecraftEffectsModuleRecord>;
