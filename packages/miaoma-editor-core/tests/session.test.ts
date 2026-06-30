/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    createDefaultEllipseNode,
    createDefaultFrameNode,
    createDefaultRectangleNode,
    createDefaultTextNode,
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

    it('appends a node at document root', () => {
        const session = createEditorSession(sampleDocument);
        const node = createDefaultTextNode({
            x: 24,
            y: 30,
            content: 'Hello'
        });

        session.appendNode(node);

        expect(session.getNodeById(node.id)).toMatchObject({
            id: node.id,
            type: 'text',
            x: 24,
            y: 30,
            content: 'Hello'
        });
        expect(session.getSnapshot().document.children).toContainEqual(
            expect.objectContaining({ id: node.id })
        );
    });

    it('appends a rectangle into a frame and exposes it through selectors', () => {
        const session = createEditorSession(sampleDocument);
        const node = createDefaultRectangleNode({
            x: 12,
            y: 18,
            width: 48,
            height: 32
        });

        session.appendChildNode('frame-1', node);

        expect(session.getNodeById(node.id)).toMatchObject({
            id: node.id,
            type: 'rectangle',
            x: 12,
            y: 18,
            width: 48,
            height: 32
        });
        expect(session.getNodeById('frame-1')).toMatchObject({
            children: [expect.objectContaining({ id: node.id })]
        });
    });

    it('inserts a child node at a stable index inside a frame', () => {
        const session = createEditorSession(sampleDocument);
        const existing = createDefaultEllipseNode({
            x: 40,
            y: 40,
            width: 20,
            height: 20
        });
        const inserted = createDefaultTextNode({
            x: 8,
            y: 12,
            content: 'Inserted'
        });

        session.appendChildNode('frame-1', existing);
        session.insertChildNode('frame-1', 0, inserted);

        expect(session.getNodeById('frame-1')).toMatchObject({
            children: [
                expect.objectContaining({ id: inserted.id }),
                expect.objectContaining({ id: existing.id })
            ]
        });
    });

    it('removes a temporary text node after cancellation', () => {
        const session = createEditorSession(sampleDocument);
        const node = createDefaultTextNode({
            x: 24,
            y: 30,
            content: ''
        });

        session.appendNode(node);
        session.removeNode(node.id);

        expect(session.getNodeById(node.id)).toBeNull();
    });
});

describe('default node factories', () => {
    it('creates frame, rectangle, ellipse, and text nodes with stable defaults', () => {
        const frame = createDefaultFrameNode({
            x: 0,
            y: 0,
            width: 320,
            height: 180
        });
        const rectangle = createDefaultRectangleNode({
            x: 12,
            y: 18,
            width: 48,
            height: 32
        });
        const ellipse = createDefaultEllipseNode({
            x: 20,
            y: 24,
            width: 36,
            height: 36
        });
        const text = createDefaultTextNode({
            x: 30,
            y: 40,
            content: 'Title'
        });

        expect(frame).toMatchObject({
            type: 'frame',
            name: 'Frame',
            width: 320,
            height: 180,
            children: [],
            fills: [],
            strokes: [],
            effects: []
        });
        expect(rectangle).toMatchObject({
            type: 'rectangle',
            name: 'Rectangle',
            width: 48,
            height: 32,
            cornerRadius: 0
        });
        expect(ellipse).toMatchObject({
            type: 'ellipse',
            name: 'Ellipse',
            width: 36,
            height: 36
        });
        expect(text).toMatchObject({
            type: 'text',
            name: 'Text',
            content: 'Title',
            textGrowth: 'auto'
        });
        expect(frame.id).toMatch(/^frame-/);
        expect(rectangle.id).toMatch(/^rectangle-/);
        expect(ellipse.id).toMatch(/^ellipse-/);
        expect(text.id).toMatch(/^text-/);
    });
});
