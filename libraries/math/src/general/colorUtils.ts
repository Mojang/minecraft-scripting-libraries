// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RGBA } from '@minecraft/server';

/**
 * A set of commonly used color constants, represented as RGBA values.
 *
 * @public
 */
export const Colors = {
    Black: { red: 29, green: 29, blue: 33, alpha: 1 } as RGBA,
    Blue: { red: 60, green: 68, blue: 170, alpha: 1 } as RGBA,
    Brown: { red: 131, green: 84, blue: 50, alpha: 1 } as RGBA,
    Cyan : { red: 22, green: 156, blue: 156, alpha: 1 } as RGBA,
    Gray : { red: 71, green: 79, blue: 82, alpha: 1 } as RGBA,
    Green: { red: 94, green: 124, blue: 22, alpha: 1 } as RGBA,
    LightBlue: { red: 58, green: 179, blue: 218, alpha: 1 } as RGBA,
    Lime: { red: 128, green: 199, blue: 31, alpha: 1 } as RGBA,
    Magenta: { red: 199, green: 78, blue: 189, alpha: 1 } as RGBA,
    Orange: { red: 249, green: 128, blue: 29, alpha: 1 } as RGBA,
    Pink: { red: 243, green: 139, blue: 170, alpha: 1 } as RGBA,
    Purple: { red: 137, green: 50, blue: 184, alpha: 1 } as RGBA,
    Red: { red: 176, green: 46, blue: 38, alpha: 1 } as RGBA,
    Silver: { red: 157, green: 157, blue: 151, alpha: 1 } as RGBA,
    White: { red: 240, green: 240, blue: 240, alpha: 1 } as RGBA,
    Yellow: { red: 254, green: 216, blue: 61, alpha: 1 } as RGBA,
    PureWhite: { red: 255, green: 255, blue: 255, alpha: 1 } as RGBA,
    PureBlack: { red: 0, green: 0, blue: 0, alpha: 1 } as RGBA,
    PureRed: { red: 255, green: 0, blue: 0, alpha: 1 } as RGBA,
    PureGreen: { red: 0, green: 255, blue: 0, alpha: 1 } as RGBA,
    PureBlue: { red: 0, green: 0, blue: 255, alpha: 1 } as RGBA,
    Transparent: { red: 0, green: 0, blue: 0, alpha: 0 } as RGBA,
}