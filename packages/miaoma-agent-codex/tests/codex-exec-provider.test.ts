/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it, vi } from 'vitest';

import {
    createMiaomaCodexExecProvider,
    MiaomaCodexExecError,
    type MiaomaCodexProcess,
    type MiaomaCodexProcessExit,
    type MiaomaCodexSpawnInput
} from '../src';

const stream = async function* (chunks: string[]) {
    yield* chunks;
};

const createProcess = ({
    stdout,
    stderr = '',
    exit = { code: 0, signal: null }
}: {
    stdout: string;
    stderr?: string;
    exit?: MiaomaCodexProcessExit;
}): MiaomaCodexProcess => ({
    stdout: stream([stdout]),
    stderr: stream([stderr]),
    waitForExit: () => Promise.resolve(exit),
    terminate: vi.fn(() => true)
});

const successfulJsonl = (message: string) =>
    [
        JSON.stringify({
            type: 'thread.started',
            thread_id: 'thread-1'
        }),
        JSON.stringify({ type: 'turn.started' }),
        JSON.stringify({
            type: 'item.completed',
            item: { id: 'item-1', type: 'agent_message', text: message }
        }),
        JSON.stringify({
            type: 'turn.completed',
            usage: { input_tokens: 10, output_tokens: 5 }
        })
    ].join('\n');

describe('Codex exec provider', () => {
    it('runs a new structured execution and emits normalized events', async () => {
        let spawned: MiaomaCodexSpawnInput | undefined;
        const events: string[] = [];
        const provider = createMiaomaCodexExecProvider({
            executable: '/opt/codex',
            spawnProcess: (input) => {
                spawned = input;
                return createProcess({
                    stdout: successfulJsonl('{"nodes":[]}')
                });
            }
        });

        const result = await provider.execute({
            prompt: 'Create the assigned region',
            workingDirectory: '/workspace/project',
            sandbox: 'workspace-write',
            conversation: { type: 'new' },
            model: 'gpt-test',
            images: ['/tmp/design.png'],
            response: {
                format: 'json',
                schemaPath: './schemas/fragment.json'
            },
            onEvent: (event) => events.push(event.type)
        });

        expect(spawned).toEqual({
            command: '/opt/codex',
            args: [
                'exec',
                '--json',
                '--sandbox',
                'workspace-write',
                '--model',
                'gpt-test',
                '--image',
                '/tmp/design.png',
                '--output-schema',
                '/workspace/project/schemas/fragment.json',
                '-'
            ],
            cwd: '/workspace/project',
            stdin: 'Create the assigned region'
        });
        expect(events).toEqual([
            'thread-started',
            'turn-started',
            'message',
            'turn-completed'
        ]);
        expect(result).toEqual({
            threadId: 'thread-1',
            response: { format: 'json', value: { nodes: [] } },
            usage: { input_tokens: 10, output_tokens: 5 }
        });
    });

    it('resumes a session with text output', async () => {
        let spawned: MiaomaCodexSpawnInput | undefined;
        const provider = createMiaomaCodexExecProvider({
            spawnProcess: (input) => {
                spawned = input;
                return createProcess({ stdout: successfulJsonl('Repaired') });
            }
        });

        const result = await provider.execute({
            prompt: 'Repair the invalid fragment',
            workingDirectory: '/workspace/project',
            sandbox: 'workspace-write',
            conversation: { type: 'resume', threadId: 'thread-1' },
            response: { format: 'text' }
        });

        expect(spawned?.args).toEqual([
            'exec',
            'resume',
            '--json',
            '-c',
            'sandbox_mode="workspace-write"',
            'thread-1',
            '-'
        ]);
        expect(result.response).toEqual({ format: 'text', value: 'Repaired' });
    });

    it('reports a failed process with stderr and its exit code', async () => {
        const provider = createMiaomaCodexExecProvider({
            spawnProcess: () =>
                createProcess({
                    stdout: '',
                    stderr: 'Authentication required',
                    exit: { code: 1, signal: null }
                })
        });

        const execution = provider.execute({
            prompt: 'Create a fragment',
            workingDirectory: '/workspace/project',
            sandbox: 'workspace-write',
            conversation: { type: 'new' },
            response: { format: 'text' }
        });

        await expect(execution).rejects.toMatchObject({
            code: 'process-failed',
            exitCode: 1,
            message: 'Authentication required'
        });
    });

    it('terminates a process awaiting exit when cancelled', async () => {
        let finish: ((exit: MiaomaCodexProcessExit) => void) | undefined;
        const terminate = vi.fn(() => {
            finish?.({ code: null, signal: 'SIGTERM' });
            return true;
        });
        const provider = createMiaomaCodexExecProvider({
            spawnProcess: () => ({
                stdout: stream([]),
                stderr: stream([]),
                waitForExit: () =>
                    new Promise((resolve) => {
                        finish = resolve;
                    }),
                terminate
            })
        });
        const controller = new AbortController();

        const execution = provider.execute({
            prompt: 'Create a fragment',
            workingDirectory: '/workspace/project',
            sandbox: 'workspace-write',
            conversation: { type: 'new' },
            response: { format: 'text' },
            signal: controller.signal
        });
        await Promise.resolve();
        controller.abort();

        await expect(execution).rejects.toEqual(
            expect.objectContaining<Partial<MiaomaCodexExecError>>({
                code: 'cancelled'
            })
        );
        expect(terminate).toHaveBeenCalledWith('SIGTERM');
    });
});
