// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CoreVanillaDataFields, IMinecraftModule } from './IMinecraftModule';
import { MinecraftBlockModule } from './MinecraftBlockModule';

export type MinecraftVanillaDataModule = CoreVanillaDataFields | MinecraftBlockModule;

export function isVanillaDataModule(module: IMinecraftModule): module is MinecraftVanillaDataModule {
    return module !== undefined && module.module_type === 'vanilla_data';
}
