// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    Array,
    Boolean,
    Dictionary,
    Intersect,
    Number,
    Optional,
    Record,
    Runtype,
    Static,
    String,
    Union,
} from 'runtypes';

export const CommonDocsDescriptionValidator = Record({
    description: Optional(Array(String).Or(String)),
});
export type CommonDocsDescriptionData = Static<typeof CommonDocsDescriptionValidator>;

function generatorValidatorFromNested<T extends Runtype>(nestedValidator: T) {
    return Record({
        default: nestedValidator,
        beta: Optional(nestedValidator),
        alpha: Optional(nestedValidator),
        internal: Optional(nestedValidator),
        '1': Optional(nestedValidator),
        '2': Optional(nestedValidator),
        '3': Optional(nestedValidator),
        '4': Optional(nestedValidator),
        '5': Optional(nestedValidator),
        '6': Optional(nestedValidator),
        '7': Optional(nestedValidator),
        '8': Optional(nestedValidator),
        '9': Optional(nestedValidator),
        '10': Optional(nestedValidator),
    });
}

export const ScriptNestedCommonDocsValidator = Intersect(
    CommonDocsDescriptionValidator,
    Record({
        deprecated: Optional(
            Record({
                description: Optional(Array(String).Or(String)),
            })
        ),
        throws: Optional(
            Record({
                description: Optional(Array(String).Or(String)),
            })
        ),
    })
);
export type ScriptNestedCommonDocsData = Static<typeof ScriptNestedCommonDocsValidator>;

export const ScriptCommonDocsValidator = generatorValidatorFromNested(ScriptNestedCommonDocsValidator);
export type ScriptCommonDocsData = Static<typeof ScriptCommonDocsValidator>;

export const ScriptNestedFunctionDocsValidator = Intersect(
    ScriptNestedCommonDocsValidator,
    Record({
        arguments: Optional(
            Dictionary(
                Record({
                    description: Optional(Array(String).Or(String)),
                    valid_values: Optional(Array(Union(String, Number))),
                }),
                String
            )
        ),
        returns: Optional(
            Record({
                description: Optional(Array(String).Or(String)),
            })
        ),
    })
);
export type ScriptNestedFunctionDocsData = Static<typeof ScriptNestedFunctionDocsValidator>;

export const ScriptFunctionDocsValidator = generatorValidatorFromNested(ScriptNestedFunctionDocsValidator);
export type ScriptFunctionDocsData = Static<typeof ScriptFunctionDocsValidator>;

export const CommandDocsValidator = Intersect(
    CommonDocsDescriptionValidator,
    Record({
        arguments: Optional(
            Array(
                Record({
                    name: String,
                    description: Optional(Array(String).Or(String)),
                })
            )
        ),
        overloads: Optional(
            Array(
                Record({
                    id: Number,
                    description: Optional(Array(String).Or(String)),
                    header: Optional(String),
                })
            )
        ),
    })
);
export type CommandDocsData = Static<typeof CommandDocsValidator>;

export const CommandEnumDocsValidator = Intersect(
    CommonDocsDescriptionValidator,
    Record({
        values: Optional(
            Array(
                Record({
                    name: String,
                    description: Optional(Array(String).Or(String)),
                })
            )
        ),
    })
);
export type CommandEnumDocsData = Static<typeof CommandEnumDocsValidator>;

export const BlockDocsValidator = Intersect(
    CommonDocsDescriptionValidator,
    Record({
        properties: Optional(
            Array(
                Record({
                    name: String,
                    description: Optional(Array(String).Or(String)),
                })
            )
        ),
    })
);
export type BlockDocsData = Static<typeof BlockDocsValidator>;

export const BlockPropertyDocsValidator = Intersect(
    CommonDocsDescriptionValidator,
    Record({
        values: Optional(
            Array(
                Record({
                    name: Union(String, Number, Boolean),
                    description: Optional(Array(String).Or(String)),
                })
            )
        ),
        int_value_display_as_range: Optional(Boolean),
    })
);
export type BlockPropertyDocsData = Static<typeof BlockPropertyDocsValidator>;
