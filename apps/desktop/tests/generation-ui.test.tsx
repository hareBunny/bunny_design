/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import type { MiaomaGenerationRun } from '@miaoma-design-ai/miaoma-agent-core';
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor
} from '@testing-library/react';

import { MiaomaEditor } from '../renderer/components/editor/MiaomaEditor';
import { CANVAS_SAMPLE_EDITOR_DOCUMENT } from '../renderer/fixtures/canvasSampleDocument';
import type { MiaomaGenerationStartInput } from '../shared/generation';
import type { MiaomaGenerationEvent } from '../shared/generation';

class TestResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

const run: MiaomaGenerationRun = {
    formatVersion: 1,
    runId: 'run-1',
    projectId: 'project-1',
    prompt: 'Create a landing page',
    coordinatorAgentId: 'miaoma',
    agentSessions: [],
    status: 'preparing',
    assignments: [],
    activities: [
        {
            activityId: 'visual-check-1',
            runId: 'run-1',
            agentId: 'miaoma',
            kind: 'visual-check',
            input: { attempt: 0 },
            createdAt: '2026-07-20T00:00:00.000Z',
            startedAt: '2026-07-20T00:00:00.000Z',
            completedAt: '2026-07-20T00:00:01.000Z',
            status: 'completed',
            output: { summary: 'Hierarchy passed.' }
        }
    ],
    documentRevision: 0,
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:01.000Z'
};

describe('editor generation UI', () => {
    it('submits a prompt and renders streamed run activities', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const start = vi.fn(async (input: MiaomaGenerationStartInput) => {
            void input;
            return {
                success: true as const,
                runId: 'run-1'
            };
        });
        let listener: ((event: MiaomaGenerationEvent) => void) | undefined;

        globalThis.ResizeObserver = TestResizeObserver;
        window.miaomaAPI = {
            ping: vi.fn(async () => ({ success: true })),
            projects: {
                list: vi.fn(),
                create: vi.fn(),
                importFromFile: vi.fn(),
                get: vi.fn(),
                open: vi.fn(),
                update: vi.fn(),
                delete: vi.fn()
            },
            generation: {
                start,
                cancel: vi.fn(async (runId: string) => {
                    void runId;
                    return { success: true as const };
                }),
                subscribe: vi.fn(
                    (
                        nextListener: (event: MiaomaGenerationEvent) => void
                    ): (() => void) => {
                        listener = nextListener;
                        return () => undefined;
                    }
                )
            }
        };

        try {
            render(
                <MiaomaEditor
                    initialDocument={CANVAS_SAMPLE_EDITOR_DOCUMENT}
                    projectId="project-1"
                />
            );
            fireEvent.change(screen.getByLabelText('Agent prompt'), {
                target: { value: 'Create a landing page' }
            });
            fireEvent.click(
                screen.getByRole('button', { name: 'Send agent prompt' })
            );

            await waitFor(() => expect(start).toHaveBeenCalledTimes(1));
            expect(start.mock.calls[0][0]).toMatchObject({
                projectId: 'project-1',
                prompt: 'Create a landing page'
            });

            act(() => {
                listener?.({ type: 'run-updated', run });
            });
            act(() => {
                listener?.({
                    type: 'document-updated',
                    runId: 'run-1',
                    revision: 1,
                    document: start.mock.calls[0][0].document
                });
            });

            const canvasStage = document.querySelector(
                '[data-region="canvas-stage"]'
            );
            expect(canvasStage?.getAttribute('data-generation-run-id')).toBe(
                'run-1'
            );
            expect(canvasStage?.getAttribute('data-document-revision')).toBe(
                '1'
            );

            fireEvent.click(await screen.findByText('Visual check'));

            expect(screen.getByText('Input')).toBeTruthy();
            expect(screen.getByText(/"attempt": 0/)).toBeTruthy();
            expect(screen.getByText('Output')).toBeTruthy();
            expect(screen.getByText('Hierarchy passed.')).toBeTruthy();
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });
});
