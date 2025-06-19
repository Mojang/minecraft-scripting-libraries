// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as rt from 'runtypes';
import { terminal as term } from 'terminal-kit';

export enum LogLevel {
    Debug = 0,
    Info,
    Warn,
    Error,
}

const LogLevelRecord = rt.Union(rt.Literal('debug'), rt.Literal('info'), rt.Literal('warn'), rt.Literal('error'));
type LogLevelStrings = rt.Static<typeof LogLevelRecord>;

const LogMessageRecord = rt.Union(
    rt.Literal('undocumentedApis'),
    rt.Literal('unusedDocumentation'),
    rt.Literal('unresolvedDependencies'),
    rt.Literal('unresolvedTypes')
);
export type LogMessage = rt.Static<typeof LogMessageRecord>;

export const LogOptionsRecord = rt.Record({
    level: rt.Optional(LogLevelRecord),
    allMessages: rt.Optional(rt.Union(rt.Boolean, LogLevelRecord)),
    undocumentedApis: rt.Optional(rt.Union(rt.Boolean, LogLevelRecord)),
    unusedDocumentation: rt.Optional(rt.Union(rt.Boolean, LogLevelRecord)),
    unresolvedDependencies: rt.Optional(rt.Union(rt.Boolean, LogLevelRecord)),
    unresolvedTypes: rt.Optional(rt.Union(rt.Boolean, LogLevelRecord)),
});
export type LogOptions = rt.Static<typeof LogOptionsRecord>;

/**
 * `printOption()` uses the log levels defined here to determine the level a message should be printed at.
 *
 * Note: true is equivalent to 'warn', undefined defaults to 'debug', false does not print.
 */
export const DefaultLogOptions: LogOptions = {
    undocumentedApis: false,
    unusedDocumentation: false,
    unresolvedDependencies: 'debug',
    unresolvedTypes: 'debug',
};

function getLogLevelFromString(level: LogLevelStrings): LogLevel {
    switch (level) {
        case 'debug':
            return LogLevel.Debug;
        default:
        case 'info':
            return LogLevel.Info;
        case 'warn':
            return LogLevel.Warn;
        case 'error':
            return LogLevel.Error;
    }
}

function shouldLog(currentLogLevel: LogLevel, requiredLogLevel: LogLevel): boolean {
    return requiredLogLevel >= currentLogLevel;
}

export function print(text: string, level?: LogLevel): void {
    switch (level) {
        case LogLevel.Debug:
            return debug(text);
        default:
        case LogLevel.Info:
            return info(text);
        case LogLevel.Warn:
            return warn(text);
        case LogLevel.Error:
            return error(text);
    }
}

/**
 * Prints according to the specified log level setting for 'messageId', or:
 *
 * If 'messageId' is set to true, will print to 'warn' log level.
 * If 'messageId' is undefined, will print to 'debug' log level.
 * If 'messageId' is set to false, will not print.
 */
export function printOption(text: string, messageId: LogMessage): void {
    const option = LoggerInstance.instance.options[messageId];
    if (option !== false) {
        const level = typeof option === 'string' ? option : option === true ? 'warn' : 'debug';
        print(text, getLogLevelFromString(level));
    }
}

export function debug(text: string): void {
    LoggerInstance.instance.debug(text);
}

export function info(text: string): void {
    LoggerInstance.instance.info(text);
}

export function warn(text: string): void {
    LoggerInstance.instance.warn(text);
}

export function error(text: string): void {
    LoggerInstance.instance.error(text);
}

export function assert(assertion: boolean, text: string): void {
    if (!assertion) {
        LoggerInstance.instance.assert(text);
    }
}

export function setLogOptions(options: LogOptions): void {
    LoggerInstance.instance.setLogOptions(options);
}

export function getLogOptions(): LogOptions {
    return LoggerInstance.instance.options;
}

export function getLogLevel(): LogLevel {
    return LoggerInstance.instance.level;
}

export interface ILogger {
    options: LogOptions;
    level: LogLevel;

    debug(text: string): void;
    info(text: string): void;
    warn(text: string): void;
    error(text: string): void;
    assert(text: string): void;

    setLogOptions(options: LogOptions): void;
}

export class TerminalLogger implements ILogger {
    options: LogOptions = DefaultLogOptions;
    level: LogLevel = LogLevel.Info;

    debug(text: string): void {
        if (shouldLog(this.level, LogLevel.Debug)) {
            term.brightBlue(`[DEBUG] ${text}\n`);
        }
    }

    info(text: string): void {
        if (shouldLog(this.level, LogLevel.Info)) {
            term(`[INFO] ${text}\n`);
        }
    }

    warn(text: string): void {
        if (shouldLog(this.level, LogLevel.Warn)) {
            term.yellow(`[WARN] ${text}\n`);
        }
    }

    error(text: string): void {
        term.red(`[ERROR] ${text}\n`);
        process.exitCode = 1;
    }

    assert(text: string): void {
        term.red(`[ASSERT] ${text}\n`);
        process.exitCode = 1;
    }

    setLogOptions(options: LogOptions): void {
        this.options = { ...DefaultLogOptions, ...options };
        this.level = this.options.level ? getLogLevelFromString(this.options.level) : LogLevel.Info;

        if (this.options.allMessages !== undefined) {
            for (const key of LogMessageRecord.alternatives.map(l => l.value)) {
                this.options[key] = this.options.allMessages;
            }
        }
    }
}

export class LoggerInstance {
    static instance: ILogger = new TerminalLogger();
}
