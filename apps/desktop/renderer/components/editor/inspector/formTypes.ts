/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    EditorNode,
    FillItem,
    StrokeItem
} from '@miaoma-design-ai/miaoma-editor-core';

import type {
    InspectorDimensionMode,
    InspectorLayoutAlignment,
    InspectorLayoutGapMode
} from './layoutFieldUtils';

export type InspectorFillFormItem = {
    itemId: string;
    enabled: boolean;
    type: FillItem['type'];
    color: string;
    opacity: string;
    rotation: string;
    url: string;
    mode: 'fill' | 'fit' | 'stretch';
    gradientType: 'linear' | 'radial' | 'angular' | '';
    gradientColors: {
        color: string;
        position: number;
    }[];
};

export type InspectorStrokeFormItem = {
    itemId: string;
    enabled: boolean;
    type: StrokeItem['type'];
    color: string;
    opacity: string;
    rotation: string;
    url: string;
    mode: 'fill' | 'fit' | 'stretch';
    gradientType: 'linear' | 'radial' | 'angular' | '';
    gradientColors: {
        color: string;
        position: number;
    }[];
    width: string;
    align: 'center' | 'inner' | 'outer' | '';
};

export type InspectorEffectFormItem = {
    itemId: string;
    enabled: boolean;
    type: 'shadow';
    shadowType: 'inner' | 'outer' | '';
    color: string;
    offsetX: string;
    offsetY: string;
    blur: string;
};

export type InspectorFormValues = {
    nodeId: string;
    nodeType: EditorNode['type'] | '';
    name: string;
    opacity: string;
    x: string;
    y: string;
    rotation: string;
    layout: 'none' | 'vertical' | 'horizontal';
    layoutAlignment: InspectorLayoutAlignment;
    layoutGapMode: InspectorLayoutGapMode;
    gap: string;
    cornerRadius: string;
    width: string;
    widthMode: InspectorDimensionMode;
    height: string;
    heightMode: InspectorDimensionMode;
    paddingHorizontal: string;
    paddingVertical: string;
    clip: boolean;
    content: string;
    fontSize: string;
    fills: InspectorFillFormItem[];
    strokes: InspectorStrokeFormItem[];
    effects: InspectorEffectFormItem[];
};
