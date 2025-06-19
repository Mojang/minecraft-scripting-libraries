// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { KeyToParentTypeMapping, KeyToTypeMapping } from '../modules/KeyToTypeMapping';

/*
 * Scan for all objects with array properties.
 */
export function scanObjectForMemberArray(
    object: Record<string, unknown>,
    callback: (parentObject: Record<string, Array<unknown>>, propertyName: string) => void
): void {
    if (object instanceof Object) {
        for (const k in object) {
            if (Object.prototype.hasOwnProperty.call(object, k) && object[k] !== undefined) {
                if (Array.isArray(object[k])) {
                    callback(object as Record<string, Array<unknown>>, k);
                }

                // Recursive call to scan property
                scanObjectForMemberArray(object[k] as Record<string, unknown>, callback);
            }
        }
    }
}

/**
 * Scan for all objects with a property with the specified name.
 *
 * If KeyType exists as a key of KeyToTypeMapping, the parent object is a Record with a key of the mapped type,
 * If KeyType also exists as a key of KeyToParentTypeMapping, the parent object is the type defined in that mapping
 * Otherwise if the KeyType is not a key of either mapping, the parent object is a dictionary with unknown keys
 */
export function scanObjectForMemberWithName<
    KeyType extends string,
    ParentType = KeyType extends keyof KeyToTypeMapping
        ? KeyType extends keyof KeyToParentTypeMapping
            ? KeyToParentTypeMapping[KeyType]
            : Record<KeyType, KeyToTypeMapping[KeyType]>
        : Record<string, unknown>,
>(object: Record<string, unknown>, memberName: KeyType, callback: (parentObject: ParentType) => void): void {
    if (object instanceof Object) {
        for (const k in object) {
            if (Object.prototype.hasOwnProperty.call(object, k) && object[k] !== undefined) {
                // If we are at a member we are looking for
                if (k === memberName) {
                    callback(object as ParentType);
                }

                // Recursive call to scan property
                scanObjectForMemberWithName(object[k] as Record<string, unknown>, memberName, callback);
            }
        }
    }
}

/*
 * Scan for all objects with both of two properties with the given names. Does not include 'changelog' fields.
 */
export function scanObjectForMembersWithNamesNoChangelog<
    KeyType1 extends keyof KeyToTypeMapping,
    KeyType2 extends keyof KeyToTypeMapping,
    ParentType = Pick<KeyToTypeMapping, KeyType1 | KeyType2>,
>(
    object: Record<string, unknown>,
    memberName1: KeyType1,
    memberName2: KeyType2,
    callback: (parentObject: ParentType) => void
): void {
    scanObjectForMembersWithNames_internal<KeyType1, KeyType2, ParentType>(
        object,
        memberName1,
        memberName2,
        ['changelog'],
        callback
    );
}

/*
 * Scan for all objects with both of two properties with the given names.
 */
export function scanObjectForMembersWithNames<
    KeyType1 extends keyof KeyToTypeMapping,
    KeyType2 extends keyof KeyToTypeMapping,
    ParentType = Pick<KeyToTypeMapping, KeyType1 | KeyType2>,
>(
    object: Record<string, unknown>,
    memberName1: KeyType1,
    memberName2: KeyType2,
    callback: (parentObject: ParentType) => void
): void {
    scanObjectForMembersWithNames_internal<KeyType1, KeyType2, ParentType>(
        object,
        memberName1,
        memberName2,
        [],
        callback
    );
}

function scanObjectForMembersWithNames_internal<
    KeyType1 extends keyof KeyToTypeMapping,
    KeyType2 extends keyof KeyToTypeMapping,
    ParentType = Pick<KeyToTypeMapping, KeyType1 | KeyType2>,
>(
    object: Record<string, unknown>,
    memberName1: KeyType1,
    memberName2: KeyType2,
    keysToSkip: string[],
    callback: (parentObject: ParentType) => void
): void {
    if (object instanceof Object) {
        let hasMember1 = false;
        let hasMember2 = false;
        for (const k in object) {
            if (keysToSkip.includes(k)) {
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(object, k) && object[k] !== undefined) {
                // If we are at a member we are looking for
                if (k === memberName1) {
                    hasMember1 = true;
                } else if (k === memberName2) {
                    hasMember2 = true;
                }

                // Recursive call to scan property
                scanObjectForMembersWithNames(object[k] as Record<string, unknown>, memberName1, memberName2, callback);
            }
        }
        if (hasMember1 && hasMember2) {
            callback(object as ParentType);
        }
    }
}

/*
 * Scan for all objects with properties matching any of a list of names.
 *
 * This function can process multiple types of objects, so it is necessary to explicitly define the type in the callback.
 */
export function scanObjectForMemberWithAnyNamesFromList(
    object: Record<string, unknown>,
    memberNames: string[],
    callback: (parentObject: Record<string, unknown>, propertyName: string) => void
): void {
    if (object instanceof Object) {
        for (const k in object) {
            if (Object.prototype.hasOwnProperty.call(object, k) && object[k] !== undefined) {
                if (memberNames.some(name => k === name)) {
                    callback(object, k);
                }

                scanObjectForMemberWithAnyNamesFromList(object[k] as Record<string, unknown>, memberNames, callback);
            }
        }
    }
}
