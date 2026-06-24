/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
    createDefaultDocumentKernel,
    createDocumentKernel,
    createRenderTree,
    parseDesignDocument
} from '../src';

const coverDocument = {
    version: '2.14',
    children: [
        {
            type: 'frame',
            id: 'bA55W',
            x: 409,
            y: 92,
            name: '01-cover',
            clip: true,
            width: 595,
            height: 842,
            fill: {
                type: 'gradient',
                gradientType: 'linear',
                enabled: true,
                rotation: -450,
                size: { height: 1 },
                colors: [
                    { color: '#293975ff', position: 0 },
                    { color: '#5f73b6ff', position: 1 }
                ],
                center: { x: 0.5, y: 0.5 }
            },
            layout: 'none',
            children: [
                {
                    type: 'text',
                    id: 'fX4RY',
                    x: 637.1544189453125,
                    y: 24.8623046875,
                    name: 'MIAOMAEDU',
                    rotation: -89.87383497578344,
                    fill: '#ffffffff',
                    content: 'MIAOMAEDU',
                    textAlign: 'center',
                    fontFamily: 'Alimama ShuHeiTi',
                    fontSize: 124.84886932373047,
                    fontWeight: '700'
                },
                {
                    type: 'text',
                    id: 'chdCl',
                    x: 32.15478515625,
                    y: 150.8623046875,
                    name: 'AI 大前端 全栈架构师训练营',
                    fill: '#ffffffff',
                    textGrowth: 'fixed-width',
                    width: 416,
                    content: 'AI 大前端\n全栈架构师训练营',
                    fontFamily: 'Alimama ShuHeiTi',
                    fontSize: 50,
                    fontWeight: '700'
                },
                {
                    type: 'rectangle',
                    id: 'J8x6r',
                    x: 32.15478515625,
                    y: 40,
                    name: '小鹅通水印组合 1',
                    fill: {
                        type: 'image',
                        enabled: true,
                        url: 'image-import.png',
                        mode: 'fill'
                    },
                    width: 145,
                    height: 58
                },
                {
                    type: 'text',
                    id: 'bzip3',
                    x: 32.15478515625,
                    y: 766,
                    name: '为每一位前端开发者重塑AI时代下的核心竞争力',
                    fill: {
                        type: 'gradient',
                        gradientType: 'linear',
                        enabled: true,
                        rotation: -450,
                        size: { height: 1 },
                        colors: [
                            { color: '#324380ff', position: 0 },
                            { color: '#d5ddf8ff', position: 1 }
                        ]
                    },
                    content: '为每一位前端开发者重塑AI时代下的核心竞争力',
                    fontFamily: 'Heiti SC',
                    fontSize: 16,
                    fontWeight: '500'
                },
                {
                    type: 'text',
                    id: 'QpZRS',
                    x: 32.15478515625,
                    y: 291.8623046875,
                    name: '课程说明',
                    fill: '#dadff1ff',
                    content:
                        '2026 课程体系焕新，前端深度融合 AI 原生开发范式，直击生成式 UI、\n端侧 AI 推理等核心技术，打造全栈 + AI 的架构级能力闭环',
                    lineHeight: 1.2000000476837158,
                    fontFamily: 'Heiti SC',
                    fontSize: 14,
                    fontWeight: '500'
                },
                {
                    type: 'text',
                    id: 'g3fQAQ',
                    x: 32.15478515625,
                    y: 646.8623046875,
                    name: '主讲讲师：合一',
                    fill: '#ffffffcc',
                    content: '主讲讲师：合一',
                    fontFamily: 'Heiti SC',
                    fontSize: 20,
                    fontWeight: '500'
                }
            ]
        }
    ],
    fileToken: '449b0cbb-b04e-4309-848b-e80d204dbc24'
};

const packageJsonPath = fileURLToPath(
    new URL('../package.json', import.meta.url)
);

