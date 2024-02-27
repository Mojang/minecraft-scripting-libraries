# Change Log - @minecraft/math

This log was last generated on Tue, 27 Feb 2024 19:46:08 GMT and should not be manually modified.

<!-- Start content -->

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
