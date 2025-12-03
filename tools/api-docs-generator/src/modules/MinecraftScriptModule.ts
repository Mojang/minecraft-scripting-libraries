// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    Array,
    Boolean,
    Intersect,
    Lazy,
    Literal,
    Null,
    Number,
    Optional,
    Record,
    Runtype,
    Static,
    String,
    Union,
    Unknown,
} from 'runtypes';

import { CommonCommentFlagsValidator, CommonModuleDataValidator, IMinecraftModule } from './IMinecraftModule';

/**
 * Common type for named objects which get additional formatted names added at runtime
 */
export const NameMarkupRecord = Record({
    name: String,

    // Runtime Markup
    bookmark_name: Optional(String),
    filepath_name: Optional(String),
    variable_name: Optional(String),
});
export type NameMarkupType = Static<typeof NameMarkupRecord>;

/**
 * Common type for objects with versions for additional formatted version info added at runtime
 */
export const VersionMarkupRecord = Record({
    version: String,

    // Runtime Markup
    version_bookmark_name: Optional(String),
    version_selector: Optional(String),
});
export type VersionMarkupType = Static<typeof VersionMarkupRecord>;

/**
 * Common type for runtime markup of documentation formatting tags
 */
export const MarkupCommentFlagsValidator = Intersect(
    CommonCommentFlagsValidator,
    Record({
        has_changes: Optional(Boolean),
        has_defaults: Optional(Boolean),
        has_bounds: Optional(Boolean),
        has_errors: Optional(Boolean),

        prerelease: Optional(String),
        is_prerelease: Optional(Boolean),
        is_deprecated: Optional(Boolean),
        deprecated_version: Optional(String),

        has_runtime_conditions: Optional(Boolean),

        has_closure_privilege_type_comments: Optional(Boolean),
        has_privilege_comments: Optional(Boolean),

        // TypeScript Specific Markup
        ts_has_comments: Optional(Boolean),
        ts_has_remarks: Optional(Boolean),

        // MsDocs Specific Markup
        msdocs_has_comments: Optional(Boolean),
    })
);
export type MarkupCommentFlags = Static<typeof MarkupCommentFlagsValidator>;

/**
 * Flags to determine whether the generated markup came from native metadata or directly
 * from script. Based on this flag, script specific markup could be used instead.
 */
export const MarkupSourceValidator = Record({
    is_script_generated: Optional(Boolean),
    raw_script_text: Optional(String),
    raw_tsdoc_text: Optional(String),
});
export type MarkupSource = Static<typeof MarkupSourceValidator>;

export const MinecraftExampleRecord = Intersect(
    NameMarkupRecord,
    Record({
        code: Record({
            text: Array(String),
            escaped_text: Array(String),
        }),
    })
);
export type MinecraftExample = Static<typeof MinecraftExampleRecord>;

/**
 * Common type for markup added during generation
 */
export const DocumentationMarkupValidator = Intersect(
    MarkupCommentFlagsValidator,
    MarkupSourceValidator,
    Record({
        examples: Optional(Array(MinecraftExampleRecord)),
        deprecated_description: Optional(Array(String).Or(Null)),
        throws_description: Optional(Array(String).Or(Null)),
        closure_privilege_type_name: Optional(String),
    })
);
export type MinecraftDocumentableObject = Static<typeof DocumentationMarkupValidator>;

export const PrivilegeValueTypeRecord = Record({
    name: String,
});
export type PrivilegeValueType = Static<typeof PrivilegeValueTypeRecord>;
export enum PrivilegeTypes {
    Default = 'default',
    RestrictedExec = 'restricted_execution',
    EarlyExec = 'early_execution',

    Deprecated_None = 'none', // now default
    Deprecated_ReadOnly = 'read_only', // now restricted_execution
}

export const MinecraftModuleDescriptionRecord = Intersect(
    NameMarkupRecord,
    VersionMarkupRecord,
    Record({
        uuid: Optional(String),

        // Runtime Markup
        is_external_module: Optional(Boolean),
        prior_version: Optional(String),
        folder_path: Optional(String),
    })
);
export type MinecraftModuleDescription = Static<typeof MinecraftModuleDescriptionRecord>;

