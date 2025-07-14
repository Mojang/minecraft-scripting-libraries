# Change Log - @minecraft/core-build-tasks

<!-- This log was last generated on Mon, 14 Jul 2025 15:34:00 GMT and should not be manually modified. -->

<!-- Start content -->

## 5.3.0

Mon, 14 Jul 2025 15:34:00 GMT

### Minor changes

- Update coreLint task to run on whole working directory, linting fixes (zachary.campbell@skyboxlabs.com)

## 5.2.0

Thu, 26 Jun 2025 22:33:37 GMT

### Minor changes

- Update core-build-tasks publishRelease to support uploading NPM tarballs (zachary.campbell@skyboxlabs.com)

## 5.1.0

Fri, 23 May 2025 10:43:28 GMT

### Minor changes

- Added alias option to BundleTaskParameters (jake@xbox.com)

## 5.0.0

Mon, 28 Apr 2025 17:15:23 GMT

### Major changes

- Upgrade @rushstack/node-core-library to 5.13.0, prettier to ^3.5.3 (zachary.campbell@skyboxlabs.com)

## 4.1.0

Mon, 14 Apr 2025 21:56:03 GMT

### Minor changes

- Bundle tasks parameters can now take in dropLabels to strip out certain labelled statements. (mike.demone@skyboxlabs.com)

## 4.0.0

Thu, 13 Mar 2025 18:35:25 GMT

### Major changes

- Upgrade esbuild and vitest (zachary.campbell@skyboxlabs.com)

## 3.0.1

Thu, 09 Jan 2025 19:53:24 GMT

### Patches

- Accidentally made the release a draft by default, fixed that (rlanda@microsoft.com)

## 3.0.0

Thu, 09 Jan 2025 19:25:04 GMT

### Major changes

- Export both ESM and CJS, but exclusively use CJS for just task configuration. Pre-bundle most dependencies to deal with ESM exclusive dependencies.
To leverage the new tasks, use a `just.config.cts` file to rely on CommonJS imports. (rlanda@microsoft.com)

## 1.2.1

Wed, 25 Dec 2024 16:02:44 GMT

### Patches

- Fix: Make cleanTask synchronous This is to prevent it removing files when you 'copyFiles' to the same path directly after. This happens when using 'updateWorldTask' 'cleanCollateralTask' also is synchronous (maescool@gmail.com)

## 1.2.0

Tue, 03 Dec 2024 15:02:46 GMT

### Minor changes

- Tweak tsconfig so it's friendly to commonjs alongside ESM (rlanda@microsoft.com)

## 1.1.7

Tue, 26 Nov 2024 21:33:22 GMT

### Patches

- build(dependabot): bump dotenv from 16.4.1 to 16.4.5 (rlanda@microsoft.com)

## 1.1.6

Mon, 25 Nov 2024 23:28:43 GMT

### Patches

- build(dependabot): bump just-scripts from 2.2.1 to 2.3.2 (rlanda@microsoft.com)

## 1.1.4

Mon, 18 Mar 2024 23:32:29 GMT

### Patches

- Add support for spaces in the path to the eslint config file (thomas@gamemodeone.com)
- Added repo link to package.json (thomas@gamemodeone.com)

## 1.1.3

Mon, 04 Mar 2024 21:57:32 GMT

### Patches

- - Moving webpack to dev dependencies (frgarc@microsoft.com)

## 1.1.2

Fri, 01 Mar 2024 22:57:50 GMT

### Patches

- Support for source map files creation at different path (frgarc@microsoft.com)

## 1.1.1

Thu, 29 Feb 2024 20:11:07 GMT

### Patches

- Support for ESLint Flat Config (frgarc@microsoft.com)

## 1.1.0

Tue, 27 Feb 2024 00:08:06 GMT

### Minor changes

- Adding new tasks: bundle, cleanCollateral, copy, updateWorld, mcaddon, watch (frgarc@microsoft.com)

## 1.0.1

Mon, 29 Jan 2024 19:08:51 GMT

### Patches

- README fixes (rlanda@microsoft.com)

## 1.0.0

Mon, 29 Jan 2024 18:22:45 GMT

### Major changes

- Initial implementation of a @minecraft/math library with support for two paradigms. Added test and lint support, and also migrated lint rule for command suggestions to this repo. Started the creation of shared build tools. (rlanda@microsoft.com)

### Patches

- Trim down package contents for publish. Ensure right exports. Fixing version specifications. (rlanda@microsoft.com)
