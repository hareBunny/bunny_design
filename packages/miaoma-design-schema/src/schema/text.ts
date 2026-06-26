/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDimension } from './layout';

export type MiaomaTextGrowth = 'auto' | 'fixed-width' | 'fixed-width-height';

export type MiaomaTextAlign = 'left' | 'center' | 'right' | 'justify';

export type MiaomaTextStyle = {
    content: string;
    width?: MiaomaDimension;
    height?: MiaomaDimension;
    textGrowth?: MiaomaTextGrowth;
    textAlign?: MiaomaTextAlign;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    lineHeight?: number;
};
