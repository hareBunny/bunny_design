/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaAgentJsonObject } from '@miaoma-design-ai/miaoma-agent-core';

import type { MiaomaCodexEvent } from './types';

const MAX_ACTIVITY_SUMMARY_LENGTH = 2_000;

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
    typeof value === 'string' ? value : undefined;

const readNumber = (value: unknown) =>
    typeof value === 'number' ? value : undefined;

const readError = (value: unknown) => {
    const error = isObject(value) ? value : {};

    return {
        code: readString(error.code) ?? 'CODEX_TURN_FAILED',
        message:
            readString(error.message) ??
            readString(value) ??
            'Codex execution failed.'
    };
};

const summarize = (value: unknown, fallback: string) => {
    const text = readString(value)?.trim() || fallback;

    return text.length <= MAX_ACTIVITY_SUMMARY_LENGTH
        ? text
        : `${text.slice(0, MAX_ACTIVITY_SUMMARY_LENGTH - 3)}...`;
};

const mapCommandItem = ({
    phase,
    item
}: {
    phase: 'completed' | 'started';
    item: Record<string, unknown>;
}): MiaomaCodexEvent | null => {
    const sourceItemId = readString(item.id);
    const command = readString(item.command);

    if (!sourceItemId || !command) {
        return null;
    }

    const input = { command };
    if (phase === 'started') {
        return {
            type: 'activity',
            activity: {
                sourceItemId,
                kind: 'bash',
                status: 'running',
                input
            }
        };
    }

    const exitCode = readNumber(item.exit_code);
    const failed =
        item.status === 'failed' || (exitCode !== undefined && exitCode !== 0);
    const summary = summarize(
        item.aggregated_output ?? item.output,
        failed ? 'Command failed.' : 'Command completed.'
    );

    if (failed) {
        return {
            type: 'activity',
            activity: {
                sourceItemId,
                kind: 'bash',
                status: 'failed',
                input,
                output: { summary },
                error: {
                    code: 'CODEX_COMMAND_FAILED',
                    message:
                        readString(item.error) ??
                        (exitCode === undefined
                            ? 'Command execution failed.'
                            : `Command exited with code ${exitCode}.`)
                }
            }
        };
    }

    return {
        type: 'activity',
        activity: {
            sourceItemId,
            kind: 'bash',
            status: 'completed',
            input,
            output: { summary }
        }
    };
};

export const parseMiaomaCodexJsonlEvent = (
    line: string
): MiaomaCodexEvent | null => {
    const event: unknown = JSON.parse(line);
    if (!isObject(event)) {
        return null;
    }

    switch (event.type) {
        case 'thread.started': {
            const threadId = readString(event.thread_id);
            return threadId ? { type: 'thread-started', threadId } : null;
        }
        case 'turn.started':
            return { type: 'turn-started' };
        case 'turn.completed':
            return {
                type: 'turn-completed',
                usage: isObject(event.usage)
                    ? (event.usage as MiaomaAgentJsonObject)
                    : undefined
            };
        case 'turn.failed':
        case 'error':
            return {
                type: 'turn-failed',
                error: readError(event.error ?? event)
            };
        case 'item.started':
        case 'item.completed': {
            if (!isObject(event.item)) {
                return null;
            }

            if (event.item.type === 'command_execution') {
                return mapCommandItem({
                    phase:
                        event.type === 'item.started' ? 'started' : 'completed',
                    item: event.item
                });
            }

            const text = readString(event.item.text);
            return event.type === 'item.completed' &&
                event.item.type === 'agent_message' &&
                text
                ? { type: 'message', text }
                : null;
        }
        default:
            return null;
    }
};

export async function* readMiaomaCodexJsonLines(
    stream: AsyncIterable<string | Uint8Array>
) {
    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of stream) {
        buffer +=
            typeof chunk === 'string'
                ? chunk
                : decoder.decode(chunk, { stream: true });

        let lineBreak = buffer.indexOf('\n');
        while (lineBreak >= 0) {
            const line = buffer.slice(0, lineBreak).trim();
            buffer = buffer.slice(lineBreak + 1);
            if (line) {
                yield line;
            }
            lineBreak = buffer.indexOf('\n');
        }
    }

    buffer += decoder.decode();
    const finalLine = buffer.trim();
    if (finalLine) {
        yield finalLine;
    }
}
