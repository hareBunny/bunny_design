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

    it('preserves multiple schema style items in editor arrays', () => {
        const schemaDocument = {
            version: '2.14',
            children: [
                {
                    id: 'rect-1',
                    type: 'rectangle',
                    width: 10,
                    height: 10,
                    fill: [
                        { type: 'color', color: '#ffffff' },
                        {
                            type: 'gradient',
                            gradientType: 'radial',
                            colors: [
                                { color: '#ffffff', position: 0 },
                                { color: '#ffffff00', position: 1 }
                            ]
                        }
                    ],
                    stroke: [
                        {
                            type: 'color',
                            color: '#000000',
                            width: 2,
                            align: 'inner'
                        },
                        {
                            type: 'color',
                            color: '#ff0000',
                            width: 1
                        }
                    ],
                    effect: [
                        {
                            type: 'shadow',
                            color: '#00000033',
                            offset: { x: 1, y: 2 },
                            blur: 4
                        },
                        {
                            type: 'shadow',
                            shadowType: 'inner',
                            color: '#ffffff40',
                            blur: 2
                        }
                    ]
                }
            ]
        } as unknown as MiaomaDesignDocument;

        const editorDocument = schemaToEditorDocument(schemaDocument);
        const node = editorDocument.children[0];

        expect(node.fills).toHaveLength(2);
        expect(node.fills[1]).toMatchObject({
            type: 'gradient',
            gradientType: 'radial'
        });
        expect(node.strokes).toHaveLength(2);
        expect(node.strokes[0]).toMatchObject({
            type: 'color',
            width: 2,
            align: 'inner'
        });
        expect(node.effects).toHaveLength(2);
        expect(node.effects[1]).toMatchObject({
            type: 'shadow',
            shadowType: 'inner',
            blur: 2
        });
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
    it('maps style arrays back to schema style arrays', () => {
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

        expect(node.fill).toMatchObject([{ type: 'color', color: '#ffffff' }]);
        expect(node.stroke).toMatchObject([
            { type: 'color', color: '#000000', width: 2, align: 'inner' }
        ]);
        expect(node.strokeWidth).toBe(2);
        expect(node.effect).toMatchObject([
            {
                type: 'shadow',
                color: '#00000033',
                offset: { x: 1, y: 2 },
                blur: 4
            }
        ]);
        expect(node.opacity).toBe(25);
    });

    it('maps multiple editor style items back to schema arrays', () => {
        const editorDocument: EditorDocument = {
            version: '1.0.0',
            children: [
                {
                    id: 'rect-1',
                    type: 'rectangle',
                    width: 10,
                    height: 10,
                    fills: [
                        {
                            id: 'fill-1',
                            enabled: true,
                            type: 'color',
                            color: '#ffffff'
                        },
                        {
                            id: 'fill-2',
                            enabled: true,
                            type: 'gradient',
                            gradientType: 'radial',
                            colors: [
                                { color: '#ffffff', position: 0 },
                                { color: '#ffffff00', position: 1 }
                            ]
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
                        },
                        {
                            id: 'stroke-2',
                            enabled: true,
                            type: 'color',
                            color: '#ff0000',
                            width: 1
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
                        },
                        {
                            id: 'effect-2',
                            enabled: true,
                            type: 'shadow',
                            shadowType: 'inner',
                            color: '#ffffff40',
                            offsetX: 0,
                            offsetY: 0,
                            blur: 2
                        }
                    ]
                }
            ]
        };

        const renderable = editorDocumentToRenderable(editorDocument);
        const node = renderable.children[0];

        expect(node.fill).toHaveLength(2);
        expect(node.fill?.[1]).toMatchObject({
            type: 'gradient',
            gradientType: 'radial'
        });
        expect(node.stroke).toHaveLength(2);
        expect(node.stroke?.[0]).toMatchObject({
            type: 'color',
            width: 2,
            align: 'inner'
        });
        expect(node.effect).toHaveLength(2);
        expect(node.effect?.[1]).toMatchObject({
            type: 'shadow',
            shadowType: 'inner',
            blur: 2
        });
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

describe('design variable adapters', () => {
    it('preserves variables and references through the editor round trip', () => {
        const schemaDocument: MiaomaDesignDocument = {
            version: '2.14',
            variables: {
                surface: { type: 'color', value: '#ffffff' },
                border: { type: 'color', value: '#dddddd' },
                radius: { type: 'number', value: 8 }
            },
            children: [
                {
                    id: 'frame-1',
                    type: 'frame',
                    width: 100,
                    height: 80,
                    fill: '$surface',
                    stroke: '$border',
                    strokeWidth: 2,
                    cornerRadius: '$radius',
                    children: []
                }
            ]
        };

        const editorDocument = schemaToEditorDocument(schemaDocument);
        const renderable = editorDocumentToRenderable(editorDocument);

        expect(editorDocument).toMatchObject({
            variables: schemaDocument.variables,
            children: [
                {
                    fills: [{ type: 'variable', reference: '$surface' }],
                    strokes: [
                        { type: 'variable', reference: '$border', width: 2 }
                    ],
                    cornerRadius: '$radius'
                }
            ]
        });
        expect(renderable).toMatchObject({
            variables: schemaDocument.variables,
            children: [
                {
                    fill: ['$surface'],
                    stroke: ['$border'],
                    strokeWidth: 2,
                    cornerRadius: '$radius'
                }
            ]
        });
    });
});
