/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
    type MiaomaDesignDocument,
    NODE_TYPES,
    strictValidateDesignDocument
} from '../src';

const coverSchemaPath = fileURLToPath(
    new URL('../../../miaoma-design-schema.json', import.meta.url)
);
const editorSchemaPath = fileURLToPath(
    new URL('../../../miaoma-design-design-schema.json', import.meta.url)
);

const readFixture = (path: string) =>
    JSON.parse(readFileSync(path, 'utf8')) as unknown;

describe('miaoma design schema validation', () => {
    it('exposes the supported node type literals', () => {
        expect(NODE_TYPES).toEqual([
            'frame',
            'rectangle',
            'ellipse',
            'icon',
            'text'
        ]);
    });

    it('validates the cover schema fixture without diagnostics', () => {
        const result = strictValidateDesignDocument(
            readFixture(coverSchemaPath)
        );

        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }

        expect(result.diagnostics).toEqual([]);
        expect(result.document.version).toBe('2.14');
        expect(result.document.children[0]).toMatchObject({
            type: 'frame',
            name: '01-cover',
            width: 595,
            height: 842
        });
    });

    it('validates the editor schema fixture without dropping supported nodes', () => {
        const result = strictValidateDesignDocument(
            readFixture(editorSchemaPath)
        );
        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }
        const root = result.document.children[0];

        expect(result.diagnostics).toEqual([]);
        expect(root).toMatchObject({
            type: 'frame',
            name: 'Miaoma Editor Recreation Course',
            width: 1920,
            height: 1205
        });
    });

    it('normalizes flow-like nested frames to horizontal layout when children rely on auto positioning', () => {
        const result = strictValidateDesignDocument(
            readFixture(editorSchemaPath)
        );
        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }
        const root = result.document.children[0];

        if (root.type !== 'frame') {
            throw new Error('Expected root editor node to be a frame.');
        }

        const toolbar = root.children?.[0];
        if (!toolbar || toolbar.type !== 'frame') {
            throw new Error('Expected toolbar node to be a frame.');
        }

        const header = toolbar.children?.[0];
        if (!header || header.type !== 'frame') {
            throw new Error('Expected header node to be a frame.');
        }

        const target = header.children?.[0];

        expect(target).toMatchObject({
            type: 'frame',
            name: 'Main Title Region'
        });
        if (!target || target.type !== 'frame') {
            throw new Error('Expected target node to be a frame.');
        }
        expect(target.children?.length ?? 0).toBeGreaterThan(0);
        expect(target.layout).toBe('horizontal');
    });

    it('reports disabled fills and unsupported node types', () => {
        const result = strictValidateDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'frame',
                    id: 'root',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    fill: { type: 'image', enabled: false, url: 'off.png' },
                    children: [{ type: 'polygon', id: 'unsupported' }]
                }
            ]
        });

        expect(result.success).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'disabled_fill' }),
                expect.objectContaining({ code: 'unsupported_node_type' })
            ])
        );
    });

    it('reports invalid_fill for malformed supported fill payloads', () => {
        const result = strictValidateDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'frame',
                    id: 'root',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    fill: { type: 'image', enabled: true },
                    children: [
                        {
                            type: 'rectangle',
                            id: 'shape',
                            x: 0,
                            y: 0,
                            width: 20,
                            height: 20,
                            fill: {
                                type: 'gradient',
                                enabled: true,
                                colors: []
                            }
                        }
                    ]
                }
            ]
        });

        expect(result.success).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: '$.children[0].fill',
                    code: 'invalid_fill'
                }),
                expect.objectContaining({
                    path: '$.children[0].children[0].fill',
                    code: 'invalid_fill'
                })
            ])
        );
        expect(result.diagnostics).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: '$.children[0].fill',
                    code: 'unsupported_fill_type'
                }),
                expect.objectContaining({
                    path: '$.children[0].children[0].fill',
                    code: 'unsupported_fill_type'
                })
            ])
        );
    });

    it('accepts style fields as arrays without flattening supported items', () => {
        const result = strictValidateDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'rectangle',
                    id: 'shape',
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                    fill: [
                        { type: 'color', color: '#101010ff' },
                        {
                            type: 'gradient',
                            gradientType: 'radial',
                            colors: [
                                { color: '#ffffffff', position: 0 },
                                { color: '#ffffff00', position: 1 }
                            ]
                        }
                    ],
                    stroke: [
                        {
                            type: 'color',
                            color: '#202020ff',
                            width: 2,
                            align: 'inner'
                        },
                        {
                            type: 'gradient',
                            gradientType: 'linear',
                            colors: [
                                { color: '#303030ff', position: 0 },
                                { color: '#404040ff', position: 1 }
                            ],
                            width: 1
                        }
                    ],
                    effect: [
                        {
                            type: 'shadow',
                            shadowType: 'outer',
                            color: '#00000033',
                            offset: { x: 0, y: 4 },
                            blur: 12
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
        });

        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }

        const node = result.document.children[0];

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
            shadowType: 'inner'
        });
    });

    it('rejects string fills in strict mode', () => {
        const result = strictValidateDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'rectangle',
                    id: 'shape',
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                    fill: '#ffffff'
                }
            ]
        } satisfies MiaomaDesignDocument | Record<string, unknown>);

        expect(result.success).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: '$.children[0].fill',
                    code: 'invalid_fill'
                })
            ])
        );
    });

    it('rejects rectangles missing required dimensions in strict mode', () => {
        const result = strictValidateDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'rectangle',
                    id: 'shape',
                    height: 10
                }
            ]
        });

        expect(result.success).toBe(false);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: '$.children[0].width',
                    code: 'invalid_node'
                })
            ])
        );
    });

    it('accepts space_around justifyContent in strict mode', () => {
        const result = strictValidateDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'frame',
                    id: 'frame-space-around',
                    width: 160,
                    height: 64,
                    layout: 'horizontal',
                    justifyContent: 'space_around',
                    alignItems: 'center',
                    children: []
                }
            ]
        });

        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }

        expect(result.document.children[0]).toMatchObject({
            type: 'frame',
            justifyContent: 'space_around',
            alignItems: 'center'
        });
    });
});
