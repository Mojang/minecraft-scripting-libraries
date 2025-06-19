# @minecraft/markup-generators-plugin

This package extends [@minecraft/api-docs-generator](../api-docs-generator/README.md) with a core set of markup generators used to generate Minecraft API scripting types and documentation.

## Markup Generators

The optional `run-generators` argument uses a list of markup generator IDs described in the table below. If `run-generators` is not provided, then the generators marked as default will run:

| ID | Name | Default? | Description |
| :-- | :-- | :-: | :-- |
| msdocs | MSDocs | :heavy_check_mark: | Markdown documentation for Minecraft APIs. |
| ts | Typescript Definitions | :heavy_check_mark: | TypeScript type definitions for Minecraft APIs. |
| ts-source | Typescript Source | :heavy_check_mark: | TypeScript source generation for Minecraft `vanilla-data` APIs. |
| npm | NPM | :heavy_check_mark: | NPM module packaging. Requires `ts` and `ts-source`. |
| typedoc | TypeDoc | :heavy_check_mark: | TypeDoc formatted documentation. Requires `ts` and `ts-source`. |
| changelog | Changelog | :heavy_check_mark: | Markdown formatted changelog output for differences between API module versions. |
| changelog-json | Changelog JSON | | JSON changelog output. |
