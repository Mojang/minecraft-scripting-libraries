# Minecraft Gameplay Utilities

A set of utilities and functions for common gameplay operations. Major pieces are covered below.

## Thenable

A promise-like object which allows for cancellation through external resolution with it's `fulfill` and `reject` functions.

## EventThenable

This object provides a "wait for next event" utility. A wrapper around the `Thenable` object which is designed to be used with Minecraft script event signals. Provide the constructor with a signal and it will resolve the promise when the next event for the provided signal is raised. Also provides a `cancel` function to unregister the event and fulfill the promise with `undefined`.

### Can be awaited to receive the event

```ts
const event = await new EventThenable(world.afterEvents.buttonPush);
```

### Can be used like a promise

```ts
new EventThenable(world.afterEvents.leverAction).then(
    (event) => {
        // do something with the event
    }).finally(() => {
        // something else to do
    });
```

### Optionally provide filters for the signal and use helper function

```ts
const creeperDeathEvent = await waitForNextEvent(world.afterEvents.entityDie, { entityTypes: ['minecraft:creeper'] });
```

## How to use @minecraft/gameplay-utilities in your project

@minecraft/gameplay-utilities is published to NPM and follows standard semver semantics. To use it in your project,

- Download `@minecraft/gameplay-utilities` from NPM by doing `npm install @minecraft/gameplay-utilities` within your scripts pack. By using `@minecraft/gameplay-utilities`, you will need to do some sort of bundling to merge the library into your packs code. We recommend using [esbuild](https://esbuild.github.io/getting-started/#your-first-bundle) for simplicity.
