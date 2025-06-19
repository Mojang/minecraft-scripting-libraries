// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Intersect, Literal, Record, Static } from 'runtypes';

import { getCommonVanillaDataFieldsRecord, VanillaModuleNameDataValidator } from './IMinecraftModule';

export const MinecraftEnchantmentsModuleRecord = Intersect(
    getCommonVanillaDataFieldsRecord(VanillaModuleNameDataValidator, 'enchantment'),
    Record({
        module_type: Literal('vanilla_data'),
    })
);
export type MinecraftEnchantmentsModule = Static<typeof MinecraftEnchantmentsModuleRecord>;
