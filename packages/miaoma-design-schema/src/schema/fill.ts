/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaVariableReference } from './variable';

export type MiaomaColorFill = {
    type: 'color';
    color: string;
};

type MiaomaGradientStop = {
    color: string;
    position: number;
};

type MiaomaGradientPoint = {
    x?: number;
    y?: number;
};

type MiaomaGradientSize = {
    width?: number;
    height?: number;
};

type MiaomaGradientFillBase = {
    type: 'gradient';
    rotation?: number;
    colors: MiaomaGradientStop[];
    center?: MiaomaGradientPoint;
    size?: MiaomaGradientSize;
};

export type MiaomaLinearGradientFill = MiaomaGradientFillBase & {
    gradientType: 'linear';
};

export type MiaomaRadialGradientFill = MiaomaGradientFillBase & {
    gradientType: 'radial';
};

export type MiaomaImageFill = {
    type: 'image';
    url: string;
    mode: 'fill' | 'fit' | 'stretch';
};

export type MiaomaFill =
    | MiaomaVariableReference
    | MiaomaColorFill
    | MiaomaLinearGradientFill
    | MiaomaRadialGradientFill
    | MiaomaImageFill;

export type MiaomaStrokeAlign = 'center' | 'inner' | 'outer';

export type MiaomaStroke =
    | MiaomaVariableReference
    | (Exclude<MiaomaFill, MiaomaVariableReference> & {
          width?: number;
          align?: MiaomaStrokeAlign;
      });

export type MiaomaShadowEffect = {
    type: 'shadow';
    shadowType?: 'inner' | 'outer';
    color: string;
    offset?: {
        x: number;
        y: number;
    };
    blur?: number;
};