describe('document parser', () => {
    it('parses the 01-cover frame into supported node unions', () => {
        const result = parseDesignDocument(coverDocument);

        expect(result.diagnostics).toEqual([]);
        expect(result.document.version).toBe('2.14');
        expect(result.document.children).toHaveLength(1);

        const frame = result.document.children[0];

        if (frame.type !== 'frame') {
            throw new Error('Expected 01-cover to parse as a frame.');
        }

        expect(frame).toMatchObject({
            type: 'frame',
            id: 'bA55W',
            name: '01-cover',
            x: 409,
            y: 92,
            width: 595,
            height: 842,
            clip: true,
            layout: 'none'
        });
        expect(frame.children).toHaveLength(6);
        expect(frame.fill).toMatchObject({
            type: 'gradient',
            gradientType: 'linear',
            rotation: -450
        });
        expect(frame.children[0]).toMatchObject({
            type: 'text',
            content: 'MIAOMAEDU',
            rotation: -89.87383497578344
        });
        expect(frame.children[2]).toMatchObject({
            type: 'rectangle',
            width: 145,
            height: 58,
            fill: { type: 'image', url: 'image-import.png', mode: 'fill' }
        });
    });

    it('creates a stable render tree from the parsed document', () => {
        const result = parseDesignDocument(coverDocument);
        const renderTree = createRenderTree(result.document);
        const frame = renderTree.children[0];

        if (frame.type !== 'frame') {
            throw new Error('Expected render tree root to be a frame.');
        }

        expect(renderTree.version).toBe('2.14');
        expect(frame.type).toBe('frame');
        expect(frame.children.map((child) => child.type)).toEqual([
            'text',
            'text',
            'rectangle',
            'text',
            'text',
            'text'
        ]);
    });

    it('skips unsupported nodes and disabled fills with diagnostics', () => {
        const result = parseDesignDocument({
            version: '2.14',
            children: [
                {
                    type: 'frame',
                    id: 'root',
                    width: 100,
                    height: 100,
                    fill: { type: 'image', enabled: false, url: 'off.png' },
                    children: [
                        {
                            type: 'ellipse',
                            id: 'unsupported',
                            width: 20,
                            height: 20
                        }
                    ]
                }
            ]
        });

        const frame = result.document.children[0];

        if (frame.type !== 'frame') {
            throw new Error('Expected root to parse as a frame.');
        }

        expect(frame.fill).toBeUndefined();
        expect(frame.children).toEqual([]);
        expect(result.diagnostics).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ code: 'disabled_fill' }),
                expect.objectContaining({ code: 'unsupported_node_type' })
            ])
        );
    });

    it('allows node and render behavior to be extended through document kernel plugins', () => {
        const kernel = createDocumentKernel({
            nodePlugins: [
                {
                    type: 'sticky',
                    parse: ({ value, path, context }) => [
                        {
                            type: 'rectangle',
                            id: context.readString(value.id) ?? path,
                            name: context.readString(value.name),
                            x: context.readNumber(value.x) ?? 0,
                            y: context.readNumber(value.y) ?? 0,
                            width: 88,
                            height: 44,
                            fill: context.parseFill(value.fill, `${path}.fill`)
                        }
                    ]
                }
            ],
            renderPlugins: [
                {
                    transformNode: (node) =>
                        node.type === 'rectangle'
                            ? {
                                  ...node,
                                  width: node.width + 12
                              }
                            : node
                }
            ]
        });

        const result = kernel.parseDocument({
            version: '2.14',
            children: [
                {
                    type: 'sticky',
                    id: 'note',
                    name: 'Plugin Note',
                    x: 12,
                    y: 18,
                    fill: '#ffcc00ff'
                }
            ]
        });
        const renderTree = kernel.createRenderTree(result.document);

        expect(result.diagnostics).toEqual([]);
        expect(result.document.children[0]).toMatchObject({
            type: 'rectangle',
            id: 'note',
            name: 'Plugin Note',
            width: 88,
            height: 44,
            fill: { type: 'color', color: '#ffcc00ff' }
        });
        expect(renderTree.children[0]).toMatchObject({
            type: 'rectangle',
            width: 100
        });
    });

    it('exposes a default document kernel for parser and render tree compatibility', () => {
        const kernel = createDefaultDocumentKernel();
        const parsedByKernel = kernel.parseDocument(coverDocument);
        const parsedByFacade = parseDesignDocument(coverDocument);
        const renderTree = kernel.createRenderTree(parsedByKernel.document);

        expect(parsedByKernel).toEqual(parsedByFacade);
        expect(renderTree).toEqual(createRenderTree(parsedByFacade.document));
    });

    it('uses tsdown as the package build entrypoint', () => {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

        expect(packageJson.scripts.build).toBe('tsdown');
        expect(packageJson.exports['.'].import).toBe('./dist/index.js');
        expect(packageJson.exports['.'].types).toBe('./dist/index.d.ts');
        expect(packageJson.devDependencies.tsdown).toBeDefined();
    });
});
