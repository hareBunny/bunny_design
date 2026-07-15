/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { WebContents } from 'electron';
import { describe, expect, it, vi } from 'vitest';

import {
    MiaomaCodexExecError,
    type MiaomaCodexExecProvider
} from '@miaoma-design-ai/miaoma-agent-codex';
import type { MiaomaGenerationHistoryStore } from '@miaoma-design-ai/miaoma-agent-history';

import { createMiaomaDesktopGenerationRuntime } from '../client/generation/generationRuntime';
import type { ProjectStore } from '../client/projects/projectStore';
import type { MiaomaGenerationStartInput } from '../shared/generation';

const document = {
    version: '2.14',
    fileToken: 'project-1',
    children: [
        {
            id: 'root',
            type: 'frame' as const,
            width: 1440,
            height: 900,
            children: []
        }
    ]
};

const input: MiaomaGenerationStartInput = {
    projectId: 'project-1',
    prompt: 'Create a dashboard',
    document
};

const createSender = () => {
    const send = vi.fn();

    return {
        sender: {
            capturePage: vi.fn(),
            executeJavaScript: vi.fn(),
            isDestroyed: () => false,
            send
        } as unknown as WebContents,
        send
    };
};

const createHistory = (): MiaomaGenerationHistoryStore => ({
    saveRun: vi.fn(async () => undefined),
    loadRun: vi.fn(async () => null),
    listRuns: vi.fn(async () => [])
});

const createProjectStore = () =>
    ({
        updateProject: vi.fn(async () => null)
    }) as unknown as ProjectStore;

describe('desktop generation runtime', () => {
    it('allows one active run and cancels it through the runtime', async () => {
        const codex: MiaomaCodexExecProvider = {
            execute: vi.fn(
                ({ signal }) =>
                    new Promise((_, reject) => {
                        const rejectCancelled = () =>
                            reject(
                                new MiaomaCodexExecError({
                                    code: 'cancelled',
                                    message: 'Cancelled.'
                                })
                            );

                        if (signal?.aborted) {
                            rejectCancelled();
                            return;
                        }

                        signal?.addEventListener('abort', rejectCancelled, {
                            once: true
                        });
                    })
            )
        };
        const runtime = createMiaomaDesktopGenerationRuntime({
            codex,
            history: createHistory(),
            historyRoot: '/tmp/miaoma-history',
            projectStore: createProjectStore(),
            screenshotRoot: '/tmp/miaoma-screenshots',
            workingDirectory: '/tmp'
        });
        const { sender, send } = createSender();

        const started = await runtime.start(sender, input);
        if (!started.success) {
            throw new Error(started.error);
        }

        expect(await runtime.start(sender, input)).toEqual({
            success: false,
            error: 'Another design generation is already running.'
        });
        expect(runtime.cancel(started.runId)).toEqual({ success: true });
        await vi.waitFor(() => {
            expect(
                send.mock.calls.some(
                    ([, event]) => event.type === 'run-finished'
                )
            ).toBe(true);
        });
        expect(runtime.cancel(started.runId)).toEqual({
            success: false,
            error: 'Generation run is not active.'
        });
    });
});
