/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type RulerAxis = 'horizontal' | 'vertical';

export type RulerTickLevel = 'minor' | 'major';

export type RulerTick = {
    value: number;
    offset: number;
    level: RulerTickLevel;
    label?: string;
};

export type RulerRenderOptions = {
    axis: RulerAxis;
    zoom: number;
    viewportSize: number;
    worldStart: number;
    worldEnd: number;
    minMajorStepPx?: number;
    minorDivisions?: number;
};

export type CanvasRulerProps = {
    axis: RulerAxis;
    zoom: number;
    viewportSize: number;
    worldStart: number;
    worldEnd: number;
    thickness?: number;
    className?: string;
};
