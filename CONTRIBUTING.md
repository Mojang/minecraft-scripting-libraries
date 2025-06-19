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

### Use Beachball Versioning

All PRs submitted for any package **must** contain a change file using the Beachball tool to indicate the severity of the change. When a change is submitted, it will automatically update versions and publish to NPM via our pipelines. Use `npm run change` to generate changefiles with Beachball.

### Use a Consistent Coding Style

- Use ESLint to lint (`npm run lint`)
- Use Prettier to style
  - VS Code is set up to format on save
  - The lint command also runs Prettier and can fix issues: `npm run lint:fix`

#### Naming

We generally follow the naming conventions specified by the [Google Style Guide](https://google.github.io/styleguide/jsguide.html#naming). There are other general good practices within the style guide as well, though generally the vast majority of our style is enforced via a combination of ESLint and Prettier enforcement at PR time.
