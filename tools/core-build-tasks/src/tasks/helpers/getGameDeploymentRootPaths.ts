// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { MinecraftProduct } from '../../platforms/index';
import path, { resolve } from 'path';
import { getOrThrowFromProcess } from './getOrThrowFromProcess';

export function getGameDeploymentRootPaths(): Record<MinecraftProduct, string | undefined> {
    const localAppDataPath = process.env['LOCALAPPDATA'];
    const appDataPath = process.env['APPDATA'];
    const customDeploymentPath = process.env['CUSTOM_DEPLOYMENT_PATH'];
    return {
        BedrockGDK: appDataPath ? resolve(appDataPath, 'Minecraft Bedrock/Users/Shared/games/com.mojang/') : undefined,
        PreviewGDK: appDataPath
            ? resolve(appDataPath, 'Minecraft Bedrock Preview/Users/Shared/games/com.mojang/')
            : undefined,
        BedrockUWP: localAppDataPath
            ? resolve(localAppDataPath, 'Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/')
            : undefined,
        PreviewUWP: localAppDataPath
            ? resolve(
                  localAppDataPath,
                  'Packages/Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe/LocalState/games/com.mojang/'
              )
            : undefined,
        EducationUWP: localAppDataPath
            ? resolve(
                  localAppDataPath,
                  'Packages/Microsoft.MinecraftEducationEdition_8wekyb3d8bbwe/LocalState/games/com.mojang/'
              )
            : undefined,
        EducationDesktop: appDataPath
            ? resolve(appDataPath, 'Minecraft Education Edition/games/com.mojang/')
            : undefined,
        Custom: customDeploymentPath ? customDeploymentPath : undefined,
    };
}

export function getTargetWorldPath(): string {
    let deploymentPath: string | undefined = undefined;
    let product: MinecraftProduct;
    try {
        product = getOrThrowFromProcess<MinecraftProduct>('MINECRAFT_PRODUCT');
        deploymentPath = getGameDeploymentRootPaths()[product];
    } catch (_) {
        throw new Error('Unable to get deployment path. Make sure to configure package root correctly.');
    }

    if (deploymentPath === undefined) {
        throw new Error('Deployment path is undefined. Make sure to configure package root correctly.');
    }

    const projectName = getOrThrowFromProcess('PROJECT_NAME');
    const worldsFolderName = product === MinecraftProduct.Custom ? 'worlds' : 'minecraftWorlds';
    const activeWorldFolderName = product === MinecraftProduct.Custom ? 'Bedrock level' : `${projectName}world`;
    return path.join(deploymentPath, worldsFolderName, activeWorldFolderName);
}
