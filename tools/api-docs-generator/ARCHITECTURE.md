## Architecture

`@minecraft/api-docs-generator` is a tool to generate types definitions and documentation for Minecraft APIs from metadata exported from the game client. The generator uses [Runtypes](https://github.com/runtypes/runtypes) to validate JSON-formatted API metadata and [Mustache.js](https://github.com/janl/mustache.js) templates to render it into various output types. We use [vitest](https://github.com/vitest-dev/vitest) for validating changes to the repo. Code style is enforced using Prettier and ESLint via GitHub workflows.

```
@minecraft/api-docs-generator
├── core
│   └── src
│       ├── filters      - Filter sets that manipulate the API metadata and add additional markup prior to output
│       ├── modules      - Contains types for API metadata validation
│       ├── plugins      - Exports types used for defining markup generators used by api-docs-generator
│       ├── utilities    - Various utility functions used by api-docs-generator
│       ├── changelog.ts - Logic for generating module changelog metadata
│       ├── cli.ts       - The primary command-line entry point which runs the api-docs-generator
│       └── generator.ts - Contains the main logic of api-docs-generator, exports the 'generate' function
```

### Generation Flow

In `generator.ts`, the `generate()` function runs the main logic of the API docs generator, which loads the input API metadata and validates it based on the module type using the runtypes defined in `modules`, and then sorts them into `MinecraftRelease` objects according to the `minecraft_version` field in each module. Some Scripting modules have special merging logic that is handled by `getMergedScriptModules()` in order to merge those modules into a parent module, resulting in one unified output for both input modules.

After the releases are created the generator needs to determine changes from version to version to allow for marking APIs as prerelease or deprecated. The changelog logic starts in `changelog.ts` with `ChangelogGenerator.generateChangelogs()` and iterates over the module metadata and compares modules based on the version key specified by the `ChangelogStrategy` object, either `version` (default, for Scripting version comparison) or `minecraft_version` (for Minecraft release comparison). Changelog objects containing the differences between the modules are added to each module as a `changelog` field.

Based on which generators were specified to run, the metadata is then processed by several filter sets to add additional markup. For example, the `addDescriptionsAndExamples()` filter reads the input `info.json` documentation files loaded via the `--docs-directory` argument and matches them to their associated APIs to add description strings.

Finally, once the metadata has been fully processed, each generator renders its mustache templates and outputs files to the output directory.

### Plugins

External packages can be set up to extend `@minecraft/api-docs-generator` with additional functionality through custom [MarkupGenerator](./src/plugins/MarkupGenerator.ts) logic.

To extend the api-docs-generator with a custom plugin, create an NPM module with a default export using the [Plugin](./src/plugins/Plugin.ts) type, providing one or more `MarkupGenerator` objects, and any template file folder paths that will be used by the generator.

To use markup generators provided by external plugins, set up an NPM workspace to depend on both `@minecraft/api-docs-generator` and the plugin package, run `npm install`, then run the docs generator with the `--plugin` argument and the name of your installed plugin package. The `--run-generators` option can then use any generator IDs exposed by the plugin package.

Alternatively using a config file, create `api-docs-generator.config.mjs` in the directory where the docs generator will run and specify the plugin name:

```ts
export default {
    plugins: ['name-of-plugin']
}
```

#### Markup Generator Options

Custom markup generators may require configuration options, for example:

```ts
import { GeneratorContext, MarkupGenerator, MarkupGeneratorOptions, MinecraftRelease } from '@minecraft/api-docs-generator';

interface ExampleOptions extends MarkupGeneratorOptions {
    option: string;
}

class ExampleGenerator implements MarkupGenerator<ExampleOptions> {
    generateFiles(
        context: GeneratorContext,
        _releases: MinecraftRelease[],
        outputDirectory: string,
        options: ExampleOptions
    ): Promise<void> { ... }

    readonly id: string = 'example-generator';
    ...
}
```

Generator options are then specified in `api-docs-generator.config.mjs` using the generator ID:

```ts
export default {
    generators: {
        'example-generator': {
            option: 'Example'
        },
    }
}
```
