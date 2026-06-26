/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export const NODE_TYPES = [
    'frame',
    'rectangle',
    'ellipse',
    'icon',
    'text'
] as const;

export const FILL_TYPES = ['color', 'gradient', 'image'] as const;

export const LAYOUT_TYPES = ['none', 'horizontal', 'vertical'] as const;

export const TEXT_GROWTH_TYPES = [
    'auto',
    'fixed-width',
    'fixed-width-height'
] as const;