export const MinecraftModuleDependencyRecord = Intersect(
    NameMarkupRecord,
    Record({
        uuid: Optional(String),
        versions: Array(VersionMarkupRecord),
        types_only: Optional(Boolean),

        // Runtime Markup
        from_module: Optional(MinecraftModuleDescriptionRecord),
        is_latest_major: Optional(Boolean),
        is_vanilla_data: Optional(Boolean),
    })
);
export type MinecraftModuleDependency = Static<typeof MinecraftModuleDependencyRecord>;

export const MinecraftTypeKeyList = [
    'type',
    'return_type',
    'element_type',
    'closure_type',
    'base_types',
    'argument_types',
    'derived_types',
    'promise_type',
    'variant_types',
    'optional_type',
    'iterator',
    'iterator_type',
    'key_type',
    'value_type',
    'error_types',
    'generator_type',
    'yield_type',
    'next_type',
    'data_buffer_type',
];

export const MinecraftClosureTypeRecord = Lazy(() =>
    Record({
        argument_types: Array(MinecraftTypeRecord),
        return_type: MinecraftTypeRecord,
        call_privilege: Optional(PrivilegeValueTypeRecord),
    })
);
export type MinecraftClosureType = Static<typeof MinecraftClosureTypeRecord>;

export const MinecraftGeneratorTypeRecord = Lazy(() =>
    Record({
        yield_type: MinecraftTypeRecord,
        return_type: MinecraftTypeRecord,
        next_type: MinecraftTypeRecord,
    })
);
export type MinecraftGeneratorType = Static<typeof MinecraftGeneratorTypeRecord>;

// Helper to enable type checking with Lazy recursive Runtype (https://github.com/runtypes/runtypes/issues/14#issuecomment-307601932)
type MinecraftTypeHelper = {
    name: string;
    is_errorable: boolean;
    is_bind_type: boolean;
    from_module?: MinecraftModuleDescription;
    valid_range?: {
        min: number;
        max: number;
    };

    closure_type?: MinecraftClosureType;
    element_type?: MinecraftTypeHelper;
    error_types?: MinecraftTypeHelper[];
    generator_type?: MinecraftGeneratorType;
    iterator_type?: MinecraftTypeHelper;
    key_type?: MinecraftTypeHelper;
    optional_type?: MinecraftTypeHelper;
    promise_type?: MinecraftTypeHelper;
    value_type?: MinecraftTypeHelper;
    variant_types?: MinecraftTypeHelper[];
    data_buffer_type?: MinecraftTypeHelper;

    // Runtime Markup
    original_name?: string;
    is_void_return?: boolean;
    is_string?: boolean;
    is_undefined?: boolean;
    is_any?: boolean;
    is_closure?: boolean;
    is_array?: boolean;
    is_promise?: boolean;
    is_variant?: boolean;
    is_optional?: boolean;
    is_optional_type?: boolean;
    is_iterator?: boolean;
    is_iterator_result?: boolean;
    is_map?: boolean;
    is_generator?: boolean;
    is_data_buffer?: boolean;
};
export const MinecraftTypeRecord: Runtype<MinecraftTypeHelper> = Lazy(() =>
    Intersect(
        NameMarkupRecord,
        Record({
            is_errorable: Boolean,
            is_bind_type: Boolean,
            from_module: Optional(MinecraftModuleDescriptionRecord),
            valid_range: Optional(
                Record({
                    min: Number,
                    max: Number,
                }).Or(Null)
            ),

            closure_type: Optional(MinecraftClosureTypeRecord),
            element_type: Optional(MinecraftTypeRecord),
            error_types: Optional(Array(MinecraftTypeRecord)),
            generator_type: Optional(MinecraftGeneratorTypeRecord),
            iterator_type: Optional(MinecraftTypeRecord),
            optional_type: Optional(MinecraftTypeRecord),
            promise_type: Optional(MinecraftTypeRecord),
            value_type: Optional(MinecraftTypeRecord),
            variant_types: Optional(Array(MinecraftTypeRecord)),

            // Runtime Markup
            original_name: Optional(String),
            is_string: Optional(Boolean),
            is_undefined: Optional(Boolean),
            is_any: Optional(Boolean),
            is_closure: Optional(Boolean),
            is_array: Optional(Boolean),
            is_promise: Optional(Boolean),
            is_variant: Optional(Boolean),
            is_optional: Optional(Boolean),
            is_optional_type: Optional(Boolean),
            is_iterator: Optional(Boolean),
            is_iterator_result: Optional(Boolean),
            is_map: Optional(Boolean),
            is_generator: Optional(Boolean),
        })
    )
);
export type MinecraftType = Static<typeof MinecraftTypeRecord>;

