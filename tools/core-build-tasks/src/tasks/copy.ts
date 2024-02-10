// Copyright (c) Mojang AB.  All rights reserved.

import path from 'path';
import { copyFiles } from './helpers/copyFiles';
import { getOrThrowFromProcess } from './helpers/getOrThrowFromProcess';
import { getGameDeploymentRootPaths } from './helpers/getGameDeploymentRootPaths';
import { MinecraftProduct } from '../platforms/MinecraftProduct';

const BehaviorPacksPath = 'development_behavior_packs';
const ResourcePacksPath = 'development_resource_packs';

export type CopyTaskParameters = {
    /**
     * The paths to copy to behavior packs directory in the game.
     */
    copyToBehaviorPacks: string[];
    /**
     * The paths to copy to the scripts directory in the game.
     */
    copyToScripts: string[];
    /**
     * The paths to copy to resource packs directory in the game.
     */
    copyToResourcePacks?: string[];
};

/**
 * A just task which copies files to a specified output location.
 * Where there may be multiple output paths, and for each output path there may be multiple files.
 */
export function copyTask(params: CopyTaskParameters) {
    return () => {
        const projectName = getOrThrowFromProcess('PROJECT_NAME');

        let deploymentPath: string | undefined = undefined;
        try {
            const product = getOrThrowFromProcess<MinecraftProduct>('MINECRAFT_PRODUCT');
            deploymentPath = getGameDeploymentRootPaths()[product];
        } catch (_) {
            throw new Error('Unable to get deployment path. Make sure to configure package root correctly.');
        }

        if (deploymentPath === undefined) {
            throw new Error('Deployment path is undefined. Make sure to configure package root correctly.');
        }

        copyFiles(params.copyToBehaviorPacks, path.join(deploymentPath, BehaviorPacksPath, projectName));
        copyFiles(params.copyToScripts, path.join(deploymentPath, BehaviorPacksPath, projectName, 'scripts'));
        if (params.copyToResourcePacks) {
            copyFiles(params.copyToResourcePacks, path.join(deploymentPath, ResourcePacksPath, projectName));
        }
    };
}
