/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type MiaomaDimension = number | 'fill_container' | 'hug_contents';

export type MiaomaCornerRadius = number | [number, number, number, number];

export type MiaomaSpacing =
    | number
    | [number, number]
    | [number, number, number, number];

export type MiaomaLayoutDirection = 'none' | 'horizontal' | 'vertical';

export type MiaomaJustifyContent =
    | 'start'
    | 'center'
    | 'end'
    | 'space_between'
    | 'space_around';

export type MiaomaAlignItems = 'start' | 'center' | 'end' | 'stretch';
