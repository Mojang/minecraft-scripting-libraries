# Minecraft Math

A set of utilities and functions for common math operations. Major pieces are covered below.

## Vector3

A set of free functions and a wrapper class for common vector3 operations. Two distinct patterns are supported, a more pure computational approach operating on the Vector3 interface with no mutation, and a separate wrapper object oriented approach following a "builder" pattern. It is mostly preference whether you prefer the more "mutation" heavy pattern or the functional pattern, so it depends on the structure of your code. Under the covers, the same helpers are used.

### Pure Functional Style

```ts
import { Vector3 } from '@minecraft/server';
import { MinecraftDimensionTypes } from '@minecraft/vanilla-data';
import { add, subtract, cross } from '@minecraft/math';

const vectorA: Vector3 = {x: 1, y: 2, z:3};
const vectorB: Vector3 = {x: 4, y: 5, z:6};

const resultAdd = add(vectorA, vectorB); // {x:5, y:7, z:9}
const resultSubtract = subtract(vectorA, vectorB); // {x:-3, y:-3, z:-3}
const resultAdd = cross(vectorA, vectorB); // {x:-3, y:6, z:-3}

console.log(toString(vectorA)); // Prints out "1, 2, 3"

// Use your vectors with any @minecraft/server API
const = dimension = world.getDimension(MinecraftDimensionTypes.Overworld);
dimension.spawnParticle("minecraft:colored_flame_particle", resultAdd);
```

### Builder Style

```ts
import { Vector3 } from '@minecraft/server';
import { Vector3Builder } from '@minecraft/math';

const vectorA: Vector3Builder = new Vector3Builder({x: 1, y: 2, z:3});
const vectorB: Vector3 = {x: 4, y: 5, z:6};
const vectorC: Vector3 = {x: 1, y: 3, z:5};

// Mutates vectorA directly each time
vectorA.add(vectorB).subtract(vectorC).cross(vectorB); // Final result {x:4, y:-8, z:4}

console.log(vectorA.toString()); // Prints out "4, -8, 4"

// Vector3Builder type can directly be used in APIs that accept Vector3
const = dimension = world.getDimension(MinecraftDimensionTypes.Overworld);
dimension.spawnParticle("minecraft:colored_flame_particle", vectorA);
```

## How to use @minecraft/math in your project

@minecraft/math is published to NPM and follows standard semver semantics. To use it in your project, there are two main options:

1. Download `@minecraft/math` from NPM by doing `npm install @minecraft/math` within your scripts pack. By using `@minecraft/math`, you will need to do some sort of bundling to merge the library into your packs code. We recommend using [esbuild](https://esbuild.github.io/getting-started/#your-first-bundle) for simplicity.
2. This repository publishes releases for `@minecraft/math`, and on each release we attach a pre-bundled copy of the `@minecraft/math` module. Feel free to take this JS bundle and integrate into your projects as it contains all dependencies coupled together, and this pattern does not require bundling.
