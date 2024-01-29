# Core Build Tasks

This package contains common build tasks used within the minecraft-scripting-libraries build, but can be used in other repositories as well. If a task is used by `just` in multiple packages, it is moved into this package to reduce duplication.

This subdirectory only runs the `build` step, and more specifically, only runs `tsc` today since this package itself defines build tasks, so it must be kept lightweight.
