// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RGBA } from '@minecraft/server';

/**
 * A set of commonly used color constants, represented as RGBA values.
 *
 * @public
 */
export const Colors = {
    Black: { red: 29 / 255, green: 29 / 255, blue: 33 / 255, alpha: 1 } as RGBA,
    Blue: { red: 60 / 255, green: 68 / 255, blue: 170 / 255, alpha: 1 } as RGBA,
    Brown: { red: 131 / 255, green: 84 / 255, blue: 50 / 255, alpha: 1 } as RGBA,
    Cyan: { red: 22 / 255, green: 156 / 255, blue: 156 / 255, alpha: 1 } as RGBA,
    Gray: { red: 71 / 255, green: 79 / 255, blue: 82 / 255, alpha: 1 } as RGBA,
    Green: { red: 94 / 255, green: 124 / 255, blue: 22 / 255, alpha: 1 } as RGBA,
    LightBlue: { red: 58 / 255, green: 179 / 255, blue: 218 / 255, alpha: 1 } as RGBA,
    Lime: { red: 128 / 255, green: 199 / 255, blue: 31 / 255, alpha: 1 } as RGBA,
    Magenta: { red: 199 / 255, green: 78 / 255, blue: 189 / 255, alpha: 1 } as RGBA,
    Orange: { red: 249 / 255, green: 128 / 255, blue: 29 / 255, alpha: 1 } as RGBA,
    Pink: { red: 243 / 255, green: 139 / 255, blue: 170 / 255, alpha: 1 } as RGBA,
    Purple: { red: 137 / 255, green: 50 / 255, blue: 184 / 255, alpha: 1 } as RGBA,
    Red: { red: 176 / 255, green: 46 / 255, blue: 38 / 255, alpha: 1 } as RGBA,
    Silver: { red: 157 / 255, green: 157 / 255, blue: 151 / 255, alpha: 1 } as RGBA,
    White: { red: 240 / 255, green: 240 / 255, blue: 240 / 255, alpha: 1 } as RGBA,
    Yellow: { red: 254 / 255, green: 216 / 255, blue: 61 / 255, alpha: 1 } as RGBA,
    PureWhite: { red: 1, green: 1, blue: 1, alpha: 1 } as RGBA,
    PureBlack: { red: 0, green: 0, blue: 0, alpha: 1 } as RGBA,
    PureRed: { red: 1, green: 0, blue: 0, alpha: 1 } as RGBA,
    PureGreen: { red: 0, green: 1, blue: 0, alpha: 1 } as RGBA,
    PureBlue: { red: 0, green: 0, blue: 1, alpha: 1 } as RGBA,
    Transparent: { red: 0, green: 0, blue: 0, alpha: 0 } as RGBA,
};
