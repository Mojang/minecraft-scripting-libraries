/**
 * Rule which inspects calls to `runCommand[async]` and recommends using a script API if there
 * is a script API that provides 1:1 functionality parity. This does not necessarily require an
 * API to directly match, but could be a class of APIs that have equivalent functionality.
 */

import { AST_NODE_TYPES, ESLintUtils, TSESLint } from '@typescript-eslint/experimental-utils';

export type ScriptRecommendation = {
    module: string;
    message: string;
};

export type ApiScriptRecommendation = ScriptRecommendation & {
    api: string;
};
export type ClassScriptRecommendation = ScriptRecommendation & {
    class: string;
};

function isClassRecommendation(recommendation: ScriptRecommendation): recommendation is ClassScriptRecommendation {
    return 'class' in recommendation;
}

function isApiRecommendation(recommendation: ScriptRecommendation): recommendation is ApiScriptRecommendation {
    return 'api' in recommendation;
}

// function is

const ScriptRecommendations: Map<string, ApiScriptRecommendation | ClassScriptRecommendation> = new Map([
    [
        '/setBlock',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block#setpermutation for more information.',
            api: 'Block.setPermutation',
        },
    ],
    [
        '/testforblock',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation#matches for more information.',
            api: 'BlockPermutation.matches',
        },
    ],
    [
        '/camera',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/camera#setcamera for more information.',
            api: `Camera.setCamera`,
        },
    ],
    [
        '/clear',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container#clearall for more information.',
            api: 'Container.clearAll',
        },
    ],
    [
        '/replaceitem',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/container for more information.',
            class: 'Container/ContainerSlot',
        },
    ],
    [
        '/testfor',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#getentities for more information.',
            api: 'Dimension.getEntities',
        },
    ],
    [
        '/toggledownfall',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#setweather for more information.',
            api: 'Dimension.setWeather',
        },
    ],
    [
        '/weather',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#setweather for more information.',
            api: 'Dimension.setWeather',
        },
    ],
    [
        '/summon',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#spawnentity for more information.',
            api: 'Dimension.spawnEntity',
        },
    ],
    [
        '/particle',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension#spawnparticle for more information.',
            api: 'Dimension.spawnParticle',
        },
    ],
    [
        '/effect',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#addeffect for more information.',
            api: 'Entity.addEffect',
        },
    ],
    [
        '/tag',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#addtag for more information.',
            api: 'Entity.addTag',
        },
    ],
    [
        '/damage',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#applydamage for more information.',
            api: 'Entity.applyDamage',
        },
    ],
    [
        '/kill',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#kill for more information.',
            api: 'Entity.kill',
        },
    ],
    [
        '/teleport',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#teleport for more information.',
            api: 'Entity.teleport',
        },
    ],
    [
        '/tp',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#teleport for more information.',
            api: 'Entity.teleport',
        },
    ],
    [
        '/event',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity#triggerevent for more information.',
            api: 'Entity.triggerEvent',
        },
    ],
    [
        '/xp',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#addexperience for more information.',
            api: 'Player.addExperience',
        },
    ],
    [
        '/title',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay for more information.',
            api: 'Player.onScreenDisplay',
        },
    ],
    [
        '/titleraw',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/screendisplay for more information.',
            api: 'Player.onScreenDisplay',
        },
    ],
    [
        '/music',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#playmusic for more information.',
            api: 'Player.playMusic',
        },
    ],
    [
        '/playSound',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#playsound for more information.',
            api: 'Player.playSound',
        },
    ],
    [
        '/tell',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#sendmessage for more information.',
            api: `Player.sendMessage`,
        },
    ],
    [
        '/tellraw',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#sendmessage for more information.',
            api: `Player.sendMessage`,
        },
    ],
    [
        '/spawnpoint',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player#setspawnpoint for more information.',
            api: 'Player.setSpawnPoint',
        },
    ],
    [
        '/scoreboard',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/scoreboard for more information.',
            class: 'Scoreboard/ScoreboardObjective',
        },
    ],
    [
        '/time',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#settimeofday for more information.',
            api: 'World.setTimeOfDay',
        },
    ],
    [
        '/say',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#sendmessage for more information.',
            api: 'World.sendMessage',
        },
    ],
    [
        '/setworldspawn',
        {
            module: '@minecraft/server',
            message:
                'See https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world#setdefaultspawnlocation for more information.',
            api: 'World.setDefaultSpawnLocation',
        },
    ],
]);

