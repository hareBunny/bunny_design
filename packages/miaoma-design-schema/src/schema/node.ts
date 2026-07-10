/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaFill, MiaomaShadowEffect, MiaomaStroke } from './fill';
import type {
    MiaomaAlignItems,
    MiaomaCornerRadius,
    MiaomaDimension,
    MiaomaJustifyContent,
    MiaomaLayoutDirection,
    MiaomaSpacing
} from './layout';
import type { MiaomaTextStyle } from './text';

type MiaomaBaseNode = {
    id: string;
    name?: string;
    opacity?: number;
    x?: number;
    y?: number;
    rotation?: number;
    fill?: MiaomaFill | MiaomaFill[];
    stroke?: MiaomaStroke | MiaomaStroke[];
    strokeWidth?: number;
    strokeAlignment?: 'center' | 'inner' | 'outer';
    cornerRadius?: MiaomaCornerRadius;
    effect?: MiaomaShadowEffect | MiaomaShadowEffect[];
};

export type MiaomaFrameNode = MiaomaBaseNode & {
    type: 'frame';
    width?: MiaomaDimension;
    height?: MiaomaDimension;
    clip?: boolean;
    layout?: MiaomaLayoutDirection;
    gap?: number;
    padding?: MiaomaSpacing;
    justifyContent?: MiaomaJustifyContent;
    alignItems?: MiaomaAlignItems;
    children?: MiaomaDesignNode[];
};

export type MiaomaRectangleNode = MiaomaBaseNode & {
    type: 'rectangle';
    width: MiaomaDimension;
    height: MiaomaDimension;
};

export type MiaomaEllipseNode = MiaomaBaseNode & {
    type: 'ellipse';
    width: MiaomaDimension;
    height: MiaomaDimension;
};

export type MiaomaIconNode = MiaomaBaseNode & {
    type: 'icon';
    width: MiaomaDimension;
    height: MiaomaDimension;
    icon: string;
    library?: string;
};

export type MiaomaTextNode = MiaomaBaseNode &
    MiaomaTextStyle & {
        type: 'text';
    };

export type MiaomaDesignNode =
    | MiaomaEllipseNode
    | MiaomaFrameNode
    | MiaomaIconNode
    | MiaomaRectangleNode
    | MiaomaTextNode;
