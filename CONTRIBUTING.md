# Contributing

This project welcomes contributions and suggestions. Most contributions require you to
agree to a Contributor License Agreement (CLA) declaring that you have the right to,
and actually do, grant us the rights to use your contribution. For details, visit
https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need
to provide a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the
instructions provided by the bot. You will only need to do this once across all repositories using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/)
or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Specific Guidelines

Contributions to these libraries are welcome! These libraries are maintained by Mojang but we are open to contributions and bug fixes. In general, we consider the backwards compatibility and versioning to be the absolute top priority when making changes to the libraries. Because of this, we strictly adhere to SemVer for changes, and libraries depend on Minecraft modules at specific major versions as well.

### Use Conventional Commit PR Titles

Releases are automated with [semantic-release](https://github.com/semantic-release/semantic-release). PRs are squash-merged, and the resulting commit message decides whether, and how, each package changed by the PR is released. The PR title (or the commit message, for single-commit PRs) **must** follow [Conventional Commits](https://www.conventionalcommits.org/); a PR check enforces this.

| Title                                                                 | Release    |
| --------------------------------------------------------------------- | ---------- |
| `feat: ...`                                                           | Minor      |
| `fix: ...`, `perf: ...`                                               | Patch      |
| `feat!: ...` (any type with `!`), or a `BREAKING CHANGE:` footer      | Major      |
| `docs:`, `chore:`, `refactor:`, `test:`, `build:`, `ci:`, `style:`... | No release |

An optional scope can name the package, for example `fix(math): handle zero-length vectors`. The scope is only for readability: semantic-release releases every package whose files the commit touches, and packages that depend on a released package get a patch release.

When the PR merges to `main`, the release workflow publishes to npm, pushes a `<package>_v<version>` tag and creates a GitHub release with the release notes. Nothing is committed back to the repo:

- Package versions are checked in as `0.0.0-semantically-released`. The released version comes from the package's latest git tag and is only written into `package.json` in CI at publish time.
- Dependencies on other packages in this repo are checked in as `"*"` and are published as `^<released version>`.
- There are no checked-in changelogs; release notes for each version are on the repo's [GitHub Releases](https://github.com/Mojang/minecraft-scripting-libraries/releases) page.

The release tooling lives in [`.github/release`](./.github/release) and is not part of the root workspace. Maintainers can preview the next release from an up-to-date `main` with `cd .github/release && npm ci && npm run release:dry-run`.

### Use a Consistent Coding Style

- Use ESLint to lint (`npm run lint`)
- Use Prettier to style
  - VS Code is set up to format on save
  - The lint command also runs Prettier and can fix issues: `npm run lint:fix`

#### Naming

We generally follow the naming conventions specified by the [Google Style Guide](https://google.github.io/styleguide/jsguide.html#naming). There are other general good practices within the style guide as well, though generally the vast majority of our style is enforced via a combination of ESLint and Prettier enforcement at PR time.