export const MinecraftObjectRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        property_description: Optional(Array(String).Or(Null)),
    })
);
export type MinecraftObject = Static<typeof MinecraftObjectRecord>;
export function hasObjects(obj: object): obj is { objects: MinecraftObject[] } {
    return obj !== undefined && 'objects' in obj;
}

export const MinecraftConstantRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        type: MinecraftTypeRecord,
        is_read_only: Literal(true),
        is_static: Literal(true),
        value: Optional(Unknown),

        // Runtime Markup
        property_name: Optional(String),
        property_description: Optional(Array(String).Or(Null)),
        is_member: Optional(Literal(true)),
        constant_value: Optional(
            Record({
                value: Unknown,
            })
        ),
    })
);
export type MinecraftConstant = Static<typeof MinecraftConstantRecord>;
export function hasConstants(obj: object): obj is { constants: MinecraftConstant[] } {
    return obj !== undefined && 'constants' in obj;
}

export const MinecraftEnumRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        constants: Array(MinecraftConstantRecord),

        // Runtime Markup
        from_module: Optional(MinecraftModuleDescriptionRecord.Or(Null)),
        is_enum: Optional(Literal(true)),
        enum_name: Optional(String.Or(Null)),
        enum_description: Optional(Array(String).Or(Null)),
        show_prior_warning: Optional(Boolean),
        prior_link: Optional(String),
    })
);
export type MinecraftEnum = Static<typeof MinecraftEnumRecord>;
export function hasEnums(obj: object): obj is { enums: MinecraftEnum[] } {
    return obj !== undefined && 'enums' in obj;
}

export const MinecraftPropertyRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        type: MinecraftTypeRecord,
        is_read_only: Boolean,
        has_min: Optional(Boolean),
        min_value: Optional(Unknown.Or(Null)),
        has_max: Optional(Boolean),
        max_value: Optional(Unknown.Or(Null)),
        is_baked: Optional(Boolean),
        default_value: Optional(Unknown.Or(Null)),
        min_added: Optional(Boolean),
        min_changed: Optional(Boolean),
        min_removed: Optional(Boolean),
        max_added: Optional(Boolean),
        max_changed: Optional(Boolean),
        max_removed: Optional(Boolean),

        // Runtime Markup
        property_name: Optional(String.Or(Null)),
        property_description: Optional(Array(String).Or(Null)),
        is_member: Optional(Boolean),
        get_privilege: Optional(Array(PrivilegeValueTypeRecord)),
        set_privilege: Optional(Array(PrivilegeValueTypeRecord)),
        get_allowed_in_early_execution: Optional(Boolean),
        set_allowed_in_early_execution: Optional(Boolean),
        get_disallowed_in_restricted_execution: Optional(Boolean),
        set_disallowed_in_restricted_execution: Optional(Boolean),
    })
);
export type MinecraftProperty = Static<typeof MinecraftPropertyRecord>;
export function hasProperties(obj: object): obj is { properties: MinecraftProperty[] } {
    return obj !== undefined && 'properties' in obj;
}

export const MinecraftFunctionArgumentDetailsRecord = Record({
    default_value: Optional(Unknown.Or(Null)),
    has_min: Optional(Unknown.Or(Null)),
    min_value: Optional(Unknown.Or(Null)),
    has_max: Optional(Unknown.Or(Null)),
    max_value: Optional(Unknown.Or(Null)),
    supported_values: Optional(Unknown.Or(Null)),
});
export type MinecraftFunctionArgumentDetails = Static<typeof MinecraftFunctionArgumentDetailsRecord>;

export const MinecraftFunctionArgumentRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        type: MinecraftTypeRecord,
        details: Optional(MinecraftFunctionArgumentDetailsRecord.Or(Null)),
        min_added: Optional(Boolean),
        min_changed: Optional(Boolean),
        min_removed: Optional(Boolean),
        max_added: Optional(Boolean),
        max_changed: Optional(Boolean),
        max_removed: Optional(Boolean),

        // Runtime Markup
        argument_description: Optional(Array(String).Or(Null)),
        argument_valid_values: Optional(
            Array(
                Record({
                    argument_valid_value: Union(String, Number),
                    argument_valid_value_end: Boolean,
                })
            ).Or(Null)
        ),
    })
);
export type MinecraftFunctionArgument = Static<typeof MinecraftFunctionArgumentRecord>;

