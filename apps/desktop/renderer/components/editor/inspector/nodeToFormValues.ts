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
    InspectorEffectFormItem,
    InspectorFillFormItem,
    InspectorFormValues,
    InspectorStrokeFormItem
} from './formTypes';
import {
    getAlignmentFromFrameNode,
    getDimensionInputValue,
    getDimensionMode,
    getGapMode,
    getPaddingInputs
} from './layoutFieldUtils';
import {
    getColorOpacityValue,
    getColorWithoutOpacity,
    toGradientFormValues
} from './styleFieldUtils';

const toInputValue = (value: number | string | undefined) =>
    value === undefined ? '' : String(value);

const toOpacityInputValue = (value: number | undefined) => {
    if (value === undefined) {
        return '100';
    }

    return value <= 1 ? String(value * 100) : String(value);
};

const toFillFormItem = (item: FillItem): InspectorFillFormItem => ({
    itemId: item.id,
    enabled: item.enabled,
    type: item.type,
    color:
        item.type === 'color'
            ? getColorWithoutOpacity(item.color)
            : item.type === 'variable'
              ? item.reference
              : '',
    opacity: item.type === 'color' ? getColorOpacityValue(item.color) : '100%',
    rotation: item.type === 'gradient' ? toInputValue(item.rotation) : '',
    url: item.type === 'image' ? item.url : '',
    mode: item.type === 'image' ? item.mode : 'fill',
    gradientType: item.type === 'gradient' ? item.gradientType : '',
    gradientColors: toGradientFormValues(item)
});

const toStrokeFormItem = (item: StrokeItem): InspectorStrokeFormItem => ({
    itemId: item.id,
    enabled: item.enabled,
    type: item.type,
    color:
        item.type === 'color'
            ? getColorWithoutOpacity(item.color)
            : item.type === 'variable'
              ? item.reference
              : '',
    opacity: item.type === 'color' ? getColorOpacityValue(item.color) : '100%',
    rotation: item.type === 'gradient' ? toInputValue(item.rotation) : '',
    url: item.type === 'image' ? item.url : '',
    mode: item.type === 'image' ? item.mode : 'fill',
    gradientType: item.type === 'gradient' ? item.gradientType : '',
    gradientColors: toGradientFormValues(item),
    width: toInputValue(item.width),
    align: item.align ?? ''
});

const toEffectFormItem = (
    item: EditorNode['effects'][number]
): InspectorEffectFormItem => ({
    itemId: item.id,
    enabled: item.enabled,
    type: 'shadow',
    shadowType: item.shadowType ?? '',
    color: item.color,
    offsetX: toInputValue(item.offsetX),
    offsetY: toInputValue(item.offsetY),
    blur: toInputValue(item.blur)
});

export const createEmptyInspectorFormValues = (): InspectorFormValues => ({
    nodeId: '',
    nodeType: '',
    name: '',
    opacity: '100',
    x: '',
    y: '',
    rotation: '',
    layout: 'none',
    layoutAlignment: 'top-left',
    layoutGapMode: 'fixed',
    gap: '0',
    cornerRadius: '',
    width: '',
    widthMode: 'fixed',
    height: '',
    heightMode: 'fixed',
    paddingHorizontal: '0',
    paddingVertical: '0',
    clip: false,
    fontSize: '',
    fills: [],
    strokes: [],
    effects: []
});

export const nodeToFormValues = (node: EditorNode): InspectorFormValues => ({
    ...(node.type === 'frame'
        ? getPaddingInputs(node.padding)
        : {
              paddingHorizontal: '0',
              paddingVertical: '0'
          }),
    nodeId: node.id,
    nodeType: node.type,
    name: node.name ?? '',
    opacity: toOpacityInputValue(node.opacity),
    x: toInputValue(node.x),
    y: toInputValue(node.y),
    rotation: toInputValue(node.rotation),
    layout: node.type === 'frame' ? (node.layout ?? 'none') : 'none',
    layoutAlignment:
        node.type === 'frame'
            ? getAlignmentFromFrameNode({
                  alignItems: node.alignItems,
                  gapMode: getGapMode(node.justifyContent),
                  justifyContent: node.justifyContent,
                  layout: node.layout
              })
            : 'top-left',
    layoutGapMode:
        node.type === 'frame' ? getGapMode(node.justifyContent) : 'fixed',
    gap: node.type === 'frame' ? toInputValue(node.gap) || '0' : '0',
    cornerRadius:
        node.type === 'frame' || node.type === 'rectangle'
            ? Array.isArray(node.cornerRadius)
                ? node.cornerRadius.join(' / ')
                : toInputValue(node.cornerRadius)
            : '',
    width:
        node.type === 'frame'
            ? getDimensionInputValue(node.width)
            : typeof node.width === 'number'
              ? String(node.width)
              : '',
    widthMode: node.type === 'frame' ? getDimensionMode(node.width) : 'fixed',
    height:
        node.type === 'frame'
            ? getDimensionInputValue(node.height)
            : typeof node.height === 'number'
              ? String(node.height)
              : '',
    heightMode: node.type === 'frame' ? getDimensionMode(node.height) : 'fixed',
    clip: node.type === 'frame' ? Boolean(node.clip) : false,
    fontSize: node.type === 'text' ? toInputValue(node.fontSize) : '',
    fills: node.fills.map(toFillFormItem),
    strokes: node.strokes.map(toStrokeFormItem),
    effects: node.effects.map(toEffectFormItem)
});
