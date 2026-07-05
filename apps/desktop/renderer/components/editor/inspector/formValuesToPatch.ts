/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    EditorNode,
    EditorNodePatch
} from '@miaoma-design-ai/miaoma-editor-core';

import type { InspectorFormValues } from './formTypes';
import {
    getDimensionValueFromControls,
    getLayoutAxisValues,
    getPaddingValueFromControls,
    parseFiniteNumber
} from './layoutFieldUtils';

export const parseOptionalNumber = parseFiniteNumber;

const toDisplayedOpacityValue = (opacity: EditorNode['opacity']) => {
    if (opacity === undefined) {
        return 100;
    }

    return opacity <= 1 ? opacity * 100 : opacity;
};

const toStoredOpacityValue = (
    currentOpacity: EditorNode['opacity'],
    nextOpacity: number
) =>
    currentOpacity !== undefined && currentOpacity <= 1 && nextOpacity > 1
        ? nextOpacity / 100
        : nextOpacity;

const parseCornerRadiusValue = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const parts = trimmedValue
        .split('/')
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length === 1) {
        return parseOptionalNumber(parts[0]);
    }

    if (parts.length !== 4) {
        return null;
    }

    const parsedValues = parts.map(parseOptionalNumber);

    if (parsedValues.some((part) => part === null)) {
        return null;
    }

    return parsedValues as [number, number, number, number];
};

const isCornerRadiusEqual = (
    left: number | [number, number, number, number] | undefined,
    right: number | [number, number, number, number] | undefined
) => {
    if (Array.isArray(left) || Array.isArray(right)) {
        if (!Array.isArray(left) || !Array.isArray(right)) {
            return false;
        }

        return left.every((value, index) => value === right[index]);
    }

    return left === right;
};

const isSpacingEqual = (
    left:
        | number
        | [number, number]
        | [number, number, number, number]
        | undefined,
    right: number | [number, number]
) => {
    if (Array.isArray(left)) {
        if (left.length === 2 && Array.isArray(right) && right.length === 2) {
            return left[0] === right[0] && left[1] === right[1];
        }

        if (left.length === 4 && Array.isArray(right) && right.length === 2) {
            return (
                left[0] === right[0] &&
                left[2] === right[0] &&
                left[1] === right[1] &&
                left[3] === right[1]
            );
        }

        return false;
    }

    if (typeof right === 'number') {
        return left === right;
    }

    return (
        typeof left === 'number' && left === right[0] && right[0] === right[1]
    );
};

const hasDimensions = (node: EditorNode) =>
    node.type === 'frame' ||
    node.type === 'rectangle' ||
    node.type === 'ellipse' ||
    node.type === 'icon' ||
    node.type === 'text';

export const formValuesToPatch = (
    node: EditorNode,
    values: InspectorFormValues
): EditorNodePatch => {
    const patch: EditorNodePatch = {};

    if (values.name !== (node.name ?? '')) {
        patch.name = values.name;
    }

    const x = parseOptionalNumber(values.x);
    if (x !== null && x !== node.x) {
        patch.x = x;
    }

    const y = parseOptionalNumber(values.y);
    if (y !== null && y !== node.y) {
        patch.y = y;
    }

    const rotation = parseOptionalNumber(values.rotation);
    if (rotation !== null && rotation !== node.rotation) {
        patch.rotation = rotation;
    }

    const opacity = parseOptionalNumber(values.opacity);
    if (opacity !== null && opacity !== toDisplayedOpacityValue(node.opacity)) {
        patch.opacity = toStoredOpacityValue(node.opacity, opacity);
    }

    if (hasDimensions(node)) {
        if (node.type === 'frame') {
            const width = getDimensionValueFromControls({
                inputValue: values.width,
                mode: values.widthMode
            });
            if (width !== null && width !== node.width) {
                patch.width = width;
            }

            const height = getDimensionValueFromControls({
                inputValue: values.height,
                mode: values.heightMode
            });
            if (height !== null && height !== node.height) {
                patch.height = height;
            }
        } else {
            const width = parseOptionalNumber(values.width);
            if (width !== null && width !== node.width) {
                patch.width = width;
            }

            const height = parseOptionalNumber(values.height);
            if (height !== null && height !== node.height) {
                patch.height = height;
            }
        }
    }

    if (node.type === 'frame' && values.clip !== Boolean(node.clip)) {
        patch.clip = values.clip;
    }

    if (node.type === 'frame') {
        const nextLayout = values.layout || 'none';

        if (nextLayout !== (node.layout ?? 'none')) {
            patch.layout = nextLayout;
        }

        if (nextLayout !== 'none') {
            const { alignItems, justifyContent } = getLayoutAxisValues({
                alignment: values.layoutAlignment,
                gapMode: values.layoutGapMode,
                layout: nextLayout
            });

            if (alignItems !== node.alignItems) {
                patch.alignItems = alignItems;
            }

            if (justifyContent !== node.justifyContent) {
                patch.justifyContent = justifyContent;
            }

            const gap =
                values.layoutGapMode === 'fixed'
                    ? parseOptionalNumber(values.gap)
                    : undefined;

            if (values.layoutGapMode === 'fixed') {
                if (gap !== null && gap !== node.gap) {
                    patch.gap = gap;
                }
            } else if (node.gap !== undefined) {
                patch.gap = undefined;
            }

            const padding = getPaddingValueFromControls({
                horizontalValue: values.paddingHorizontal,
                verticalValue: values.paddingVertical
            });

            if (padding !== null && !isSpacingEqual(node.padding, padding)) {
                patch.padding = padding;
            }
        }
    }

    if (node.type === 'frame' || node.type === 'rectangle') {
        const cornerRadius = parseCornerRadiusValue(values.cornerRadius);

        if (
            cornerRadius !== null &&
            !isCornerRadiusEqual(node.cornerRadius, cornerRadius)
        ) {
            patch.cornerRadius = cornerRadius;
        }
    }

    if (node.type === 'text') {
        const fontSize = parseOptionalNumber(values.fontSize);
        if (fontSize !== null && fontSize !== node.fontSize) {
            patch.fontSize = fontSize;
        }
    }

    return patch;
};
