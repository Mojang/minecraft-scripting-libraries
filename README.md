# minecraft-scripting-libraries

This repository contains a set of scripting libraries for use with the minecraft scripting modules in creating content for the game. The repository is structured as a javascript "monorepo" that contains multiple packages. These packages are fully javascript and are typically intended to server as helper libraries that can be commonly used when creating content. The libraries are provided both through NPM, but also in pre-bundled forms in cases where user workflows do not leverage techniques such as bundling for their own content creation.

More details on each individual library are in the README files for individual packages. The packages are located generally within the libraries subfolder.

# Working in the repository

## Prerequisites

1. Install the latest LTS of [Node](https://nodejs.org/en/download) (20 or higher) and confirm after installation that you have NPM 10 or higher also installed.
    1. It is recommended to use [nvm](https://github.com/nvm-sh/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) for ease of management of node version installation.
1. Globally install the [turbo tool](https://turbo.build/repo/docs/installing) using the command `npm install --global turbo`. The turbo tool is used under the covers for all of the build scripts, and having it accessible globally is convenient for running builds from subdirectories as well.

## Install

Run

```ts
npm install
```

from the root of this repository to install all appropriate dependencies.

## Build

To build all packages, run

```
npm run build
```

This will build all packages in this repository in the right order using `turbo`. This is equivalent to running `turbo build`. If you would like to build or work on a specific package, perform a full build first, and then navigate to the package you care about and from there you can then run `npm run build` to build that specific package. Each individual package has it's own README and potentially additional scripts. Refer to the readme per package for more information.

## Linting

All packages are validated via ESLint with a consistent set of rules as well as enforces styling through prettier. To explicitly run linting, use `npm run lint`, and some changes can be fixed automatically with `npm run lint -- --fix`.

## Testing

All packages support testing via `vitest`. Tests are authored with the `.test.ts` suffix and tests can be run with `npm run test`.

# Contributing

Contributions to these libraries are welcome! These libraries are maintained by Mojang team but we are open to contributions and bug fixes. In general, we consider the backwards compatibility and versioning to be the absolute top priority when making changes to the libraries. Because of this, we strictly adhere to semver for changes, and libraries depend on minecraft modules at specific major versions as well. Any PR submitted to any library **must** contain a change file using the beachball tool to indicate the severity of the change. When a change is submitted, it will automatically update versions and publish to NPM via our pipelines.