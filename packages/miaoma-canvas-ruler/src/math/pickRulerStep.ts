/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { DEFAULT_MIN_MAJOR_STEP_PX } from '../constants';

const STEP_BASES = [1, 2, 5] as const;

export const pickRulerStep = ({
    zoom,
    minMajorStepPx = DEFAULT_MIN_MAJOR_STEP_PX
}: {
    zoom: number;
    minMajorStepPx?: number;
}) => {
    const safeZoom = Math.max(zoom, Number.EPSILON);
    const minWorldStep = minMajorStepPx / safeZoom;
    const exponent = Math.floor(Math.log10(minWorldStep));
    const magnitude = 10 ** exponent;

    for (const base of STEP_BASES) {
        const candidate = base * magnitude;
        if (candidate >= minWorldStep) {
            return candidate;
        }
    }

    return 10 * magnitude;
};
