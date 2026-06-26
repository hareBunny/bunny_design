/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type MiaomaColorFill = {
    type: 'color';
    color: string;
};

export type MiaomaLinearGradientFill = {
    type: 'gradient';
    gradientType: 'linear';
    rotation?: number;
    colors: {
        color: string;
        position: number;
    }[];
};

export type MiaomaImageFill = {
    type: 'image';
    url: string;
    mode: 'fill' | 'fit' | 'stretch';
};

export type MiaomaFill =
    | MiaomaColorFill
    | MiaomaLinearGradientFill
    | MiaomaImageFill;

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
