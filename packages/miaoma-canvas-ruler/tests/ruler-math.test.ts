/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import { getRulerTicks, pickRulerStep, projectTickToViewport } from '../src';

describe('ruler math', () => {
    it('picks larger major steps as zoom goes down', () => {
        expect(pickRulerStep({ zoom: 1 })).toBe(100);
        expect(pickRulerStep({ zoom: 0.25 })).toBe(500);
        expect(pickRulerStep({ zoom: 4 })).toBe(20);
    });

    it('projects world values into viewport pixels', () => {
        expect(projectTickToViewport(200, 100, 2)).toBe(200);
        expect(projectTickToViewport(-50, -100, 1)).toBe(50);
    });

    it('builds major and minor ticks across negative and positive world ranges', () => {
        const ticks = getRulerTicks({
            axis: 'horizontal',
            zoom: 1,
            viewportSize: 600,
            worldStart: -200,
            worldEnd: 400
        });

        expect(
            ticks.some((tick) => tick.value === 0 && tick.label === '0')
        ).toBe(true);
        expect(
            ticks.some((tick) => tick.value === -100 && tick.level === 'major')
        ).toBe(true);
        expect(
            ticks.some((tick) => tick.value === -80 && tick.level === 'minor')
        ).toBe(true);
    });
});
