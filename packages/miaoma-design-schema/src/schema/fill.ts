/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

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
    | MiaomaColorFill
    | MiaomaLinearGradientFill
    | MiaomaRadialGradientFill
    | MiaomaImageFill;

export type MiaomaStroke = MiaomaFill & {
    width?: number;
    align?: 'center' | 'inner' | 'outer';
};

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