export const MinecraftFunctionRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        is_constructor: Boolean,
        is_static: Optional(Boolean.Or(Null)),
        return_type: MinecraftTypeRecord,
        arguments: Array(MinecraftFunctionArgumentRecord),
        disable_unsafe_name_check: Optional(Boolean.Or(Null)),
        runtime_conditions: Optional(Array(String).Or(Null)),

        // Runtime Markup
        is_member: Optional(Boolean),
        function_name: Optional(String.Or(Null)),
        function_description: Optional(Array(String).Or(Null)),
        returns_description: Optional(Array(String).Or(Null)),
        stable_only: Optional(Boolean),
        call_privilege: Optional(Array(PrivilegeValueTypeRecord)),
        call_allowed_in_early_execution: Optional(Boolean),
        call_disallowed_in_restricted_execution: Optional(Boolean),
        return_type_has_closure_privilege_type_comments: Optional(Boolean),
        return_type_closure_privilege_type_name: Optional(String),
    })
);
export type MinecraftFunction = Static<typeof MinecraftFunctionRecord>;
export function hasFunctions(obj: object): obj is { functions: MinecraftFunction[] } {
    return obj !== undefined && 'functions' in obj;
}

export const MinecraftErrorRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        type: MinecraftTypeRecord,

        properties: Optional(Array(MinecraftPropertyRecord).Or(Null)),

        // Runtime Markup
        base_types: Optional(Array(MinecraftTypeRecord).Or(Null)),
        from_module: Optional(MinecraftModuleDescriptionRecord.Or(Null)),
        class_name: Optional(String.Or(Null)),
        class_description: Optional(Array(String).Or(Null)),
        show_prior_warning: Optional(Boolean),
        prior_link: Optional(String),
    })
);
export type MinecraftError = Static<typeof MinecraftErrorRecord>;
export function hasErrors(obj: object): obj is { errors: MinecraftError[] } {
    return obj !== undefined && 'errors' in obj;
}

export const MinecraftClassRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        type: MinecraftTypeRecord,

        functions: Optional(Array(MinecraftFunctionRecord).Or(Null)),
        properties: Optional(Array(MinecraftPropertyRecord).Or(Null)),
        constants: Optional(Array(MinecraftConstantRecord).Or(Null)),
        runtime_conditions: Optional(Array(String).Or(Null)),

        base_types: Optional(Array(MinecraftTypeRecord).Or(Null)),
        derived_types: Optional(Array(MinecraftTypeRecord).Or(Null)),
        iterator: Optional(MinecraftTypeRecord.Or(Null)),

        // Runtime Markup
        from_module: Optional(MinecraftModuleDescriptionRecord.Or(Null)),
        class_name: Optional(String.Or(Null)),
        class_description: Optional(Array(String).Or(Null)),
        has_constructor: Optional(Boolean.Or(Null)),
        has_member_functions: Optional(Boolean.Or(Null)),
        has_member_constants: Optional(Boolean.Or(Null)),
        show_prior_warning: Optional(Boolean),
        prior_link: Optional(String),
    })
);
export type MinecraftClass = Static<typeof MinecraftClassRecord>;
export function hasClasses(obj: object): obj is { classes: MinecraftClass[] } {
    return obj !== undefined && 'classes' in obj;
}

export const MinecraftInterfaceRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        type: MinecraftTypeRecord,

        runtime_conditions: Optional(Array(String).Or(Null)),
        functions: Optional(Array(MinecraftFunctionRecord).Or(Null)),
        properties: Optional(Array(MinecraftPropertyRecord).Or(Null)),

        // Runtime Markup
        from_module: Optional(MinecraftModuleDescriptionRecord.Or(Null)),
        class_name: Optional(String.Or(Null)),
        class_description: Optional(Array(String).Or(Null)),
        is_interface: Optional(Literal(true)),
        has_member_functions: Optional(Boolean.Or(Null)),
        show_prior_warning: Optional(Boolean),
        prior_link: Optional(String),
    })
);
export type MinecraftInterface = Static<typeof MinecraftInterfaceRecord>;
export function hasInterfaces(obj: object): obj is { interfaces: MinecraftInterface[] } {
    return obj !== undefined && 'interfaces' in obj;
}

export const MinecraftTypeMappingRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        value: String,
    })
);
export type MinecraftTypeMapping = Static<typeof MinecraftTypeMappingRecord>;

