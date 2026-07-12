/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type EditorDimension = number | 'fill_container' | 'hug_contents';

export type EditorCornerRadius = MiaomaCornerRadius;

export type EditorSpacing =
    | number
    | [number, number]
    | [number, number, number, number];

export type EditorLayoutDirection = 'none' | 'horizontal' | 'vertical';

export type EditorJustifyContent =
    | 'start'
    | 'center'
    | 'end'
    | 'space_between'
    | 'space_around';

export type EditorAlignItems = 'start' | 'center' | 'end' | 'stretch';
import type { MiaomaCornerRadius } from '@miaoma-design-ai/miaoma-design-schema';
