// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Non-exhaustive list of product variants used to deploy files to the correct location.
 */
export enum MinecraftProduct {
    BedrockGDK = 'BedrockGDK',
    PreviewGDK = 'PreviewGDK',
    Bedrock = 'BedrockUWP',
    Preview = 'PreviewUWP',
    EducationUWP = 'EducationUWP',
    EducationDesktop = 'EducationDesktop',
    Custom = 'Custom',
}
