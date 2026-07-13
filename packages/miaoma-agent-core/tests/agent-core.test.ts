/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    createMiaomaGenerationRun,
    isMiaomaGenerationRunTransitionAllowed,
    MIAOMA_AGENT_ACTIVITY_LABELS,
    MIAOMA_AGENT_ROSTER,
    MIAOMA_COLLABORATOR_AGENT_IDS,
    type MiaomaGenerationAssignment,
    parseMiaomaGenerationRun,
    validateMiaomaGenerationAssignments
} from '../src';

const assignment = (
    agentId: MiaomaGenerationAssignment['agentId'],
    order: number
): MiaomaGenerationAssignment => ({
    assignmentId: `assignment-${order}`,
    agentId,
    order,
    objective: `Design region ${order}`,
    region: { regionId: `region-${order}`, label: `Region ${order}` },
    status: 'pending'
});

describe('miaoma agent core', () => {
    it('defines one coordinator and five named collaborators', () => {
        expect(
            MIAOMA_AGENT_ROSTER.map(({ id, name, role }) => ({
                id,
                name,
                role
            }))
        ).toEqual([
            { id: 'miaoma', name: 'miaoma', role: 'coordinator' },
            { id: 'newton', name: 'Newton', role: 'collaborator' },
            { id: 'tesla', name: 'Tesla', role: 'collaborator' },
            { id: 'maxwell', name: 'Maxwell', role: 'collaborator' },
            { id: 'curie', name: 'Curie', role: 'collaborator' },
            { id: 'faraday', name: 'Faraday', role: 'collaborator' }
        ]);
    });

    it('defines the visible labels for each activity kind', () => {
        expect(Object.values(MIAOMA_AGENT_ACTIVITY_LABELS)).toEqual([
            'Bash',
            'Read variables',
            'Set variables',
            'Read objects',
            'Checked guidelines',
            'Planned visual',
            'Designed',
            'Visual check',
            'Repair'
        ]);
    });

    it('creates a queued run with history-safe defaults', () => {
        expect(
            createMiaomaGenerationRun({
                runId: 'run-1',
                projectId: 'project-1',
                prompt: 'Create a CRM dashboard',
                createdAt: '2026-07-20T00:00:00.000Z'
            })
        ).toMatchObject({
            formatVersion: 1,
            coordinatorAgentId: 'miaoma',
            status: 'queued',
            assignments: [],
            activities: [],
            documentRevision: 0
        });
    });

    it('sorts unique collaborator assignments by region order', () => {
        const assignments = MIAOMA_COLLABORATOR_AGENT_IDS.map(
            (agentId, index) => assignment(agentId, 4 - index)
        );

        expect(
            validateMiaomaGenerationAssignments(assignments).map(
                ({ order }) => order
            )
        ).toEqual([0, 1, 2, 3, 4]);
    });

    it('rejects more than five collaborator assignments', () => {
        const assignments = MIAOMA_COLLABORATOR_AGENT_IDS.map(
            (agentId, index) => assignment(agentId, index)
        );

        expect(() =>
            validateMiaomaGenerationAssignments([
                ...assignments,
                assignment('newton', 5)
            ])
        ).toThrow('at most five assignments');
    });

    it('parses persisted runs only when activity relationships are valid', () => {
        const run = {
            ...createMiaomaGenerationRun({
                runId: 'run-1',
                projectId: 'project-1',
                prompt: 'Create a CRM dashboard',
                createdAt: '2026-07-20T00:00:00.000Z'
            }),
            status: 'designing' as const,
            assignments: [assignment('newton', 0)],
            activities: [
                {
                    activityId: 'activity-1',
                    runId: 'run-1',
                    agentId: 'newton' as const,
                    assignmentId: 'assignment-0',
                    kind: 'bash' as const,
                    input: { command: '/bin/zsh -lc pwd' },
                    status: 'completed' as const,
                    createdAt: '2026-07-20T00:00:00.000Z',
                    startedAt: '2026-07-20T00:00:00.000Z',
                    completedAt: '2026-07-20T00:00:01.000Z',
                    output: { summary: '/Users/heyi/Downloads' }
                }
            ]
        };

        expect(parseMiaomaGenerationRun(run)).toEqual(run);
        expect(
            parseMiaomaGenerationRun({
                ...run,
                activities: [{ ...run.activities[0], runId: 'other-run' }]
            })
        ).toBeNull();
    });

    it.each([
        ['queued', 'preparing', true],
        ['preparing', 'designing', true],
        ['designing', 'validating', true],
        ['validating', 'repairing', true],
        ['repairing', 'validating', true],
        ['validating', 'completed', true],
        ['completed', 'designing', false]
    ] as const)(
        'validates the %s -> %s run transition',
        (from, to, expected) => {
            expect(isMiaomaGenerationRunTransitionAllowed(from, to)).toBe(
                expected
            );
        }
    );
});
