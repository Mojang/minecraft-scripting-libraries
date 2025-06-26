// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as log from '../Logger';

export type DeepCopyType<T> = T extends object ? { [K in keyof T]: DeepCopyType<T[K]> } : T;

export function deepCopyJson<T>(value: T): DeepCopyType<T> {
    // eslint-disable-next-line unicorn/no-null
    if (value === undefined || value === null) {
        return undefined;
    }
    try {
        return JSON.parse(
            // eslint-disable-next-line unicorn/no-null
            JSON.stringify(value, (_key: string, value: unknown) => (typeof value === 'undefined' ? null : value))
        ) as DeepCopyType<T>;
    } catch (e) {
        if (e instanceof Error) {
            log.error(`deepCopyJson failed: ${e.message} @ ${e.stack}`);
        }
    }
}
