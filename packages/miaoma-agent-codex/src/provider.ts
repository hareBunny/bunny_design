/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { MiaomaAgentJsonObject } from '@miaoma-design-ai/miaoma-agent-core';

import { parseMiaomaCodexJsonlEvent, readMiaomaCodexJsonLines } from './jsonl';
import {
    type MiaomaCodexProcessSpawner,
    spawnMiaomaCodexProcess
} from './process';
import {
    type MiaomaCodexEvent,
    MiaomaCodexExecError,
    type MiaomaCodexExecProvider,
    type MiaomaCodexExecRequest,
    type MiaomaCodexExecResult
} from './types';

const MAX_STDERR_LENGTH = 16_000;

type MiaomaCodexJsonSchemaMode = 'native' | 'prompt';

const assertNotBlank = (value: string, label: string) => {
    if (value.trim() === '') {
        throw new Error(`${label} must not be blank.`);
    }
};

const buildArguments = (
    request: MiaomaCodexExecRequest,
    skipGitRepoCheck: boolean,
    jsonSchemaMode: MiaomaCodexJsonSchemaMode
) => {
    const args = ['exec'];
    const resuming = request.conversation.type === 'resume';

    if (resuming) {
        args.push('resume');
    }

    if (skipGitRepoCheck) {
        args.push('--skip-git-repo-check');
    }

    args.push('--json');
    if (resuming) {
        args.push('-c', `sandbox_mode="${request.sandbox}"`);
    } else {
        args.push('--sandbox', request.sandbox);
    }

    if (request.model) {
        args.push('--model', request.model);
    }

    if (request.images?.length) {
        args.push('--image', ...request.images);
    }

    if (request.response.format === 'json' && jsonSchemaMode === 'native') {
        args.push(
            '--output-schema',
            path.resolve(request.workingDirectory, request.response.schemaPath)
        );
    }

    if (request.conversation.type === 'resume') {
        args.push(request.conversation.threadId);
    }

    args.push('-');
    return args;
};

const buildStdin = async ({
    request,
    jsonSchemaMode,
    loadSchema
}: {
    request: MiaomaCodexExecRequest;
    jsonSchemaMode: MiaomaCodexJsonSchemaMode;
    loadSchema: (schemaPath: string) => Promise<string>;
}) => {
    if (request.response.format !== 'json' || jsonSchemaMode === 'native') {
        return request.prompt;
    }

    const schemaPath = path.resolve(
        request.workingDirectory,
        request.response.schemaPath
    );
    const schema = await loadSchema(schemaPath);

    return `${request.prompt}\n\nJSON output schema:\n${schema}`;
};

const collectStderr = async (stream: AsyncIterable<string | Uint8Array>) => {
    const decoder = new TextDecoder();
    let output = '';

    for await (const chunk of stream) {
        output +=
            typeof chunk === 'string'
                ? chunk
                : decoder.decode(chunk, { stream: true });
        if (output.length > MAX_STDERR_LENGTH) {
            output = output.slice(-MAX_STDERR_LENGTH);
        }
    }

    return `${output}${decoder.decode()}`.trim();
};

const cancellationError = () =>
    new MiaomaCodexExecError({
        code: 'cancelled',
        message: 'Codex execution was cancelled.'
    });

const parseJsonResponse = (message: string) => {
    const trimmed = message.trim();
    const withoutFence = trimmed
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '');
    const objectStart = withoutFence.indexOf('{');
    const arrayStart = withoutFence.indexOf('[');
    const start =
        objectStart < 0
            ? arrayStart
            : arrayStart < 0
              ? objectStart
              : Math.min(objectStart, arrayStart);
    const end =
        start < 0
            ? -1
            : withoutFence.lastIndexOf(withoutFence[start] === '{' ? '}' : ']');
    const candidates = [
        trimmed,
        withoutFence,
        start >= 0 && end >= start
            ? withoutFence.slice(start, end + 1)
            : undefined
    ];

    for (const candidate of candidates) {
        if (!candidate) {
            continue;
        }
        try {
            return JSON.parse(candidate);
        } catch {
            // Try the next conservative normalization.
        }
    }

    throw new MiaomaCodexExecError({
        code: 'invalid-structured-output',
        message: 'Codex final response is not valid JSON.'
    });
};

