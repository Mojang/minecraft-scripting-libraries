# Core Build Tasks

This package contains common build tasks used within the minecraft-scripting-libraries build, but can be used in other repositories as well. The tasks are designed to be used with the [just](https://microsoft.github.io/just/tasks/) task runner, as this is the task runner integrated into all of the minecraft starter kits and libraries. If a task is used by `just` in multiple packages, it is moved into this package to reduce duplication.

This subdirectory primarily runs the `build` step, and more specifically, only runs `tsc` today since this package itself defines build tasks, so it must be kept lightweight. After build tooling is built, subsequent lint and test can be run on this directory.

Note, this package builds using both CommonJS modules and ESM because the just task runner expects imports to support common JS. We support ESM as well in the event these tasks are used in a different environment.
