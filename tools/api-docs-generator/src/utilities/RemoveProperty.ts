// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export function removePropertyRecursive(value: Record<string, unknown>, propertyName: string): void {
    for (const prop in value) {
        if (prop === propertyName) {
            delete value[prop];
        } else if (typeof value[prop] === 'object') {
            removePropertyRecursive(value[prop] as Record<string, unknown>, propertyName);
        }
    }
}