export const createMiaomaCodexExecProvider = ({
    executable = 'codex',
    jsonSchemaMode = 'native',
    loadSchema = (schemaPath) => readFile(schemaPath, 'utf8'),
    skipGitRepoCheck = false,
    spawnProcess = spawnMiaomaCodexProcess
}: {
    executable?: string;
    jsonSchemaMode?: MiaomaCodexJsonSchemaMode;
    loadSchema?: (schemaPath: string) => Promise<string>;
    skipGitRepoCheck?: boolean;
    spawnProcess?: MiaomaCodexProcessSpawner;
} = {}): MiaomaCodexExecProvider => ({
    async execute(request) {
        assertNotBlank(request.prompt, 'Prompt');
        assertNotBlank(request.workingDirectory, 'Working directory');
        if (request.conversation.type === 'resume') {
            assertNotBlank(request.conversation.threadId, 'Thread id');
        }
        if (request.model !== undefined) {
            assertNotBlank(request.model, 'Model');
        }
        request.images?.forEach((image, index) =>
            assertNotBlank(image, `Image path ${index}`)
        );
        if (request.response.format === 'json') {
            assertNotBlank(request.response.schemaPath, 'Output schema path');
        }
        if (request.signal?.aborted) {
            throw cancellationError();
        }

        let process;
        try {
            const stdin = await buildStdin({
                request,
                jsonSchemaMode,
                loadSchema
            });
            process = spawnProcess({
                command: executable,
                args: buildArguments(request, skipGitRepoCheck, jsonSchemaMode),
                cwd: request.workingDirectory,
                stdin
            });
        } catch (error) {
            throw new MiaomaCodexExecError({
                code: 'process-failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Codex process could not be started.'
            });
        }

        const abort = () => process.terminate('SIGTERM');
        request.signal?.addEventListener('abort', abort, { once: true });

        try {
            if (process.processId !== undefined) {
                await request.onEvent?.({
                    type: 'process-started',
                    processId: process.processId
                });
            }

            const exitResult = process.waitForExit().then(
                (value) => ({ status: 'fulfilled' as const, value }),
                (reason: unknown) => ({ status: 'rejected' as const, reason })
            );
            const stderrResult = collectStderr(process.stderr).then(
                (value) => ({ status: 'fulfilled' as const, value }),
                (reason: unknown) => ({
                    status: 'rejected' as const,
                    reason
                })
            );

            let threadId =
                request.conversation.type === 'resume'
                    ? request.conversation.threadId
                    : undefined;
            let finalMessage: string | undefined;
            let usage: MiaomaAgentJsonObject | undefined;
            let turnFailure:
                | Extract<MiaomaCodexEvent, { type: 'turn-failed' }>
                | undefined;

            try {
                for await (const line of readMiaomaCodexJsonLines(
                    process.stdout
                )) {
                    let event;
                    try {
                        event = parseMiaomaCodexJsonlEvent(line);
                    } catch (error) {
                        if (error instanceof SyntaxError) {
                            throw new MiaomaCodexExecError({
                                code: 'invalid-jsonl',
                                message: 'Codex emitted an invalid JSONL event.'
                            });
                        }
                        throw error;
                    }

                    if (!event) {
                        continue;
                    }

                    if (event.type === 'thread-started') {
                        threadId = event.threadId;
                    } else if (event.type === 'message') {
                        finalMessage = event.text;
                    } else if (event.type === 'turn-completed') {
                        usage = event.usage;
                    } else if (event.type === 'turn-failed') {
                        turnFailure = event;
                    }

                    await request.onEvent?.(event);
                }
            } catch (error) {
                process.terminate('SIGTERM');
                await Promise.all([exitResult, stderrResult]);

                if (request.signal?.aborted) {
                    throw cancellationError();
                }
                throw error;
            }

            const [exit, stderr] = await Promise.all([
                exitResult,
                stderrResult
            ]);
            if (request.signal?.aborted) {
                throw cancellationError();
            }
            if (exit.status === 'rejected') {
                throw new MiaomaCodexExecError({
                    code: 'process-failed',
                    message:
                        exit.reason instanceof Error
                            ? exit.reason.message
                            : 'Codex process failed.'
                });
            }
            if (stderr.status === 'rejected') {
                throw new MiaomaCodexExecError({
                    code: 'process-failed',
                    message: 'Codex stderr could not be read.'
                });
            }
            if (turnFailure) {
                throw new MiaomaCodexExecError({
                    code: 'turn-failed',
                    message: turnFailure.error.message,
                    exitCode: exit.value.code
                });
            }
            if (exit.value.code !== 0) {
                throw new MiaomaCodexExecError({
                    code: 'process-failed',
                    message:
                        stderr.value || 'Codex process exited unsuccessfully.',
                    exitCode: exit.value.code
                });
            }
            if (!threadId) {
                throw new MiaomaCodexExecError({
                    code: 'missing-output',
                    message: 'Codex did not emit a thread id.'
                });
            }
            if (finalMessage === undefined) {
                throw new MiaomaCodexExecError({
                    code: 'missing-output',
                    message: 'Codex did not emit a final message.'
                });
            }

            let response: MiaomaCodexExecResult['response'];
            if (request.response.format === 'json') {
                response = {
                    format: 'json',
                    value: parseJsonResponse(finalMessage)
                };
            } else {
                response = { format: 'text', value: finalMessage };
            }

            return {
                processId: process.processId,
                threadId,
                response,
                usage
            };
        } finally {
            request.signal?.removeEventListener('abort', abort);
        }
    }
});
