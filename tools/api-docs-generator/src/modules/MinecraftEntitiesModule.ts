// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { Intersect, Literal, Record, Static } from 'runtypes';

import { getCommonVanillaDataFieldsRecord, VanillaModuleNameDataValidator } from './IMinecraftModule';

export const MinecraftEntitiesModuleRecord = Intersect(
    getCommonVanillaDataFieldsRecord(VanillaModuleNameDataValidator, 'entity'),
    Record({
        module_type: Literal('vanilla_data'),
    })
);
export type MinecraftEntitiesModule = Static<typeof MinecraftEntitiesModuleRecord>;
