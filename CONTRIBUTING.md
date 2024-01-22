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

Contributions to these libraries are welcome! These libraries are maintained by Mojang but we are open to contributions and bug fixes. In general, we consider the backwards compatibility and versioning to be the absolute top priority when making changes to the libraries. Because of this, we strictly adhere to semver for changes, and libraries depend on minecraft modules at specific major versions as well. Any PR submitted to any library **must** contain a change file using the beachball tool to indicate the severity of the change. When a change is submitted, it will automatically update versions and publish to NPM via our pipelines.

### Naming

We generally follow the naming conventiosn specified by the [google style guide](https://google.github.io/styleguide/jsguide.html#naming). There is other general good practice within the style guide as well, though generally the vast majority of our style is enforced via a combination of ESLint and prettier enforcement at PR time.