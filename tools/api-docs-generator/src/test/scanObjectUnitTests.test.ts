// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it } from 'vitest';
import deepEqual from 'deep-equal';

import * as utils from '../utilities';

const DATA = {
    valueField: 0,
    objectField: {
        valueField: 1,
    },
    arrayField: [
        {
            valueField: 1,
        },
        {
            valueField: 0,
        },
        {
            valueField: true,
        },
        {
            valueField: false,
        },
        {
            objectField: {
                valueField: 1,
            },
        },
        {
            objectField: {
                valueField: 0,
            },
        },
        {
            objectField: {
                valueField: true,
            },
        },
        {
            objectField: {
                valueField: false,
            },
        },
        {
            arrayField: [
                {
                    arrayField: [
                        {
                            valueField: 1,
                        },
                        {
                            valueField: 0,
                        },
                        {
                            valueField: true,
                        },
                        {
                            valueField: false,
                        },
                        {
                            objectField: {
                                valueField: 1,
                            },
                        },
                        {
                            objectField: {
                                valueField: 0,
                            },
                        },
                        {
                            objectField: {
                                valueField: true,
                            },
                        },
                        {
                            objectField: {
                                valueField: false,
                            },
                        },
                    ],
                },
            ],
        },
    ],
};

describe('scanObjectForMemberArray Unit Tests', () => {
    it('Runs callback expected number of times', () => {
        let hits = 0;

        utils.scanObjectForMemberArray(DATA, _ => {
            ++hits;
        });

        expect(hits).toEqual(3);
    });
});

describe('scanObjectForMemberWithName Unit Tests', () => {
    it('Runs callback expected number of times', () => {
        let hits = 0;

        utils.scanObjectForMemberWithName(DATA, 'arrayField', _ => {
            ++hits;
        });

        expect(hits).toEqual(3);
    });

    it('Scan for value and replace it with an object with value field', () => {
        const dataCopy = JSON.parse(JSON.stringify(DATA)) as typeof DATA;
        let hits = 0;

        utils.scanObjectForMemberWithName(dataCopy, 'valueField', (jsonObject: { valueField: unknown }) => {
            ++hits;
            jsonObject.valueField = { value: jsonObject.valueField };
        });

        expect(hits).toEqual(18);
        expect(deepEqual(dataCopy.valueField, { value: 0 })).toBeTruthy();
        expect(deepEqual(dataCopy.objectField.valueField, { value: 1 })).toBeTruthy();
        expect(deepEqual(dataCopy.arrayField[0].valueField, { value: 1 })).toBeTruthy();
        expect(deepEqual(dataCopy.arrayField[4].objectField.valueField, { value: 1 })).toBeTruthy();
    });

    it('Scan for object and replace value on it with an object with value field', () => {
        const dataCopy = JSON.parse(JSON.stringify(DATA)) as typeof DATA;
        let hits = 0;

        utils.scanObjectForMemberWithName(
            dataCopy,
            'objectField',
            (jsonObject: { objectField: { valueField?: unknown } }) => {
                if (jsonObject.objectField.valueField !== undefined) {
                    ++hits;
                    jsonObject.objectField.valueField = {
                        value: jsonObject.objectField.valueField,
                    };
                }
            }
        );

        expect(hits).toEqual(9);
        expect(dataCopy.valueField).toEqual(0);
        expect(deepEqual(dataCopy.objectField.valueField, { value: 1 })).toBeTruthy();
        expect(dataCopy.arrayField[0].valueField).toEqual(1);
        expect(deepEqual(dataCopy.arrayField[4].objectField.valueField, { value: 1 })).toBeTruthy();
    });
});
