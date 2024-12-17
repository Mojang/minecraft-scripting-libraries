# Minecraft Types ESLint Plugin

This package contains rules that comprise best practice for authoring minecraft script. Rules may encompass suggestions (use this API instead of this command!) or errors against anti-patterns to avoid any pitfalls.

## Authoring New Rules

To author a new rule, add a new file under src/rules that is named after the rule. The way to author rules is via the `ESLintUtils` rule creator. Further documentation for the full breadth of capabilities for rule creation is [found online](https://typescript-eslint.io/custom-rules#utils-package).

Once you have a new rule, update `src/index.ts` and add it to the exported "rules" key in the module exports, and update the default eslint config as to whether your new rule should be an error or a warning.