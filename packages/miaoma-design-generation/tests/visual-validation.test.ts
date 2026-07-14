/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    type MiaomaDesignDocumentState,
    parseMiaomaDesignRepairBatch,
    parseMiaomaDesignVisualCheck,
    replaceMiaomaDesignRepairs
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

describe('visual validation contracts', () => {
    it('parses a visual check with actionable node metadata', () => {
        expect(
            parseMiaomaDesignVisualCheck({
                formatVersion: 1,
                passed: false,
                summary: 'Hero spacing needs repair.',
                issues: [
                    {
                        issueId: 'hero-spacing',
                        severity: 'error',
                        message: 'Hero content is too close to the edge.',
                        nodeId: 'hero-frame',
                        assignmentId: 'hero',
                        suggestedFix: 'Increase horizontal padding.'
                    }
                ]
            })
        ).toEqual({
            formatVersion: 1,
            passed: false,
            summary: 'Hero spacing needs repair.',
            issues: [
                {
                    issueId: 'hero-spacing',
                    severity: 'error',
                    message: 'Hero content is too close to the edge.',
                    nodeId: 'hero-frame',
                    assignmentId: 'hero',
                    suggestedFix: 'Increase horizontal padding.'
                }
            ]
        });
    });

    it('replaces only the node ids declared by a repair batch', () => {
        const batch = parseMiaomaDesignRepairBatch({
            variables: undefined,
            input: {
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
            }
        });
        const updated = replaceMiaomaDesignRepairs({
            state,
            expectedRevision: 0,
            batch
        });

        expect(updated.revision).toBe(1);
        expect(updated.document.children[0]).toMatchObject({
            children: [expect.objectContaining({ name: 'Hero repaired' })]
        });
    });

    it('rejects a repair whose replacement ids do not match its targets', () => {
        expect(() =>
            parseMiaomaDesignRepairBatch({
                input: {
                    formatVersion: 1,
                    repairs: [
                        {
                            repairId: 'repair-hero',
                            nodeIds: ['hero-frame'],
                            nodes: [
                                {
                                    id: 'different-node',
                                    type: 'frame',
                                    width: 100,
                                    height: 100,
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            })
        ).toThrow('Repair contains invalid nodes');
    });
});
