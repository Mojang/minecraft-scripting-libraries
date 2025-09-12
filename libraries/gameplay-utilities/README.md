# Minecraft Gameplay Utilities

A set of utilities and functions for common gameplay operations. Major pieces are covered below.

## nextEvent() and EventPromise

`nextEvent()` is a function which takes a Minecraft event signal and wraps a promise around the next event being raised. The function returns an `EventPromise` object which is a promise type. When the event is raised, the promise will resolve with the event data, and unsubscribe from the event's signal. The `EventPromise` type also adds a `cancel()` function which will unsubscribe from the event's signal, and fulfill the promise with `undefined`.

### Can be awaited to receive the event

```ts
const event = await nextEvent(world.afterEvents.buttonPush);
```

### Can be used like a promise

```ts
await nextEvent(world.afterEvents.leverAction).then(
    (event) => {
        // do something with the event
    }).finally(() => {
        // something else to do
    });
```

### Optionally provide filters for the signal and use helper function

```ts
const creeperDeathEvent = await nextEvent(world.afterEvents.entityDie, { entityTypes: ['minecraft:creeper'] });
```

## How to use @minecraft/gameplay-utilities in your project

@minecraft/gameplay-utilities is published to NPM and follows standard semver semantics. To use it in your project,

- Download `@minecraft/gameplay-utilities` from NPM by doing `npm install @minecraft/gameplay-utilities` within your scripts pack. By using `@minecraft/gameplay-utilities`, you will need to do some sort of bundling to merge the library into your packs code. We recommend using [esbuild](https://esbuild.github.io/getting-started/#your-first-bundle) for simplicity.
