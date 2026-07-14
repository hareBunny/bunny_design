/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
    MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS,
    parseMiaomaDesignFragment,
    parseMiaomaDesignGenerationPlan,
    parseMiaomaDesignVariablesDraft
} from '../src';

const assignment = {
    assignmentId: 'hero',
    agentId: 'newton' as const,
    order: 0,
    objective: 'Design the hero region',
    region: {
        regionId: 'hero',
        label: 'Hero',
        targetNodeIds: ['root']
    },
    status: 'pending' as const
};

describe('generation output contracts', () => {
    it('publishes schemas for structured Codex output', () => {
        expect(
            Object.values(MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS).every(
                existsSync
            )
        ).toBe(true);
    });

    it('normalizes assignments into their deterministic execution order', () => {
        const plan = parseMiaomaDesignGenerationPlan({
            formatVersion: 1,
            assignments: [
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
                },
                assignment
            ]
        });

        expect(
            plan.assignments.map(({ assignmentId }) => assignmentId)
        ).toEqual(['hero', 'content']);
        expect(
            plan.assignments.every(({ status }) => status === 'pending')
        ).toBe(true);
    });

    it('rejects plans that reuse a collaborator', () => {
        expect(() =>
            parseMiaomaDesignGenerationPlan({
                formatVersion: 1,
                assignments: [
                    assignment,
                    {
                        ...assignment,
                        assignmentId: 'content',
                        order: 1,
                        region: {
                            ...assignment.region,
                            regionId: 'content'
                        }
                    }
                ]
            })
        ).toThrow('Duplicate collaborator agent');
    });

    it('parses typed design variables', () => {
        expect(
            parseMiaomaDesignVariablesDraft({
                formatVersion: 1,
                variables: {
                    accent: { type: 'color', value: '#2563eb' },
                    spacing: { type: 'number', value: 8 },
                    heading: { type: 'string', value: 'Inter' }
                }
            }).variables
        ).toEqual({
            accent: { type: 'color', value: '#2563eb' },
            spacing: { type: 'number', value: 8 },
            heading: { type: 'string', value: 'Inter' }
        });
    });

    it('validates fragment nodes and their assignment ownership', () => {
        const fragment = parseMiaomaDesignFragment({
            assignment,
            variables: { accent: { type: 'color', value: '#2563eb' } },
            input: {
                formatVersion: 1,
                fragmentId: 'fragment-hero',
                assignmentId: 'hero',
                nodes: [
                    {
                        id: 'hero-frame',
                        type: 'frame',
                        width: 'fill_container',
                        height: 640,
                        fill: '$accent',
                        children: []
                    }
                ]
            }
        });

        expect(fragment.nodes[0]).toMatchObject({
            id: 'hero-frame',
            fill: ['$accent']
        });
    });

    it('rejects duplicate node ids inside a fragment', () => {
        expect(() =>
            parseMiaomaDesignFragment({
                assignment,
                input: {
                    formatVersion: 1,
                    fragmentId: 'fragment-hero',
                    assignmentId: 'hero',
                    nodes: [
                        { id: 'duplicate', type: 'frame', children: [] },
                        { id: 'duplicate', type: 'frame', children: [] }
                    ]
                }
            })
        ).toThrow('Duplicate generated node id');
    });
});
