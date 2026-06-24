/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
    createRenderTree,
    parseDesignDocument
} from '@miaoma-design-ai/document';

import { CanvasDocumentRenderer } from '../renderer/components/document/CanvasDocumentRenderer';

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
    ]
};

describe('CanvasDocumentRenderer', () => {
    it('renders the 01-cover render tree with Pencil-like geometry and fills', () => {
        const parsed = parseDesignDocument(coverDocument);
        const renderTree = createRenderTree(parsed.document);
        const markup = renderToStaticMarkup(
            <CanvasDocumentRenderer
                document={renderTree}
                resolveAsset={(url) => `/assets/${url}`}
            />
        );

        expect(markup).toContain('data-document-renderer="true"');
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
});
