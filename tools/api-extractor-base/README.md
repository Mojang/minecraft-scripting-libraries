# API-Extractor Base Configs

This package contains the base api-extractor config. For more information on API-Extractor, see [this link](https://api-extractor.com/).

In general, for this repository we automatically create a report file that will be located in the <project-folder>/api-report folder. This file is a markdown version of the rolled up types that is nice for display. There are also temporary JSON files generated during the build in case there is a desire to run more tooling, such as documentation generation. Finally, the default configuration rolls up all types into a lib/types folder by default, but the expectation is that a package declares this appropriately in their package.json file by default.
