# Core Build Tasks

This package contains common build tasks used through the src-ts turbo build. If a task is used by `just` in multiple packages, it is moved into this package to reduce duplication. An example of this is the api-extractor task which is used by almost all packages in the src-ts subdirectory.

This subdirectory only runs the `build` step, and more specifically, only runs `tsc` today since this package itself defines build tasks, so it must be kept lightweight.
