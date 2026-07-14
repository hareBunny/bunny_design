/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import type {
    MiaomaCodexExecProvider,
    MiaomaCodexExecResult
} from '@miaoma-design-ai/miaoma-agent-codex';
import type { MiaomaAgentJsonObject } from '@miaoma-design-ai/miaoma-agent-core';

import {
    createMiaomaDesignVisualHarness,
    type MiaomaDesignDocumentState
} from '../src';

const state: MiaomaDesignDocumentState = {
    revision: 0,
    document: {
        version: '2.14',
        children: [
            {
                id: 'root',
                type: 'frame',
                width: 1440,
                height: 900,
                children: [
                    {
                        id: 'hero-frame',
                        type: 'frame',
                        name: 'Hero',
                        width: 'fill_container',
                        height: 320,
                        children: []
                    }
                ]
            }
        ]
    }
};

const result = (
    value: MiaomaAgentJsonObject,
    threadId = 'check-thread'
): MiaomaCodexExecResult => ({
    threadId,
    response: { format: 'json', value }
});

describe('visual validation harness', () => {
    it('captures, repairs, and rechecks a design through Codex images', async () => {
        const requests: {
            schemaPath: string;
            images?: string[];
            conversation: unknown;
        }[] = [];
        let visualChecks = 0;
        const codex: MiaomaCodexExecProvider = {
            execute: async (request) => {
                if (request.response.format !== 'json') {
                    throw new Error('Expected structured output.');
                }
                requests.push({
                    schemaPath: request.response.schemaPath,
                    images: request.images,
                    conversation: request.conversation
                });

                if (
                    request.response.schemaPath.endsWith(
                        'visual-check.schema.json'
                    )
                ) {
                    visualChecks += 1;
                    return result(
                        visualChecks === 1
                            ? {
                                  formatVersion: 1,
                                  passed: false,
                                  summary: 'Needs spacing repair.',
                                  issues: [
                                      {
                                          issueId: 'hero-spacing',
                                          severity: 'error',
                                          message: 'Hero spacing is too tight.',
                                          nodeId: 'hero-frame',
                                          assignmentId: 'hero'
                                      }
                                  ]
                              }
                            : {
                                  formatVersion: 1,
                                  passed: true,
                                  summary: 'Visual hierarchy is consistent.',
                                  issues: []
                              }
                    );
                }

                return result(
                    {
                        formatVersion: 1,
                        repairs: [
                            {
                                repairId: 'repair-hero',
                                assignmentId: 'hero',
                                nodeIds: ['hero-frame'],
                                nodes: [
                                    {
                                        id: 'hero-frame',
                                        type: 'frame',
                                        name: 'Hero repaired',
                                        width: 'fill_container',
                                        height: 320,
                                        padding: [24, 32],
                                        children: []
                                    }
                                ]
                            }
                        ]
                    },
                    'repair-thread'
                );
            }
        };
        let screenshotIndex = 0;
        const harness = createMiaomaDesignVisualHarness({
            codex,
            captureScreenshot: async () => ({
                path: `/tmp/miaoma-design-${screenshotIndex++}.png`
            })
        });

        const loop = await harness.run({
            projectId: 'project-1',
            runId: 'run-1',
            prompt: 'Create a dashboard',
            state,
            workingDirectory: '/workspace/project',
            sandbox: 'workspace-write',
            maxRepairAttempts: 2
        });

        expect(loop.passed).toBe(true);
        expect(loop.attempts).toBe(1);
        expect(loop.checks).toHaveLength(2);
        expect(loop.state.revision).toBe(1);
        expect(loop.state.document.children[0]).toMatchObject({
            children: [expect.objectContaining({ name: 'Hero repaired' })]
        });
        expect(requests[0].images).toEqual(['/tmp/miaoma-design-0.png']);
        expect(requests[1].conversation).toEqual({
            type: 'resume',
            threadId: 'check-thread'
        });
        expect(requests[2].images).toEqual(['/tmp/miaoma-design-1.png']);
    });

    it('stops after the configured repair limit', async () => {
        const codex: MiaomaCodexExecProvider = {
            execute: async () =>
                result({
                    formatVersion: 1,
                    passed: false,
                    summary: 'Still needs repair.',
                    issues: [
                        {
                            issueId: 'hero-spacing',
                            severity: 'error',
                            message: 'Hero spacing is too tight.',
                            nodeId: 'hero-frame'
                        }
                    ]
                })
        };
        const harness = createMiaomaDesignVisualHarness({
            codex,
            captureScreenshot: async () => ({ path: '/tmp/check.png' })
        });

        const loop = await harness.run({
            projectId: 'project-1',
            runId: 'run-1',
            prompt: 'Create a dashboard',
            state,
            workingDirectory: '/workspace/project',
            sandbox: 'workspace-write',
            maxRepairAttempts: 0
        });

        expect(loop.passed).toBe(false);
        expect(loop.attempts).toBe(0);
        expect(loop.checks).toHaveLength(1);
    });
});
