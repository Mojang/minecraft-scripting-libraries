// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { RuleTester } from '@typescript-eslint/rule-tester';
import * as path from 'path';
import { describe, it, afterAll } from 'vitest';
import AvoidUnnecessaryCommand from './AvoidUnnecessaryCommand.js';

// RuleTester needs some global setup to integrate with test runners
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it;

const ruleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            projectService: {
                allowDefaultProject: ['*.ts*'],
            },
            tsconfigRootDir: path.join(__dirname, '../..'),
        },
    },
});

ruleTester.run('avoid-unnecessary-command', AvoidUnnecessaryCommand, {
    valid: [
        {
            code: `player.runCommand('/give @s air');`,
        },
        {
            code: `player.runCommandAsync('/give @s air');`,
        },
        {
            code: `const myDimension = world.getDimension("minecraft:overworld");
            myDimension.runCommandAsync('/give @s air');`,
        },
        {
            code: `const myCommand = '/give @s air';
            myDimension.runCommandAsync(myCommand);`,
        },
        // The below case it an API that should be replaced, but because it is dynamic we
        // can't resolve it fully so we need to allow it.
        {
            code: `const commandName = '/replaceItem';
            const quantity = 5;
            const myCommand = commandName + ' entity @s slot.hotbar 0 acacia_boat ' + quantity;
            myDimension.runCommandAsync(myCommand);`,
        },
        // Template strings with valid commands should be allowed
        {
            code: 'const args = "@s";\nplayer.runCommand(`/give ${args} air`);',
        },
        {
            code: 'const command = "/give";\nplayer.runCommand(`${command} @s air`);',
        },
    ],
    invalid: [
        // Basic string cases
        {
            code: `player.runCommand('/setblock ~ ~ ~ grass');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/setblock',
                        module: '@minecraft/server',
                        api: 'Block.setPermutation',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block#setpermutation for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/testforblock 0 0 0 dirt 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/testforblock',
                        module: '@minecraft/server',
                        api: 'BlockPermutation.matches',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation#matches for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/camera @s set minecraft:free');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/camera',
                        module: '@minecraft/server',
                        api: 'Camera.setCamera',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camera#setcamera for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/clear');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/clear',
                        module: '@minecraft/server',
                        api: 'Container.clearAll',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container#clearall for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/replaceitem entity @s slot.hotbar 0 acacia_boat 5');`,
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/replaceitem',
                        module: '@minecraft/server',
                        scriptClass: 'Container/ContainerSlot',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/replaceitem entity @s slot.hotbar 0 acacia_boat 5');`,
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/replaceitem',
                        module: '@minecraft/server',
                        scriptClass: 'Container/ContainerSlot',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
                    },
                },
            ],
        },
        // Basic single variable redirection cases
        {
            code: `const myDimension = world.getDimension("minecraft:overworld");
            myDimension.runCommandAsync('/replaceitem entity @s slot.hotbar 0 acacia_boat 5');`,
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/replaceitem',
                        module: '@minecraft/server',
                        scriptClass: 'Container/ContainerSlot',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
                    },
                },
            ],
        },
        {
            code: `const myCommand = '/replaceitem entity @s slot.hotbar 0 acacia_boat 5';
            myDimension.runCommandAsync(myCommand);`,
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/replaceitem',
                        module: '@minecraft/server',
                        scriptClass: 'Container/ContainerSlot',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
                    },
                },
            ],
        },
        // Template string with embedded command case. Need to use single line due to template literal
        {
            code: 'const args = "entity @s slot.hotbar 0 acacia_boat 5";\nmyDimension.runCommandAsync(`/replaceitem ${args}`);',
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/replaceitem',
                        module: '@minecraft/server',
                        scriptClass: 'Container/ContainerSlot',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
                    },
                },
            ],
        },
        // Template string with command in variable case. Need to use single line due to template literal
        {
            code: 'const command = "/replaceitem";\nmyDimension.runCommandAsync(`${command} entity @s slot.hotbar 0 acacia_boat 5`);',
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/replaceitem',
                        module: '@minecraft/server',
                        scriptClass: 'Container/ContainerSlot',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/testfor @s');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/testfor',
                        module: '@minecraft/server',
                        api: 'Dimension.getEntities',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#getentities for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/toggledownfall');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/toggledownfall',
                        module: '@minecraft/server',
                        api: 'Dimension.setWeather',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#setweather for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/summon villager ~ ~ ~');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/summon',
                        module: '@minecraft/server',
                        api: 'Dimension.spawnEntity',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#spawnentity for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/particle minecraft:campfire_smoke_particle');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/particle',
                        module: '@minecraft/server',
                        api: 'Dimension.spawnParticle',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#spawnparticle for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/effect @s speed');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/effect',
                        module: '@minecraft/server',
                        api: 'Entity.addEffect',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#addeffect for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/tag @s add hello');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/tag',
                        module: '@minecraft/server',
                        api: 'Entity.addTag',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#addtag for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/damage @s -1');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/damage',
                        module: '@minecraft/server',
                        api: 'Entity.applyDamage',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#applydamage for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/kill @s');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/kill',
                        module: '@minecraft/server',
                        api: 'Entity.kill',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#kill for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/teleport @s 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/teleport',
                        module: '@minecraft/server',
                        api: 'Entity.teleport',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#teleport for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommand('/tp @s 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/tp',
                        module: '@minecraft/server',
                        api: 'Entity.teleport',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#teleport for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/tp @s 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/tp',
                        module: '@minecraft/server',
                        api: 'Entity.teleport',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#teleport for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/event entity @e event_name');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/event',
                        module: '@minecraft/server',
                        api: 'Entity.triggerEvent',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#triggerevent for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/xp 10');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/xp',
                        module: '@minecraft/server',
                        api: 'Player.addExperience',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#addexperience for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/title @s title test message');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/title',
                        module: '@minecraft/server',
                        api: 'Player.onScreenDisplay',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/titleraw @s title {"rawtext":[{"text":"some text"}]}');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/titleraw',
                        module: '@minecraft/server',
                        api: 'Player.onScreenDisplay',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/music queue mytrack');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/music',
                        module: '@minecraft/server',
                        api: 'Player.playMusic',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#playmusic for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/playSound mytrack');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/playSound',
                        module: '@minecraft/server',
                        api: 'Player.playSound',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#playsound for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/tell @s hello');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/tell',
                        module: '@minecraft/server',
                        api: 'Player.sendMessage',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#sendmessage for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/tellraw @s {"rawtext":[{"text":"some text"}]}');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/tellraw',
                        module: '@minecraft/server',
                        api: 'Player.sendMessage',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#sendmessage for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/spawnpoint @s 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/spawnpoint',
                        module: '@minecraft/server',
                        api: 'Player.setSpawnPoint',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#setspawnpoint for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/scoreboard objectives add test_objective dummy');`,
            errors: [
                {
                    messageId: 'replaceWithScriptFunctionality',
                    data: {
                        command: '/scoreboard',
                        module: '@minecraft/server',
                        scriptClass: 'Scoreboard/ScoreboardObjective',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/scoreboard for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/time set noon');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/time',
                        module: '@minecraft/server',
                        api: 'World.setTimeOfDay',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#settimeofday for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/say hi');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/say',
                        module: '@minecraft/server',
                        api: 'World.sendMessage',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#sendmessage for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('/setworldspawn 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/setworldspawn',
                        module: '@minecraft/server',
                        api: 'World.setDefaultSpawnLocation',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#setdefaultspawnlocation for more information.',
                    },
                },
            ],
        },
        {
            code: `player.runCommandAsync('setworldspawn 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/setworldspawn',
                        module: '@minecraft/server',
                        api: 'World.setDefaultSpawnLocation',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#setdefaultspawnlocation for more information.',
                    },
                },
            ],
        },
        {
            code: `await player.runCommandAsync('/setworldspawn 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/setworldspawn',
                        module: '@minecraft/server',
                        api: 'World.setDefaultSpawnLocation',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#setdefaultspawnlocation for more information.',
                    },
                },
            ],
        },
        {
            code: `const p = player.runCommandAsync('/setworldspawn 0 0 0');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/setworldspawn',
                        module: '@minecraft/server',
                        api: 'World.setDefaultSpawnLocation',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#setdefaultspawnlocation for more information.',
                    },
                },
            ],
        },
        {
            code: `const p = player.runCommandAsync('/inputpermission query @s movement enabled');`,
            errors: [
                {
                    messageId: 'replaceWithScriptMethod',
                    data: {
                        command: '/inputpermission',
                        module: '@minecraft/server',
                        api: 'Player.inputPermissions',
                        message:
                            'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#inputpermissions for more information.',
                    },
                },
            ],
        },
    ],
});
