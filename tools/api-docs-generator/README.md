# @minecraft/api-docs-generator

This package ingests [Minecraft API module metadata](https://github.com/Mojang/bedrock-samples/tree/main/metadata) and outputs various generated files such as documentation, TypeScript `.d.ts` files, and more. Requires usage of a markup generator plugin to provide output configurations, such as [@minecraft/markup-generators-plugin](../markup-generators-plugin/README.md) or a custom defined plugin.

## Installation

- Install [NPM/Node](https://www.npmjs.com/) version 22.x or above.
- Clone this repository.
- Install dependencies: `npm install`
- Build the repository: `npm run build`

## CLI Usage

Usage: `minecraft-api-docs-generator [options]`

Options:

```
  -i, --input-directory           Directory of the API metadata JSON input files.
  -o, --output-directory          Directory to output generated types and documentation to.
  -d, --docs-directory            Directory of the documentation info.JSON files that provide description strings for API modules.
  -g, --run-generators            IDs of markup generators to render output files with.

  -m, --include-modules           Mode which determines which input modules should be included in generation.
  -b, --include-base              If set, will include base modules in generation for metadata that would be merged to a parent module.
      --changelog-strategy        String ID of the changelog strategy to use when comparing modules.

  -p, --plugin                    Plugin packages to import generators and templates from.
  -c, --config                    Path to a config file with options.
      --no-config                 If set, will not look for any config files.

  -l, --log                       Logging options.
  -s, --suppress                  Suppresses all output except for errors

      --version                   Show version number
  -h, --help                      Show help
```

### Example

```
minecraft-api-docs-generator -i ./input -o ./out -d ./docs -g msdocs ts
```

### Markup Generators

The `run-generators` argument requires the ID of a markup generator defined in a plugin package imported via the `plugin` argument or in the config file.

Multiple markup generators can be ran in the same instance by supplying multiple IDs, e.g.: `--run-generators msdocs ts`

By default, `@minecraft/api-docs-generator` will assume you have imported `@minecraft/markup-generators-plugin` if no other plugins are defined via CLI or config options. See the `markup-generators-plugin` [README](../markup-generators-plugin/README.md) for more info.

### Plugins

The `plugin` argument allows importing additional markup generators from external plugin packages. See [ARCHITECTURE](./ARCHITECTURE.md#plugins) for more info on creating and using external plugins for custom functionality.

## Generating API Types

To generate API types using the most recent type metadata:

1. Use NPM to globally install both api-docs-generator and the markup generators plugin: `npm install -g @minecraft/api-docs-generator @minecraft/markup-generators-plugin`
2. Clone the [bedrock-samples](https://github.com/Mojang/bedrock-samples/tree/main/metadata) repository.
3. Run the generator using `bedrock-samples\metadata` as the input directory. e.g.:

```
minecraft-api-docs-generator -i C:\bedrock-samples\metadata -o .\out
```

## Development

`npm run build` compiles `@minecraft/api-doc-generator` TS definitions and JS files into `lib`.

`npm run lint` runs ESLint and Prettier on project TS source files. `npm run lint:fix` attempts to fix Prettier issues.

`npm run test` runs a suite of tests. `npm run test:update` updates the test snapshots. See [Testing](#testing) for more details.

`npm run clean` cleans all build output.

`npm run package` generates an NPM tarball which you can then `npm install` in other NPM packages for local tool usage.

### Debugging

We recommend using Visual Studio Code's [JavaScript Debug Terminal](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_javascript-debug-terminal) for debugging purposes.

## Testing

This package is validated with a series of vitest snapshot tests that validate generated markup for specific scenarios. When making changes to the generator, please add new scenarios or update the existing scenarios.

Snapshot tests will fail if the number of files generated or the contents of the files change. If snapshot changes are expected, you can update them by running: `npm run test:update` at the root of the repository.

It is possible to run specific tests using `npm run test -- -- --test <name>`, where `<name>` is a pattern matching `.test.ts`/`.spec.ts`file names. Running this in the JavaScript Debug Terminal allows for debugging specific tests (see above).

