/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import type {
    FillItem,
    StrokeItem
} from '@miaoma-design-ai/miaoma-editor-core';

import type {
    InspectorFillFormItem,
    InspectorStrokeFormItem
} from './formTypes';

const HEX_COLOR_PATTERN =
    /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const expandHexDigits = (digits: string) =>
    digits.length <= 4
        ? digits
              .split('')
              .map((digit) => digit.repeat(2))
              .join('')
        : digits;

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

type InspectorPaintFormItem =
    | Pick<
          InspectorFillFormItem,
          'type' | 'color' | 'url' | 'gradientColors' | 'gradientType'
      >
    | Pick<
          InspectorStrokeFormItem,
          'type' | 'color' | 'url' | 'gradientColors' | 'gradientType'
      >;

export const createInspectorStyleItemId = (prefix: string) =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const toOpacityInputValue = (value: number) =>
    `${clampPercentage(Math.round(value))}%`;

export const parseOpacityPercentage = (value: string) => {
    const trimmedValue = value.trim().replace(/%$/, '');

    if (!trimmedValue) {
        return null;
    }

    const parsedValue = Number(trimmedValue);

    return Number.isFinite(parsedValue) ? clampPercentage(parsedValue) : null;
};

export const splitHexColorValue = (value: string) => {
    const trimmedValue = value.trim();
    const match = HEX_COLOR_PATTERN.exec(trimmedValue);

    if (!match) {
        return null;
    }

    const expandedDigits = expandHexDigits(match[1]);
    const baseColor = `#${expandedDigits.slice(0, 6).toLowerCase()}`;

    if (expandedDigits.length === 6) {
        return {
            color: baseColor,
            opacity: '100%'
        };
    }

    const alpha = Number.parseInt(expandedDigits.slice(6, 8), 16);

    return {
        color: baseColor,
        opacity: toOpacityInputValue((alpha / 255) * 100)
    };
};

export const composeHexColorValue = (
    colorValue: string,
    opacityValue: string
) => {
    const parsedColor = splitHexColorValue(colorValue);
    const parsedOpacity = parseOpacityPercentage(opacityValue);

    if (!parsedColor || parsedOpacity === null) {
        return null;
    }

    if (parsedOpacity >= 100) {
        return parsedColor.color;
    }

    const alphaHex = Math.round((parsedOpacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

    return `${parsedColor.color}${alphaHex}`;
};

export const getColorOpacityValue = (colorValue: string) =>
    splitHexColorValue(colorValue)?.opacity ?? '100%';

export const getColorWithoutOpacity = (colorValue: string) =>
    splitHexColorValue(colorValue)?.color ?? colorValue;

const getImageLabel = (url: string) => {
    const trimmedValue = url.trim();

    if (!trimmedValue) {
        return 'Image fill';
    }

    const segments = trimmedValue.split('/');

    return segments.at(-1) || 'Image fill';
};

const toGradientPreview = (
    colors: InspectorPaintFormItem['gradientColors']
): CSSProperties => {
    if (!colors.length) {
        return {
            background: 'linear-gradient(135deg, #e5e7eb 0%, #cbd5e1 100%)'
        };
    }

    return {
        background: `linear-gradient(135deg, ${colors
            .map((stop) => `${stop.color} ${Math.round(stop.position * 100)}%`)
            .join(', ')})`
    };
};

export const getPaintDisplayValue = (item: InspectorPaintFormItem) => {
    if (item.type === 'gradient') {
        return `${item.gradientType === 'radial' ? 'Radial' : item.gradientType === 'angular' ? 'Angular' : 'Linear'} gradient`;
    }

    if (item.type === 'image') {
        return getImageLabel(item.url);
    }

    return item.color;
};

export const getPaintPreviewStyle = (
    item: InspectorPaintFormItem
): CSSProperties => {
    if (item.type === 'gradient') {
        return toGradientPreview(item.gradientColors);
    }

    if (item.type === 'image') {
        return item.url.trim()
            ? {
                  backgroundColor: '#d9d9d9',
                  backgroundImage: `url(${item.url})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
              }
            : {
                  background: '#d9d9d9'
              };
    }

    return {
        background: item.color || '#ffffff'
    };
};

export const toGradientFormValues = (
    item: FillItem | StrokeItem
): InspectorFillFormItem['gradientColors'] =>
    item.type === 'gradient'
        ? item.colors.map((stop) => ({
              color: stop.color,
              position: stop.position
          }))
        : [];
