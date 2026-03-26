# Change Log - @minecraft/api-docs-generator

<!-- This log was last generated on Thu, 26 Mar 2026 20:36:26 GMT and should not be manually modified. -->

<!-- Start content -->

## 1.8.0

Thu, 26 Mar 2026 20:36:26 GMT

### Minor changes

- Add generator for rendering HTML documentation for protocol schemas (zachary.campbell@skyboxlabs.com)

## 1.7.0

Fri, 06 Mar 2026 18:11:49 GMT

### Minor changes

- Add support for error constructors to api-docs-generator (zachary.campbell@skyboxlabs.com)

## 1.6.1

Fri, 30 Jan 2026 21:03:31 GMT

### Patches

- Add another field to molang metadata (rlanda@microsoft.com)

## 1.6.0

Tue, 27 Jan 2026 20:46:50 GMT

### Minor changes

- Global variables now properly generate when optional (agriffin@microsoft.com)

## 1.5.0

Thu, 22 Jan 2026 17:23:10 GMT

### Minor changes

- Added property and function argument bounds data to metadata (brandon.chan@skyboxlabs.com)

### Patches

- Fixing functions that match keywords from being surrounded by quotes in docs generation. (alexander.denford@skyboxlabs.com)

## 1.4.0

Fri, 16 Jan 2026 21:45:44 GMT

### Minor changes

- Allow docs generator to handle molang metadata (rlanda@microsoft.com)

## 1.3.0

Tue, 13 Jan 2026 21:57:53 GMT

### Minor changes

- Added closure execution privileges for properties, returns, and parameters. Also renamed privileges. (agriffin@microsoft.com)

### Patches

- build(dependabot): bump terminal-kit from 2.11.7 to 3.1.2 (mc-npm@microsoft.com)

## 1.2.4

Thu, 04 Sep 2025 23:12:17 GMT

### Patches

- Fix type linking (mike.demone@skyboxlabs.com)
- Fix docs generator removeDuplicateVariantTypes filter for variants with multiple arrays (zachary.campbell@skyboxlabs.com)
- build(dependabot): bump just-scripts from 2.3.3 to 2.4.1 (mc-npm@microsoft.com)

## 1.2.3

Thu, 24 Jul 2025 21:03:05 GMT

### Patches

- Fix support for Promise<void> and Generator<void, void, void> (mike.demone@skyboxlabs.com)

## 1.2.1

Wed, 23 Jul 2025 19:09:54 GMT

### Patches

- Mark up void return types with 'is_void_return' and remove 'is_undefined' from them. (mike.demone@skyboxlabs.com)

## 1.2.0

Thu, 17 Jul 2025 16:45:56 GMT

### Minor changes

- Set all APIs from_module to the from_module's base module and all dependencies to the dependency's base module. (mike.demone@skyboxlabs.com)

## 1.1.0

Mon, 14 Jul 2025 15:34:00 GMT

### Minor changes

- Added support for Error types as function arguments to the TypeScript generator.  They will be typed as 'unknown' (jake@xbox.com)

## 1.0.0

Thu, 26 Jun 2025 22:33:37 GMT

### Major changes

- Add api-docs-generator and markup-generators-plugin (zachary.campbell@skyboxlabs.com)
