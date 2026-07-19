/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import type {
    MiaomaAgentActivity,
    MiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';
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

const completedBashActivities: MiaomaAgentActivity[] = Array.from(
    { length: 4 },
    (_, index) => ({
        activityId: `newton-bash-${index}`,
        runId: 'run-1',
        agentId: 'newton',
        assignmentId: 'hero',
        kind: 'bash',
        input: { command: `echo ${index}` },
        createdAt: '2026-07-20T00:00:00.000Z',
        startedAt: '2026-07-20T00:00:00.000Z',
        completedAt: '2026-07-20T00:00:01.000Z',
        status: 'completed',
        output: { summary: 'OK' }
    })
);

const run: MiaomaGenerationRun = {
    formatVersion: 1,
    runId: 'run-1',
    projectId: 'project-1',
    prompt: 'Create a landing page',
    coordinatorAgentId: 'miaoma',
    agentSessions: [],
    status: 'designing',
    assignments: [
        {
            assignmentId: 'hero',
            agentId: 'newton',
            order: 0,
            objective: '设计官网首屏和核心行动入口',
            region: {
                regionId: 'hero',
                label: '官网首屏',
                bounds: { x: 0, y: 0, width: 1440, height: 640 },
                targetNodeIds: ['root']
            },
            status: 'running',
            startedAt: '2026-07-20T00:00:00.000Z'
        }
    ],
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
        },
        ...completedBashActivities,
        {
            activityId: 'newton-bash-failed',
            runId: 'run-1',
            agentId: 'newton',
            assignmentId: 'hero',
            kind: 'bash',
            input: { command: 'invalid-command' },
            createdAt: '2026-07-20T00:00:00.000Z',
            startedAt: '2026-07-20T00:00:00.000Z',
            completedAt: '2026-07-20T00:00:01.000Z',
            status: 'failed',
            output: { summary: 'Command failed.' },
            error: { code: 'PROCESS_FAILED', message: 'Command failed.' }
        },
        {
            activityId: 'newton-design',
            runId: 'run-1',
            agentId: 'newton',
            assignmentId: 'hero',
            kind: 'design',
            input: { objective: '设计官网首屏和核心行动入口' },
            createdAt: '2026-07-20T00:00:00.000Z',
            startedAt: '2026-07-20T00:00:00.000Z',
            completedAt: '2026-07-20T00:00:01.000Z',
            status: 'completed',
            output: { summary: 'Hero completed.' }
        }
    ],
    documentRevision: 0,
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-20T00:00:01.000Z'
};

const completedRun: MiaomaGenerationRun = {
    ...run,
    status: 'validating',
    assignments: [
        {
            ...run.assignments[0]!,
            status: 'completed',
            startedAt: '2026-07-20T00:00:00.000Z',
            completedAt: '2026-07-20T00:00:02.000Z',
            fragmentId: 'fragment-hero'
        }
    ],
    updatedAt: '2026-07-20T00:00:02.000Z'
};

const pendingRun: MiaomaGenerationRun = {
    ...run,
    status: 'preparing',
    assignments: [{ ...run.assignments[0]!, status: 'pending' }]
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
            expect(
                screen.getByText('Hi, I am your design agent.')
            ).toBeTruthy();
            expect(
                screen.queryByRole('button', {
                    name: '切换智能体，当前为 miaoma'
                })
            ).toBeNull();

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
                listener?.({ type: 'run-updated', run: pendingRun });
            });
            expect(
                screen.queryByRole('button', {
                    name: '切换智能体，当前为 miaoma'
                })
            ).toBeNull();

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
            expect(screen.getByLabelText('已完成')).toBeTruthy();
            expect(screen.getByText('Newton 正在执行')).toBeTruthy();

            fireEvent.click(
                screen.getByRole('button', {
                    name: '切换智能体，当前为 miaoma'
                })
            );
            expect(screen.getByLabelText('Newton 正在执行')).toBeTruthy();
            fireEvent.click(screen.getByRole('option', { name: 'Newton' }));

            expect(
                screen.getByText(
                    '任务分配：负责「官网首屏」模块。设计官网首屏和核心行动入口'
                )
            ).toBeTruthy();
            expect(screen.queryByText('Visual check')).toBeNull();
            expect(screen.getByText('Designed')).toBeTruthy();
            expect(screen.getAllByText('Bash')).toHaveLength(3);
            expect(
                screen.getByLabelText('失败').querySelector('svg')
            ).not.toBeNull();

            act(() => {
                listener?.({ type: 'run-updated', run: completedRun });
            });
            expect(screen.getByText('Newton 已完成任务')).toBeTruthy();
            expect(screen.getByText('模块：官网首屏')).toBeTruthy();
            expect(
                screen.getByText('目标：设计官网首屏和核心行动入口')
            ).toBeTruthy();
            expect(screen.getByText('结果：已完成设计并写入画布')).toBeTruthy();
            fireEvent.click(
                screen.getByRole('button', {
                    name: '切换智能体，当前为 Newton'
                })
            );
            expect(screen.queryByLabelText('Newton 正在执行')).toBeNull();
            fireEvent.click(screen.getByRole('option', { name: 'miaoma' }));

            expect(
                screen.getByText('已完成本轮并行设计，结果如下：')
            ).toBeTruthy();
            expect(
                screen.getByText(
                    '：完成「官网首屏」模块，设计官网首屏和核心行动入口'
                )
            ).toBeTruthy();
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });
});
