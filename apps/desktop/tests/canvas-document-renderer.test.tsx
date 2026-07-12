/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
    type MiaomaDesignDocument,
    strictValidateDesignDocument
} from '@miaoma-design-ai/miaoma-design-schema';

import { CanvasDocumentRenderer } from '../renderer/components/document/CanvasDocumentRenderer';

const designSchemaPath = fileURLToPath(
    new URL('../../../miaoma-design-design-schema.json', import.meta.url)
);

const readDesignSchemaFixture = () =>
    JSON.parse(readFileSync(designSchemaPath, 'utf8')) as unknown;

const coverDocument: MiaomaDesignDocument = {
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
                rotation: -450,
                colors: [
                    { color: '#293975ff', position: 0 },
                    { color: '#5f73b6ff', position: 1 }
                ]
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
                    fill: { type: 'color', color: '#ffffffff' },
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
                    fill: { type: 'color', color: '#ffffffff' },
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
                        rotation: -450,
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
                    fill: { type: 'color', color: '#dadff1ff' },
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
                    fill: { type: 'color', color: '#ffffffcc' },
                    content: '主讲讲师：合一',
                    fontFamily: 'Heiti SC',
                    fontSize: 20,
                    fontWeight: '500'
                }
            ]
        }
    ]
};

describe('CanvasDocumentRenderer', () => {
    it('renders a rotated top-level node from aabb coordinates instead of raw top-left coordinates', () => {
        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={{
                    version: '2.14',
                    children: [
                        {
                            id: 'rotated-frame',
                            type: 'frame',
                            x: 20,
                            y: 30,
                            width: 100,
                            height: 50,
                            rotation: 90,
                            children: []
                        }
                    ]
                }}
            />
        );

        expect(markup).toContain('width:50px');
        expect(markup).toContain('height:100px');
        expect(markup).toContain('left:-25px');
        expect(markup).toContain('top:25px');
        expect(markup).toContain('transform-origin:center center');
    });

    it('renders the 01-cover render tree with Pencil-like geometry and fills', () => {
        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={coverDocument}
                resolveAsset={(url) => `/assets/${url}`}
            />
        );

        expect(markup).toContain('data-document-renderer="true"');
        expect(markup).toContain('user-select:none');
        expect(markup).toContain('data-design-node-name="01-cover"');
        expect(markup).toContain('width:595px');
        expect(markup).toContain('height:842px');
        expect(markup).toContain('overflow:hidden');
        expect(markup).toContain(
            'linear-gradient(90deg, #293975ff 0%, #5f73b6ff 100%)'
        );
        expect(markup).toContain('MIAOMAEDU');
        expect(markup).toContain('rotate(89.87383497578344deg)');
        expect(markup).toContain('AI 大前端');
        expect(markup).toContain('全栈架构师训练营');
        expect(markup).toContain('/assets/image-import.png');
        expect(markup).toContain('background-clip:text');
        expect(markup).toContain('主讲讲师：合一');
    });

    it('renders the complete Miaoma design schema with layout nodes, icons, and shape styles', () => {
        const result = strictValidateDesignDocument(readDesignSchemaFixture());

        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }

        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={result.document}
                resolveAsset={(url) => `/resolved/${url}`}
            />
        );

        expect(result.diagnostics).toEqual([]);
        expect(markup.match(/data-design-node-id=/g)).toHaveLength(297);
        expect(markup).toContain(
            'data-design-node-name="Miaoma Editor Recreation Course"'
        );
        expect(markup).toContain('width:1920px');
        expect(markup).toContain('height:1205px');
        expect(markup).toContain('border-radius:24px');
        expect(markup).toContain('border-width:1px');
        expect(markup).toContain('box-shadow:-4px 0px 20px #0000000f');
        expect(markup).toContain('data-design-node-name="Tool Rail"');
        expect(markup).toContain('flex-direction:column');
        expect(markup).toContain('gap:6px');
        expect(markup).toContain('padding:8px 6px');
        const mainTitleRegionStyle = markup.match(
            /data-design-node-name="Main Title Region" style="([^"]+)"/
        )?.[1];
        const documentTitleStyle = markup.match(
            /data-design-node-name="Document Title" style="([^"]+)"/
        )?.[1];

        expect(mainTitleRegionStyle).toContain('display:flex');
        expect(mainTitleRegionStyle).toContain('justify-content:space-between');
        expect(mainTitleRegionStyle).toContain('align-items:center');
        expect(mainTitleRegionStyle).toContain('padding:0px 24px');
        expect(documentTitleStyle).toContain('position:relative');
        expect(markup).toContain('data-design-node-name="Agents Icon"');
        expect(markup).toContain('data-design-icon-name="bot"');
        expect(markup).toContain('data-design-node-name="Close Dot"');
        expect(markup).toContain('border-radius:50%');
        expect(markup).toContain('miaoma-magicut.miaomadesign');
        expect(markup).toContain('Design anything...');
        expect(markup).toContain('Layout');
        expect(markup).toContain('Fill');
        expect(markup).toContain('Export layer');
        expect(markup).toContain('/resolved/favicon%40167.png');
    });

    it('marks the selected node in the render tree', () => {
        const result = strictValidateDesignDocument(readDesignSchemaFixture());

        expect(result.success).toBe(true);
        if (!result.success) {
            throw new Error(JSON.stringify(result.diagnostics, null, 2));
        }

        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={result.document}
                resolveAsset={(url) => `/resolved/${url}`}
                selectedNodeId="xV5nO"
            />
        );

        expect(markup).toContain('data-design-node-selected="true"');
        expect(markup).toContain('data-design-node-id="xV5nO"');
        expect(markup).toContain('editor-document-selection-frame');
        expect(markup).toContain('border:3px solid #4592FF');
        expect(markup).toContain('editor-document-selection-handle');
        expect(markup.match(/editor-document-selection-handle/g)).toHaveLength(
            4
        );
        expect(markup).toContain('data-selection-handle-position="top-left"');
        expect(markup).toContain('transform:translate(-50%, -50%)');
        expect(markup).toContain('data-selection-handle-position="top-right"');
        expect(markup).toContain('transform:translate(50%, -50%)');
        expect(markup).toContain(
            'data-selection-handle-position="bottom-right"'
        );
        expect(markup).toContain('transform:translate(50%, 50%)');
        expect(markup).toContain(
            'data-selection-handle-position="bottom-left"'
        );
        expect(markup).toContain('transform:translate(-50%, 50%)');
        expect(markup).toContain('editor-document-selection-size-label');
        expect(markup).toContain('data-selection-size-label="true"');
    });

    it('keeps selection chrome visually stable under canvas zoom', () => {
        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={coverDocument}
                selectedNodeId="bA55W"
                zoom={4}
            />
        );

        expect(markup).toContain('border:0.75px solid #4592FF');
        expect(markup).toContain('width:2.5px');
        expect(markup).toContain('height:2.5px');
        expect(markup).toContain('font-size:3.25px');
        expect(markup).toContain('line-height:6px');
    });

    it('mounts selected outlines in the renderer overlay layer outside clipped nodes', () => {
        const clippedDocument: MiaomaDesignDocument = {
            version: '2.14',
            children: [
                {
                    id: 'clipping-frame',
                    type: 'frame',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100,
                    clip: true,
                    fill: {
                        type: 'color',
                        color: '#ffffff'
                    },
                    children: [
                        {
                            id: 'clipped-child',
                            type: 'rectangle',
                            x: 80,
                            y: 70,
                            width: 40,
                            height: 30,
                            fill: {
                                type: 'color',
                                color: '#111111'
                            }
                        }
                    ]
                }
            ]
        };

        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={clippedDocument}
                selectedNodeId="clipped-child"
            />
        );
        const selectedNodeIndex = markup.indexOf(
            'data-design-node-id="clipped-child"'
        );
        const selectedNodeMarkup = markup.slice(
            selectedNodeIndex,
            markup.indexOf('</div>', selectedNodeIndex)
        );

        expect(markup).toContain('data-selection-overlay-layer="true"');
        expect(markup).toContain('data-selection-node-id="clipped-child"');
        expect(
            markup.indexOf('data-selection-overlay-layer="true"')
        ).toBeGreaterThan(selectedNodeIndex);
        expect(selectedNodeMarkup).not.toContain(
            'editor-document-selection-frame'
        );
        expect(markup).toContain('left:80px');
        expect(markup).toContain('top:70px');
        expect(markup).toContain('width:40px');
        expect(markup).toContain('height:30px');
        expect(markup).toContain('>40 × 30</');
    });

    it('maps node opacity values onto the DOM render style', () => {
        const documentWithOpacity: MiaomaDesignDocument = {
            version: '2.14',
            children: [
                {
                    id: 'frame-opacity',
                    type: 'frame',
                    width: 100,
                    height: 80,
                    opacity: 25,
                    fill: {
                        type: 'color',
                        color: '#ffffff'
                    },
                    children: []
                }
            ]
        };

        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer document={documentWithOpacity} />
        );

        expect(markup).toContain('opacity:0.25');
    });

    it('resolves document variables into canvas styles', () => {
        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={{
                    version: '2.14',
                    variables: {
                        surface: { type: 'color', value: '#f8fcf6' },
                        ink: { type: 'color', value: '#18302b' },
                        radius: { type: 'number', value: 8 },
                        body: { type: 'string', value: 'Inter' }
                    },
                    children: [
                        {
                            id: 'frame-variable',
                            type: 'frame',
                            width: 100,
                            height: 80,
                            fill: '$surface',
                            cornerRadius: '$radius',
                            children: [
                                {
                                    id: 'text-variable',
                                    type: 'text',
                                    content: 'Variables',
                                    fill: '$ink',
                                    fontFamily: '$body'
                                }
                            ]
                        }
                    ]
                }}
            />
        );

        expect(markup).toContain('background-color:#f8fcf6');
        expect(markup).toContain('border-radius:8px');
        expect(markup).toContain('color:#18302b');
        expect(markup).toContain(
            'font-family:&#x27;Inter&#x27;, system-ui, sans-serif'
        );
    });
});
