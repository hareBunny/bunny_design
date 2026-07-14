/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import type { MiaomaGenerationAssignment } from '@miaoma-design-ai/miaoma-agent-core';

import {
    appendMiaomaDesignFragment,
    applyMiaomaDesignVariables,
    type MiaomaDesignDocumentState,
    type MiaomaDesignFragment,
    type MiaomaDesignVariablesDraft
} from '../src';

const state: MiaomaDesignDocumentState = {
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

const assignment: MiaomaGenerationAssignment = {
    assignmentId: 'hero',
    agentId: 'newton',
    order: 0,
    objective: 'Design the hero region',
    region: {
        regionId: 'hero',
        label: 'Hero',
        targetNodeIds: ['root']
    },
    status: 'pending'
};

const fragment: MiaomaDesignFragment = {
    formatVersion: 1,
    fragmentId: 'fragment-hero',
    assignmentId: 'hero',
    nodes: [
        {
            id: 'hero-frame',
            type: 'frame',
            width: 'fill_container',
            height: 640,
            children: []
        }
    ]
};

describe('design document assembly', () => {
    it('merges generated variables without removing existing variables', () => {
        const draft: MiaomaDesignVariablesDraft = {
            formatVersion: 1,
            variables: { accent: { type: 'color', value: '#2563eb' } }
        };
        const current = {
            ...state,
            document: {
                ...state.document,
                variables: { spacing: { type: 'number' as const, value: 8 } }
            }
        };

        const updated = applyMiaomaDesignVariables({
            state: current,
            expectedRevision: 0,
            draft
        });

        expect(updated.revision).toBe(1);
        expect(updated.document.variables).toEqual({
            spacing: { type: 'number', value: 8 },
            accent: { type: 'color', value: '#2563eb' }
        });
    });

    it('appends a fragment to its planned target frame', () => {
        const updated = appendMiaomaDesignFragment({
            state,
            expectedRevision: 0,
            assignment,
            fragment
        });

        expect(updated.revision).toBe(1);
        expect(updated.document.children[0]).toMatchObject({
            id: 'root',
            children: [expect.objectContaining({ id: 'hero-frame' })]
        });
    });

    it.each([
        {
            label: 'stale revision',
            expectedRevision: 1,
            nextAssignment: assignment,
            nextFragment: fragment,
            error: 'Expected document revision 1'
        },
        {
            label: 'duplicate node id',
            expectedRevision: 0,
            nextAssignment: assignment,
            nextFragment: {
                ...fragment,
                nodes: [{ ...fragment.nodes[0], id: 'root' }]
            },
            error: 'Generated node id already exists'
        },
        {
            label: 'missing target',
            expectedRevision: 0,
            nextAssignment: {
                ...assignment,
                region: {
                    ...assignment.region,
                    targetNodeIds: ['missing']
                }
            },
            nextFragment: fragment,
            error: 'Target node was not found'
        }
    ])(
        'rejects $label',
        ({ expectedRevision, nextAssignment, nextFragment, error }) => {
            expect(() =>
                appendMiaomaDesignFragment({
                    state,
                    expectedRevision,
                    assignment: nextAssignment,
                    fragment: nextFragment
                })
            ).toThrow(error);
        }
    );
});
