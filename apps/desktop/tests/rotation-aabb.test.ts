/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    getAabbFromCenter,
    getCenterFromAabb,
    getRenderOriginFromAabb,
    getRotatedBoundingBoxSize
} from '../renderer/utils/rotationAabb';

const expectClose = (actual: number, expected: number) => {
    expect(actual).toBeCloseTo(expected, 2);
};

describe('rotationAabb', () => {
    it('matches the 300x100 figma samples for 90, 180, and 45 degrees', () => {
        expect(
            getRotatedBoundingBoxSize({ width: 300, height: 100, rotation: 90 })
        ).toEqual({ width: 100, height: 300 });

        const aabb90 = getAabbFromCenter({
            centerX: 150,
            centerY: 50,
            width: 300,
            height: 100,
            rotation: 90
        });
        expect(aabb90).toEqual({ x: 100, y: -100, width: 100, height: 300 });

        const aabb180 = getAabbFromCenter({
            centerX: 150,
            centerY: 50,
            width: 300,
            height: 100,
            rotation: 180
        });
        expect(aabb180).toEqual({ x: 0, y: 0, width: 300, height: 100 });

        const aabb45 = getAabbFromCenter({
            centerX: 150,
            centerY: 50,
            width: 300,
            height: 100,
            rotation: 45
        });
        expectClose(aabb45.x, 8.5787);
        expectClose(aabb45.y, -91.4213);
        expectClose(aabb45.width, 282.8427);
        expectClose(aabb45.height, 282.8427);
    });

    it('round-trips center and render origin from a rotated aabb', () => {
        const center = getCenterFromAabb({
            x: 20,
            y: 30,
            width: 100,
            height: 50,
            rotation: 90
        });

        expect(center).toEqual({ x: 45, y: 80 });
        expect(
            getRenderOriginFromAabb({
                x: 20,
                y: 30,
                width: 100,
                height: 50,
                rotation: 90
            })
        ).toEqual({ x: -5, y: 55 });
    });
});
