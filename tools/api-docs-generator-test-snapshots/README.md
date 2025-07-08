# api-docs-generator-test-snapshots

This package contains vitest snapshots for various @minecraft/api-docs-generator scenarios, processing different configurations of Minecraft API metadata with different combinations of markup generator outputs.

It exists as a separate package in order to import both @minecraft/api-docs-generator and the @minecraft/markup-generators-plugin packages and test them together.

## Testing

This package is validated with a series of vitest snapshot tests that validate generated markup for specific scenarios. When making changes to the generator, please add new scenarios or update the existing scenarios.

Snapshot tests will fail if the number of files generated or the contents of the files change. If snapshot changes are expected, you can update them by running: `npm run test:update` at the root of the repository.

It is possible to run specific tests using `npm run test -- -- --test <name>`, where `<name>` is a pattern matching `.test.ts`/`.spec.ts`file names. Running this in the JavaScript Debug Terminal allows for debugging specific tests (see above).

