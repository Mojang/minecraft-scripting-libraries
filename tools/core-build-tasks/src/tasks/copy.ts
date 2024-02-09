// Copyright (c) Mojang AB.  All rights reserved.

import { FileSystem } from '@rushstack/node-core-library';
import path from 'path';
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

function copyFilesToOutputPath(originPaths: string[], outputPath: string) {
    const destinationPath = path.resolve(outputPath);
    for (const originPath of originPaths) {
        const inputPath = path.resolve(originPath);
        const pathStats = FileSystem.getLinkStatistics(inputPath);
        if (pathStats.isDirectory()) {
            console.log(`Copying folder ${inputPath} to ${destinationPath}`);
            FileSystem.copyFiles({
                sourcePath: inputPath,
                destinationPath: destinationPath,
            });
        } else {
            const filename = path.parse(inputPath).base;
            const destinationFilePath = path.resolve(destinationPath, filename);
            console.log(`Copying file ${inputPath} to ${destinationPath}`);
            FileSystem.copyFiles({
                sourcePath: inputPath,
                destinationPath: destinationFilePath,
            });
        }
    }
}

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

        copyFilesToOutputPath(params.copyToBehaviorPacks, path.join(deploymentPath, BehaviorPacksPath, projectName));
        copyFilesToOutputPath(
            params.copyToScripts,
            path.join(deploymentPath, BehaviorPacksPath, projectName, 'scripts')
        );
        if (params.copyToResourcePacks) {
            copyFilesToOutputPath(
                params.copyToResourcePacks,
                path.join(deploymentPath, ResourcePacksPath, projectName)
            );
        }
    };
}
