/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    EditorAlignItems,
    EditorCornerRadius,
    EditorDimension,
    EditorJustifyContent,
    EditorLayoutDirection,
    EditorSpacing
} from './primitives';
import type { EffectItem, FillItem, StrokeItem } from './style';

type EditorNodeBase = {
    id: string;
    type: 'frame' | 'text' | 'rectangle' | 'ellipse' | 'icon';
    name?: string;
    opacity?: number;
    x?: number;
    y?: number;
    rotation?: number;
    fills: FillItem[];
    strokes: StrokeItem[];
    effects: EffectItem[];
};

export type EditorFrameNode = EditorNodeBase & {
    type: 'frame';
    width?: EditorDimension;
    height?: EditorDimension;
    clip?: boolean;
    layout?: EditorLayoutDirection;
    gap?: number;
    padding?: EditorSpacing;
    justifyContent?: EditorJustifyContent;
    alignItems?: EditorAlignItems;
    cornerRadius?: EditorCornerRadius;
    children: EditorNode[];
};

export type EditorRectangleNode = EditorNodeBase & {
    type: 'rectangle';
    width?: EditorDimension;
    height?: EditorDimension;
    cornerRadius?: EditorCornerRadius;
};

export type EditorEllipseNode = EditorNodeBase & {
    type: 'ellipse';
    width?: EditorDimension;
    height?: EditorDimension;
};

export type EditorIconNode = EditorNodeBase & {
    type: 'icon';
    width?: EditorDimension;
    height?: EditorDimension;
    icon?: string;
    library?: string;
};

export type EditorTextNode = EditorNodeBase & {
    type: 'text';
    content?: string;
    width?: EditorDimension;
    height?: EditorDimension;
    textGrowth?: 'auto' | 'fixed-width' | 'fixed-width-height';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    lineHeight?: number;
};

export type EditorNode =
    | EditorEllipseNode
    | EditorFrameNode
    | EditorIconNode
    | EditorRectangleNode
    | EditorTextNode;
