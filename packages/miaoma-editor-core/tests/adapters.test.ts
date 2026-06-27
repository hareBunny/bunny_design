/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import {
    type EditorDocument,
    editorDocumentToRenderable,
    schemaToEditorDocument
} from '../src';

describe('schemaToEditorDocument', () => {
    it('normalizes fill, stroke, and effect into stable arrays', () => {
        const schemaDocument: MiaomaDesignDocument = {
            version: '2.14',
            children: [
                {
                    id: 'rect-1',
                    type: 'rectangle',
                    width: 10,
                    height: 10,
                    opacity: 25,
                    fill: { type: 'color', color: '#ffffff' },
                    stroke: { type: 'color', color: '#000000' },
                    strokeWidth: 1,
                    effect: {
                        type: 'shadow',
                        color: '#00000033',
                        offset: { x: 1, y: 2 },
                        blur: 4
                    }
                }
            ]
        };

        const editorDocument = schemaToEditorDocument(schemaDocument);
        const node = editorDocument.children[0];

        expect(node.fills).toHaveLength(1);
        expect(node.strokes).toHaveLength(1);
        expect(node.effects).toHaveLength(1);
        expect(node.fills[0].id).toBeTruthy();
        expect(node.strokes[0].id).toBeTruthy();
        expect(node.effects[0].id).toBeTruthy();
        expect((node as { opacity?: number }).opacity).toBe(25);
    });

    it('preserves space_around justifyContent on flow layout frames', () => {
        const schemaDocument: MiaomaDesignDocument = {
            version: '2.14',
            children: [
                {
                    id: 'frame-1',
                    type: 'frame',
                    width: 160,
                    height: 64,
                    layout: 'horizontal',
                    justifyContent: 'space_around',
                    alignItems: 'center',
                    children: []
                }
            ]
        };

        const editorDocument = schemaToEditorDocument(schemaDocument);
        const node = editorDocument.children[0];

        expect(node).toMatchObject({
            type: 'frame',
            justifyContent: 'space_around',
            alignItems: 'center'
        });
    });
});

describe('editorDocumentToRenderable', () => {
    it('maps style arrays back to the current renderable schema shape', () => {
        const editorDocument: EditorDocument = {
            version: '1.0.0',
            children: [
                {
                    id: 'rect-1',
                    type: 'rectangle',
                    width: 10,
                    height: 10,
                    opacity: 25,
                    fills: [
                        {
                            id: 'fill-1',
                            enabled: true,
                            type: 'color',
                            color: '#ffffff'
                        }
                    ],
                    strokes: [
                        {
                            id: 'stroke-1',
                            enabled: true,
                            type: 'color',
                            color: '#000000',
                            width: 2,
                            align: 'inner'
                        }
                    ],
                    effects: [
                        {
                            id: 'effect-1',
                            enabled: true,
                            type: 'shadow',
                            color: '#00000033',
                            offsetX: 1,
                            offsetY: 2,
                            blur: 4
                        }
                    ]
                }
            ]
        };

        const renderable = editorDocumentToRenderable(editorDocument);
        const node = renderable.children[0];

        expect(node.fill).toMatchObject({ type: 'color', color: '#ffffff' });
        expect(node.stroke).toMatchObject({ type: 'color', color: '#000000' });
        expect(node.strokeWidth).toBe(2);
        expect(node.effect).toMatchObject({
            type: 'shadow',
            color: '#00000033',
            offset: { x: 1, y: 2 },
            blur: 4
        });
        expect(node.opacity).toBe(25);
    });

    it('maps space_around justifyContent back to the renderable schema shape', () => {
        const editorDocument: EditorDocument = {
            version: '1.0.0',
            children: [
                {
                    id: 'frame-1',
                    type: 'frame',
                    width: 160,
                    height: 64,
                    layout: 'horizontal',
                    justifyContent: 'space_around',
                    alignItems: 'center',
                    fills: [],
                    strokes: [],
                    effects: [],
                    children: []
                }
            ]
        };

        const renderable = editorDocumentToRenderable(editorDocument);
        const node = renderable.children[0];

        expect(node).toMatchObject({
            type: 'frame',
            justifyContent: 'space_around',
            alignItems: 'center'
        });
    });
});
