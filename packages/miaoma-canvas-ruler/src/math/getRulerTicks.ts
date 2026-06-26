/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    DEFAULT_MIN_MAJOR_STEP_PX,
    DEFAULT_MINOR_DIVISIONS
} from '../constants';
import type { RulerRenderOptions, RulerTick } from '../types';

import { pickRulerStep } from './pickRulerStep';
import { projectTickToViewport } from './projectTickToViewport';

const roundTickValue = (value: number) => Number.parseFloat(value.toFixed(4));

export const getRulerTicks = ({
    zoom,
    viewportSize,
    worldStart,
    worldEnd,
    minMajorStepPx = DEFAULT_MIN_MAJOR_STEP_PX,
    minorDivisions = DEFAULT_MINOR_DIVISIONS
}: RulerRenderOptions): RulerTick[] => {
    const majorStep = pickRulerStep({ zoom, minMajorStepPx });
    const minorStep = majorStep / minorDivisions;
    const start = Math.floor(worldStart / minorStep) * minorStep;
    const end = worldEnd + minorStep;
    const ticks: RulerTick[] = [];

    for (let value = start; value <= end; value += minorStep) {
        const rounded = roundTickValue(value);
        const offset = projectTickToViewport(rounded, worldStart, zoom);

        if (
            offset < -minorStep * zoom ||
            offset > viewportSize + minorStep * zoom
        ) {
            continue;
        }

        const isMajor =
            Math.abs(rounded / majorStep - Math.round(rounded / majorStep)) <
            0.0001;

        ticks.push({
            value: rounded,
            offset,
            level: isMajor ? 'major' : 'minor',
            label: isMajor ? String(Math.round(rounded)) : undefined
        });
    }

    return ticks;
};
