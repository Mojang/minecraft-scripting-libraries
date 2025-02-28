# Change Log - @minecraft/math

<!-- This log was last generated on Fri, 28 Feb 2025 19:18:21 GMT and should not be manually modified. -->

<!-- Start content -->

## 2.2.0

Fri, 28 Feb 2025 19:18:21 GMT

### Minor changes

- Updated Vector3 add and subtract to support partial right hand values (jake@xbox.com)

## 2.1.0

Wed, 12 Feb 2025 23:03:05 GMT

### Minor changes

- Added constants VECTOR3_HALF and VECTOR3_NEGATIVE_ONE (alexander.denford@skyboxlabs.com)

## 2.0.0

Thu, 09 Jan 2025 19:25:04 GMT

### Major changes

- Switch to ESM exclusively. Publish release with artifacts. (rlanda@microsoft.com)

## 1.5.1

Tue, 03 Dec 2024 15:02:46 GMT

### Patches

- Tweak tsconfig so it's friendly to commonjs alongside ESM (rlanda@microsoft.com)

## 1.5.0

Tue, 26 Nov 2024 21:33:22 GMT

### Minor changes

- Implimented multiply, rotateX, rotateY, and rotateZ as new vectormath operations (aiaub1212@gmail.com)

### Patches

- build(dependabot): bump @minecraft/server from 1.6.0 to 1.15.0 (rlanda@microsoft.com)

## 1.4.2

Mon, 25 Nov 2024 23:28:43 GMT

### Patches

- build(dependabot): bump just-scripts from 2.2.1 to 2.3.2 (rlanda@microsoft.com)

## 1.4.0

Fri, 12 Jul 2024 19:33:22 GMT

### Minor changes

- Update @minecraft/math pre-bundled output to be ES modules based (rlanda@microsoft.com)

## 1.3.5

Mon, 18 Mar 2024 23:32:29 GMT

### Patches

- Added monorepo support to package.json (thomas@gamemodeone.com)

## 1.3.2

Thu, 29 Feb 2024 20:11:07 GMT

### Patches

- Using flat config (frgarc@microsoft.com)

## 1.3.1

Tue, 27 Feb 2024 20:03:57 GMT

### Patches

- Added repo link and contributors section to package.json (jashir@mojang.com)

## 1.3.0

Tue, 27 Feb 2024 19:46:08 GMT

### Minor changes

- Added distance, lerp and slerp functions (alexander.denford@skyboxlabs.com)

## 1.1.0

Fri, 02 Feb 2024 22:14:47 GMT

### Minor changes

- Minor adjustment to dependencies, making @minecraft/server a peer instead of direct dependency (rlanda@microsoft.com)

## 1.0.0

Mon, 29 Jan 2024 18:22:45 GMT

### Major changes

- Initial implementation of a @minecraft/math library with support for two paradigms. Added test and lint support, and also migrated lint rule for command suggestions to this repo. Started the creation of shared build tools. (rlanda@microsoft.com)
- Switch to a couple of classes with static methods to remove ambiguity with shortly named methods (rlanda@microsoft.com)

### Minor changes

- Add Vector2 helpers for parity with some helpers used in editor before (rlanda@microsoft.com)

### Patches

- Trim down package contents for publish. Ensure right exports. Fixing version specifications. (rlanda@microsoft.com)
- Minor README clean up (rlanda@microsoft.com)