const AvoidUnnecessaryCommand = ESLintUtils.RuleCreator(() => 'https://microsoft.com/')<
    [],
    'replaceWithScriptMethod' | 'replaceWithScriptFunctionality'
>({
    name: 'avoid-unnecessary-command',
    meta: {
        type: 'suggestion',
        docs: {
            description:
                'Recommends using a script API if there is a script API (or APIs) that provide 1:1 functionality parity with a command that is used.',
            recommended: 'error',
        },
        messages: {
            replaceWithScriptMethod:
                'The {{ command }} command can be fully replaced with the {{ api }} api in the {{ module }} module. {{ message }}.',
            replaceWithScriptFunctionality:
                'The {{ command }} command can be replaced by the functionality in {{ scriptClass }} in the {{ module }}. {{ message }}.',
        },
        schema: [
            {
                type: 'object',
                properties: {},
                additionalProperties: false,
            },
        ],
    },
    defaultOptions: [],
    create(context, _options): TSESLint.RuleListener {
        return {
            ExpressionStatement(node) {
                if (node.expression.type !== AST_NODE_TYPES.CallExpression) {
                    // Not a call expression, ignore
                    return;
                }

                // Identify if this is a call to runCommand or runCommandAsync, which occurs either
                // off of the exported module object, or through any cached function reference
                const invokedCallee = node.expression.callee;
                switch (invokedCallee.type) {
                    case AST_NODE_TYPES.MemberExpression: {
                        // Member expression has an object and property, we just care about the property
                        if (invokedCallee.property.type !== AST_NODE_TYPES.Identifier) {
                            // Not a simple property access, ignore
                            return;
                        }

                        // Check if this is a call to runCommand or runCommandAsync. This could catch false positives
                        // from creator code, and while we could defend against that, it's likely not worth the extra
                        // perf cost to check all imports always for this.
                        if (
                            invokedCallee.property.name !== 'runCommand' &&
                            invokedCallee.property.name !== 'runCommandAsync'
                        ) {
                            // Not a call to runCommand or runCommandAsync, ignore
                            return;
                        }

                        const commandArgs = node.expression.arguments;
                        if (commandArgs.length !== 1) {
                            // We only support a single argument for now, so ignore or treat this as a build error
                            return;
                        }

                        const argType = commandArgs[0];
                        let commandString: string | undefined = undefined;
                        switch (argType.type) {
                            case AST_NODE_TYPES.Literal: {
                                // The easiest case, just save off the value
                                commandString = argType.value as string;
                                break;
                            }
                            case AST_NODE_TYPES.TemplateLiteral:
                            case AST_NODE_TYPES.Identifier: {
                                let templateOrIdentifier = argType; // This may be overridden;

                                // To wrangle the weird type mismatch between the typescript-eslint types and the official typescript AST types, I handled tempalte literals and identifiers
                                // in the same block, with template identifiers first and then falling through to const identifiers.
                                if (templateOrIdentifier.type === AST_NODE_TYPES.TemplateLiteral) {
                                    // Try and process the template literal by extracting the `command`. This is done by getting the string up to the first space (if possible), or if
                                    // the first string is a variable, checking if it is a constant and extracting the value from that to infer the command.

                                    // If the length of the argument range is 2, then it's an empty template literal, so we can't do anything with it
                                    if (templateOrIdentifier.range[1] - templateOrIdentifier.range[0] === 2) {
                                        break;
                                    }

                                    // Start with the first quasis, check that it starts at the beginning of the range
                                    const firstQuasi = templateOrIdentifier.quasis[0];
                                    if (firstQuasi.range[0] !== templateOrIdentifier.range[0]) {
                                        break;
                                    }

                                    // If the first quasis is empty, then the first part of the template is a variable expression
                                    if (firstQuasi.value.raw.length === 0) {
                                        // This is a variable expression, so we need to try and extract the value from the variable
                                        // This will correspond to the first expression in the template literal
                                        const firstExpression = templateOrIdentifier.expressions[0];
                                        if (!firstExpression) {
                                            // Something is wrong or malformed, bail
                                            break;
                                        }

                                        if (firstExpression.type !== AST_NODE_TYPES.Identifier) {
                                            // We are only going to deal with identifiers for now, there are near infinite ways to "trick" this so this is best effort
                                            break;
                                        }

                                        // We are going to work with the identifier, so set it to the variable we are operating on
                                        templateOrIdentifier = firstExpression;
                                    } else {
                                        // This is a string literal now, so let's just check if it's a command.
                                        const firstQuasiValue = firstQuasi.value.raw;
                                        if (firstQuasiValue.startsWith('/')) {
                                            commandString = firstQuasiValue.split(' ')[0]; // Take the first part up to the space. This will be the whole string if there is no space
                                            break;
                                        }
                                    }
                                }

                                // At this point we have an identifier, but we if check to make sure all of our types resolve correctly
                                if (templateOrIdentifier.type === AST_NODE_TYPES.Identifier) {
                                    // We use an arrow function because TSESLint uses it's own version of the types
                                    // so we need to use the proper inferred types.
                                    const identifierName = templateOrIdentifier.name;
                                    const scope = context.getScope();

                                    let constValue = undefined;
                                    let currentScope: typeof scope | null = scope;

                                    while (currentScope) {
                                        const variables = currentScope.variables;

                                        for (const variable of variables) {
                                            if (
                                                variable.name === identifierName &&
                                                // We can't import the types for this, so we have to do a string comparison
                                                // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
                                                variable.defs[0].type === 'Variable'
                                            ) {
                                                // constValue = variable.defs[0].node.init.value;
                                                const variableInit = variable.defs[0]?.node?.init;
                                                if (variableInit?.type === AST_NODE_TYPES.Literal) {
                                                    constValue = variableInit.value;
                                                }
                                                break;
                                            }
                                        }

                                        if (constValue !== undefined) {
                                            break;
                                        }

                                        currentScope = currentScope.upper;
                                    }

                                    // Only care about string returns, other types may be other errors
                                    commandString = typeof constValue === 'string' ? constValue : undefined;
                                }

                                break;
                            }
                            default: {
                                // Can not resolve the actual value of the command, so ignore
                                break;
                            }
                        }

                        if (commandString) {
                            // We have a command string we can reason about, extract the command name
                            const commandName = commandString.split(' ')[0];
                            if (!commandName || !commandName.startsWith('/')) {
                                // Unable to extract a command name, so ignore
                                return;
                            }

                            // Now check if there is a script API that provides the same functionality
                            // by checking our list of recommendations
                            const recommendation = ScriptRecommendations.get(commandName);
                            if (recommendation) {
                                // We have a recommendation, so log the appropriate error
                                if (isClassRecommendation(recommendation)) {
                                    context.report({
                                        messageId: 'replaceWithScriptFunctionality',
                                        node,
                                        data: {
                                            message: recommendation.message,
                                            module: recommendation.module,
                                            scriptClass: recommendation.class,
                                            command: commandName,
                                        },
                                    });

                                    return;
                                } else if (isApiRecommendation(recommendation)) {
                                    context.report({
                                        messageId: 'replaceWithScriptMethod',
                                        node,
                                        data: {
                                            message: recommendation.message,
                                            module: recommendation.module,
                                            api: recommendation.api,
                                            command: commandName,
                                        },
                                    });

                                    return;
                                }
                            }
                        }
                        break;
                    }
                    default:
                        // Can't parse this type of invocation for now, so ignore it
                        return;
                }
                return;
            },
        };
    },
});

export default AvoidUnnecessaryCommand;
