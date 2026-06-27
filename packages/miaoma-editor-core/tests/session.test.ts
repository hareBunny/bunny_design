/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    createEditorSession,
    type EditorDocument,
    getNodeById,
    getSelectedNode
} from '../src';

const sampleDocument: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'frame-1',
            type: 'frame',
            name: 'Frame 1',
            x: 0,
            y: 0,
            width: 100,
            height: 80,
            fills: [],
            strokes: [],
            effects: [],
            children: []
        }
    ]
};

describe('editor session', () => {
    it('selects a node and exposes it through snapshot selectors', () => {
        const session = createEditorSession(sampleDocument);

        session.selectNode('frame-1');

        const snapshot = session.getSnapshot();

        expect(snapshot.selection.selectedNodeId).toBe('frame-1');
        expect(getSelectedNode(snapshot)?.id).toBe('frame-1');
        expect(getNodeById(snapshot.document, 'frame-1')?.name).toBe('Frame 1');
    });

    it('appends, updates, and removes style array items by stable id', () => {
        const session = createEditorSession(sampleDocument);

        session.appendStyleItem('frame-1', 'fills', {
            id: 'fill-1',
            enabled: true,
            type: 'color',
            color: '#ffffff'
        });
        session.appendStyleItem('frame-1', 'effects', {
            id: 'effect-1',
            enabled: true,
            type: 'shadow',
            color: '#00000033',
            offsetX: 1,
            offsetY: 2,
            blur: 6
        });
        session.updateStyleItem('frame-1', 'fills', 'fill-1', {
            color: '#ff0000'
        });
        session.removeStyleItem('frame-1', 'effects', 'effect-1');

        const node = session.getNodeById('frame-1');

        expect(node?.fills).toMatchObject([
            {
                id: 'fill-1',
                color: '#ff0000'
            }
        ]);
        expect(node?.effects).toEqual([]);
    });
});
