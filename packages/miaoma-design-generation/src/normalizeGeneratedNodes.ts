/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignVariables } from '@miaoma-design-ai/miaoma-design-schema';

type UnknownRecord = Record<string, unknown>;

const GENERATED_NODE_KEYS = [
    'id',
    'type',
    'name',
    'opacity',
    'x',
    'y',
    'rotation',
    'width',
    'height',
    'fill',
    'stroke',
    'strokeWidth',
    'strokeAlignment',
    'cornerRadius',
    'effect',
    'layout',
    'gap',
    'padding',
    'justifyContent',
    'alignItems',
    'clip',
    'children',
    'icon',
    'library',
    'content',
    'textAlign',
    'fontFamily',
    'fontSize',
    'fontWeight'
] as const;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeReference = (
    value: unknown,
    expectedType: 'color' | 'number' | 'string',
    variables?: MiaomaDesignVariables
) => {
    if (typeof value !== 'string' || value.startsWith('$')) {
        return value;
    }

    return variables?.[value]?.type === expectedType ? `$${value}` : value;
};

const normalizePaint = (
    value: unknown,
    variables?: MiaomaDesignVariables
): unknown => {
    if (typeof value === 'string') {
        return normalizeReference(value, 'color', variables);
    }
    if (Array.isArray(value)) {
        return value.map((item) => normalizePaint(item, variables));
    }
    if (!isRecord(value)) {
        return value;
    }

    return {
        ...value,
        color: normalizeReference(value.color, 'color', variables),
        colors: Array.isArray(value.colors)
            ? value.colors.map((stop) => normalizePaint(stop, variables))
            : value.colors
    };
};

const normalizeNode = (
    value: unknown,
    variables?: MiaomaDesignVariables
): unknown => {
    if (!isRecord(value)) {
        return value;
    }

    const fontWeightVariable =
        typeof value.fontWeight === 'string'
            ? variables?.[value.fontWeight]
            : undefined;
    const supportedProperties = Object.fromEntries(
        GENERATED_NODE_KEYS.flatMap((key) =>
            value[key] === undefined ? [] : [[key, value[key]]]
        )
    );

    return {
        ...supportedProperties,
        fill: normalizePaint(value.fill, variables),
        stroke: normalizePaint(value.stroke, variables),
        effect: normalizePaint(value.effect, variables),
        cornerRadius: normalizeReference(
            value.cornerRadius,
            'number',
            variables
        ),
        fontFamily: normalizeReference(value.fontFamily, 'string', variables),
        fontWeight:
            fontWeightVariable?.type === 'number'
                ? String(fontWeightVariable.value)
                : value.fontWeight,
        children: Array.isArray(value.children)
            ? value.children.map((child) => normalizeNode(child, variables))
            : value.children
    };
};

export const normalizeMiaomaGeneratedNodes = (
    nodes: unknown[],
    variables?: MiaomaDesignVariables
) => nodes.map((node) => normalizeNode(node, variables));