export enum MinecraftTypeAliasTypes {
    TypeMap = 'type_map',
    ScriptGenerated = 'script_generated',
}
export const MinecraftTypeAliasTypesRecord = Union(
    Literal(MinecraftTypeAliasTypes.TypeMap),
    Literal(MinecraftTypeAliasTypes.ScriptGenerated)
);

export const MinecraftTypeAliasRecord = Intersect(
    DocumentationMarkupValidator,
    NameMarkupRecord,
    Record({
        alias_type: Optional(MinecraftTypeAliasTypesRecord.Or(Null)),
        type: Optional(MinecraftTypeRecord.Or(Null)),
        mappings: Optional(Array(MinecraftTypeMappingRecord).Or(Null)),

        // Runtime Markup
        from_module: Optional(MinecraftModuleDescriptionRecord.Or(Null)),
        alias_name: Optional(String.Or(Null)),
        is_type_map: Optional(Boolean.Or(Null)),
        alias_description: Optional(Array(String).Or(Null)),
        show_prior_warning: Optional(Boolean),
        prior_link: Optional(String),
    })
);
export type MinecraftTypeAlias = Static<typeof MinecraftTypeAliasRecord>;
export function hasTypeAliases(obj: object): obj is { type_aliases: MinecraftTypeAlias[] } {
    return obj !== undefined && 'type_aliases' in obj;
}

export const MinecraftScriptCoreExportsRecord = Record({
    errors: Optional(Array(MinecraftErrorRecord).Or(Null)),
    classes: Optional(Array(MinecraftClassRecord).Or(Null)),
    functions: Optional(Array(MinecraftFunctionRecord).Or(Null)),
    objects: Optional(Array(MinecraftObjectRecord).Or(Null)),
    interfaces: Optional(Array(MinecraftInterfaceRecord).Or(Null)),
    enums: Optional(Array(MinecraftEnumRecord).Or(Null)),
    constants: Optional(Array(MinecraftConstantRecord).Or(Null)),
    type_aliases: Optional(Array(MinecraftTypeAliasRecord).Or(Null)),
});
export type MinecraftScriptCoreExports = Static<typeof MinecraftScriptCoreExportsRecord>;

export const MinecraftParentModuleRecord = Record({
    name: String,
    uuid: Optional(String),
    version: Optional(String),
});
export type MinecraftParentModule = Static<typeof MinecraftParentModuleRecord>;

export const MinecraftScriptModuleRecord = Intersect(
    CommonModuleDataValidator,
    DocumentationMarkupValidator,
    NameMarkupRecord,
    VersionMarkupRecord,
    MinecraftScriptCoreExportsRecord,
    Record({
        module_type: Literal('script'),
        uuid: String,
        parentModule: Optional(Union(String, MinecraftParentModuleRecord).Or(Null)),
        marked_up_parent_module: Optional(
            Record({
                name: String,
                uuid: String,
                version: String,
            })
        ),
        dependencies: Optional(Array(MinecraftModuleDependencyRecord).Or(Null)),
        peer_dependencies: Optional(Array(MinecraftModuleDependencyRecord).Or(Null)),
    }),
    // Runtime Markup
    Record({
        version_is_prerelease: Optional(Boolean),
        module_prerelease_tag: Optional(
            Union(Literal('alpha'), Literal('beta'), Literal('internal'), Literal('preview'), Literal('rc'))
        ),
        from_module: Optional(MinecraftModuleDescriptionRecord.Or(Null)),
        bookmark_name: Optional(String.Or(Null)),

        available_module_versions: Optional(Array(String).Or(Null)),
        previous_module_version_chunks: Optional(
            Array(
                Record({
                    versions: Array(String).Or(Null),
                    prior_version_link: String,
                })
            )
        ),
        manifest_example_version_md: Optional(String.Or(Null)),
        manifest_example_version_ts: Optional(String.Or(Null)),

        module_description: Optional(Array(String).Or(Null)),
        md_toc_name: Optional(String.Or(Null)),
        display_changelog_in_toc: Optional(Boolean),
        is_latest_module: Optional(Boolean),
        is_latest_major: Optional(Boolean),
        show_prior_warning: Optional(Boolean),
        prior_link: Optional(String),
        major_version: Optional(Number),
    })
);
export type MinecraftScriptModule = Static<typeof MinecraftScriptModuleRecord>;

export function isScriptModule(module: IMinecraftModule): module is MinecraftScriptModule {
    return module !== undefined && module.module_type === 'script';
}
