/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import type { MiaomaDesignNode } from '@miaoma-design-ai/miaoma-design-schema';

import { createMiaomaAssetCatalog } from '../src/assets';

describe('createMiaomaAssetCatalog', () => {
    it('replaces inline data images with stable asset references', () => {
        const imageData = Buffer.from('miaoma-image').toString('base64');
        const nodes: MiaomaDesignNode[] = [
            {
                id: 'frame-1',
                type: 'frame',
                width: 320,
                height: 240,
                fill: {
                    type: 'image',
                    url: `data:image/png;base64,${imageData}`,
                    mode: 'fill'
                },
                children: [
                    {
                        id: 'rectangle-1',
                        type: 'rectangle',
                        width: 20,
                        height: 20,
                        fill: {
                            type: 'image',
                            url: `data:image/png;base64,${imageData}`,
                            mode: 'fit'
                        }
                    }
                ]
            }
        ];

        const catalog = createMiaomaAssetCatalog(nodes);
        const frame = catalog.nodes[0];

        expect(frame?.fill).toMatchObject({
            type: 'image',
            url: expect.stringMatching(/^miaoma-asset:\/\/[a-f0-9]{64}$/)
        });
        expect(
            frame?.type === 'frame' ? frame.children?.[0]?.fill : undefined
        ).toMatchObject({
            type: 'image',
            url: expect.stringMatching(/^miaoma-asset:\/\/[a-f0-9]{64}$/)
        });
        expect(catalog.assets.size).toBe(1);
        expect([...catalog.assets.values()][0]).toMatchObject({
            mimeType: 'image/png',
            data: imageData
        });
    });

    it('preserves ordinary image URLs', () => {
        const nodes: MiaomaDesignNode[] = [
            {
                id: 'rectangle-1',
                type: 'rectangle',
                width: 20,
                height: 20,
                fill: {
                    type: 'image',
                    url: 'https://example.com/image.png',
                    mode: 'fill'
                }
            }
        ];

        const catalog = createMiaomaAssetCatalog(nodes);

        expect(catalog.nodes).toEqual(nodes);
        expect(catalog.assets.size).toBe(0);
    });
});
