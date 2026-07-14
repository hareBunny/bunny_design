/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it, vi } from 'vitest';

import {
    MiaomaCodexExecError,
    type MiaomaCodexExecProvider,
    type MiaomaCodexExecRequest,
    type MiaomaCodexExecResult
} from '@miaoma-design-ai/miaoma-agent-codex';
import {
    type MiaomaAgentJsonObject,
    type MiaomaGenerationRun,
    parseMiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';
import type { MiaomaGenerationHistoryStore } from '@miaoma-design-ai/miaoma-agent-history';

import {
    createMiaomaDesignGenerationOrchestrator,
    type MiaomaDesignDocumentState
} from '../src';

const documentState: MiaomaDesignDocumentState = {
    revision: 0,
    document: {
        version: '2.14',
        fileToken: 'project-1',
        children: [
            {
                id: 'root',
                type: 'frame',
                width: 1440,
                height: 900,
                children: []
            }
        ]
    }
};

const plan = {
    formatVersion: 1,
    assignments: [
        {
            assignmentId: 'hero',
            agentId: 'newton',
            order: 0,
            objective: 'Design the hero region',
            region: {
                regionId: 'hero',
                label: 'Hero',
                targetNodeIds: ['root']
            }
        },
        {
            assignmentId: 'content',
            agentId: 'tesla',
            order: 1,
            objective: 'Design the content region',
            region: {
                regionId: 'content',
                label: 'Content',
                targetNodeIds: ['root']
            }
        }
    ]
};

const jsonResult = (
    value: MiaomaAgentJsonObject,
    threadId = 'thread-1'
): MiaomaCodexExecResult => ({
    threadId,
    response: { format: 'json', value }
});

const commandEvents = async (request: MiaomaCodexExecRequest) => {
    await request.onEvent?.({
        type: 'activity',
        activity: {
            sourceItemId: 'command-1',
            kind: 'bash',
            status: 'running',
            input: { command: '/bin/zsh -lc pwd' }
        }
    });
    await request.onEvent?.({
        type: 'activity',
        activity: {
            sourceItemId: 'command-1',
            kind: 'bash',
            status: 'completed',
            input: { command: '/bin/zsh -lc pwd' },
            output: { summary: '/workspace/project' }
        }
    });
};

const createHistory = (saved: MiaomaGenerationRun[]) =>
    ({
        saveRun: vi.fn(async ({ run }: { run: MiaomaGenerationRun }) => {
            saved.push(run);
        }),
        loadRun: vi.fn(async () => null),
        listRuns: vi.fn(async () => saved)
    }) satisfies MiaomaGenerationHistoryStore;

const createCodex = ({
    failContent = false
}: { failContent?: boolean } = {}) => {
    let activeWorkers = 0;
    let maxActiveWorkers = 0;
    const calls: MiaomaCodexExecRequest[] = [];

    const execute: MiaomaCodexExecProvider['execute'] = async (request) => {
        calls.push(request);

        if (
            request.response.format === 'json' &&
            request.response.schemaPath.endsWith('design-variables.schema.json')
        ) {
            await commandEvents(request);
            return jsonResult({
                formatVersion: 1,
                variables: {
                    accent: { type: 'color', value: '#2563eb' }
                }
            });
        }

        if (
            request.response.format === 'json' &&
            request.response.schemaPath.endsWith('design-plan.schema.json')
        ) {
            return jsonResult(plan);
        }

        activeWorkers += 1;
        maxActiveWorkers = Math.max(maxActiveWorkers, activeWorkers);
        const isHero = request.prompt.includes('Region: Hero');
        if (isHero) {
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        activeWorkers -= 1;

        if (!isHero && failContent) {
            throw new MiaomaCodexExecError({
                code: 'process-failed',
                message: 'Content agent failed.'
            });
        }

        const assignmentId = isHero ? 'hero' : 'content';
        return jsonResult(
            {
                formatVersion: 1,
                fragmentId: `fragment-${assignmentId}`,
                assignmentId,
                nodes: [
                    {
                        id: `${assignmentId}-frame`,
                        type: 'frame',
                        width: 'fill_container',
                        height: 240,
                        children: []
                    }
                ]
            },
            `thread-${assignmentId}`
        );
    };

    return {
        provider: { execute } satisfies MiaomaCodexExecProvider,
        calls,
        get maxActiveWorkers() {
            return maxActiveWorkers;
        }
    };
};

const createOrchestrator = ({
    failContent = false
}: { failContent?: boolean } = {}) => {
    const saved: MiaomaGenerationRun[] = [];
    const codex = createCodex({ failContent });
    const orchestrator = createMiaomaDesignGenerationOrchestrator({
        codex: codex.provider,
        history: createHistory(saved),
        createRunId: () => 'run-1',
        now: () => new Date('2026-07-20T00:00:00.000Z')
    });

    return { codex, orchestrator, saved };
};

describe('design generation orchestrator', () => {
    it('runs coordinator preparation and parallel workers in plan order', async () => {
        const { codex, orchestrator, saved } = createOrchestrator();
        const updates: number[] = [];

        const execution = orchestrator.start({
            projectId: 'project-1',
            prompt: 'Create a dashboard',
            workingDirectory: '/workspace/project',
            documentState,
            onDocumentUpdated: (state) => {
                updates.push(state.revision);
            }
        });
        const result = await execution.result;

        expect(result.run.status).toBe('completed');
        expect(result.run.assignments.map(({ status }) => status)).toEqual([
            'completed',
            'completed'
        ]);
        expect(result.document.variables).toEqual({
            accent: { type: 'color', value: '#2563eb' }
        });
        expect(
            result.document.children[0].type === 'frame'
                ? result.document.children[0].children?.map(({ id }) => id)
                : []
        ).toEqual(['hero-frame', 'content-frame']);
        expect(codex.maxActiveWorkers).toBe(2);
        expect(updates).toEqual([1, 2, 3]);
        expect(result.run.activities).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ kind: 'bash', status: 'completed' }),
                expect.objectContaining({
                    kind: 'read-variables',
                    status: 'completed'
                }),
                expect.objectContaining({ kind: 'plan-visual' })
            ])
        );
        expect(codex.calls[1].conversation).toEqual({
            type: 'resume',
            threadId: 'thread-1'
        });
        expect(
            codex.calls.every(
                ({ workingDirectory }) =>
                    workingDirectory === '/workspace/project'
            )
        ).toBe(true);
        expect(saved.at(-1)?.status).toBe('completed');
        expect(parseMiaomaGenerationRun(saved.at(-1))).toEqual(result.run);
    });

    it('keeps the run complete with a placeholder for one failed worker', async () => {
        const { orchestrator } = createOrchestrator({ failContent: true });

        const result = await orchestrator.start({
            projectId: 'project-1',
            prompt: 'Create a dashboard',
            documentState
        }).result;

        expect(result.run.status).toBe('completed');
        expect(result.run.assignments).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    assignmentId: 'content',
                    status: 'placeholder',
                    placeholderNodeId: 'placeholder-content'
                })
            ])
        );
        expect(result.document.children[0]).toMatchObject({
            children: [
                expect.objectContaining({ id: 'hero-frame' }),
                expect.objectContaining({ id: 'placeholder-content' })
            ]
        });
        expect(result.run.activities).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    kind: 'design',
                    assignmentId: 'content',
                    status: 'failed'
                })
            ])
        );
    });

    it('persists a cancelled terminal run when the execution is interrupted', async () => {
        const saved: MiaomaGenerationRun[] = [];
        const history = createHistory(saved);
        const codex: MiaomaCodexExecProvider = {
            execute: vi.fn(({ signal }) => {
                if (signal?.aborted) {
                    return Promise.reject(
                        new MiaomaCodexExecError({
                            code: 'cancelled',
                            message: 'Execution cancelled.'
                        })
                    );
                }

                return new Promise<MiaomaCodexExecResult>((_, reject) => {
                    signal?.addEventListener(
                        'abort',
                        () =>
                            reject(
                                new MiaomaCodexExecError({
                                    code: 'cancelled',
                                    message: 'Execution cancelled.'
                                })
                            ),
                        { once: true }
                    );
                });
            })
        };
        const orchestrator = createMiaomaDesignGenerationOrchestrator({
            codex,
            history,
            createRunId: () => 'run-1',
            now: () => new Date('2026-07-20T00:00:00.000Z')
        });
        const execution = orchestrator.start({
            projectId: 'project-1',
            prompt: 'Create a dashboard',
            documentState
        });

        execution.cancel();
        const result = await execution.result;

        expect(result.run.status).toBe('cancelled');
        expect(saved.at(-1)?.status).toBe('cancelled');
    });

    it('fails the run when coordinator preparation cannot complete', async () => {
        const saved: MiaomaGenerationRun[] = [];
        const history = createHistory(saved);
        const codex: MiaomaCodexExecProvider = {
            execute: vi.fn(async () => {
                throw new MiaomaCodexExecError({
                    code: 'process-failed',
                    message: 'Codex is unavailable.'
                });
            })
        };
        const orchestrator = createMiaomaDesignGenerationOrchestrator({
            codex,
            history,
            createRunId: () => 'run-1',
            now: () => new Date('2026-07-20T00:00:00.000Z')
        });

        const result = await orchestrator.start({
            projectId: 'project-1',
            prompt: 'Create a dashboard',
            documentState
        }).result;

        expect(result.run.status).toBe('failed');
        expect(result.run).toMatchObject({
            error: {
                code: 'process-failed',
                message: 'Codex is unavailable.'
            }
        });
        expect(saved.at(-1)?.status).toBe('failed');
    });
});
