/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignNode } from '../schema/node';

import type { MiaomaInspectorGroupDefinition } from './groups';
import { INSPECTOR_GROUPS } from './groups';
import type { MiaomaInspectorPropertyDefinition } from './properties';

const SHAPE_NODE_TYPES: readonly MiaomaDesignNode['type'][] = [
    'frame',
    'rectangle',
    'ellipse',
    'icon'
];

const TEXT_NODE_TYPES: readonly MiaomaDesignNode['type'][] = ['text'];

const FRAME_AND_SHAPES: readonly MiaomaDesignNode['type'][] = [
    ...SHAPE_NODE_TYPES,
    'text'
];

const includesNodeType = (
    nodeTypes: readonly MiaomaDesignNode['type'][],
    nodeType: MiaomaDesignNode['type']
) => nodeTypes.includes(nodeType);

export const INSPECTOR_PROPERTY_REGISTRY: MiaomaInspectorPropertyDefinition[] =
    [
        {
            id: 'x',
            group: 'position',
            path: 'x',
            label: 'X',
            valueKind: 'number',
            nodeTypes: FRAME_AND_SHAPES,
            unit: 'px'
        },
        {
            id: 'y',
            group: 'position',
            path: 'y',
            label: 'Y',
            valueKind: 'number',
            nodeTypes: FRAME_AND_SHAPES,
            unit: 'px'
        },
        {
            id: 'rotation',
            group: 'position',
            path: 'rotation',
            label: 'R',
            valueKind: 'number',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true,
            unit: 'deg'
        },
        {
            id: 'width',
            group: 'layout',
            path: 'width',
            label: 'W',
            valueKind: 'dimension',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true,
            unit: 'px'
        },
        {
            id: 'height',
            group: 'layout',
            path: 'height',
            label: 'H',
            valueKind: 'dimension',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true,
            unit: 'px'
        },
        {
            id: 'layout',
            group: 'layout',
            path: 'layout',
            label: 'Layout',
            valueKind: 'enum',
            nodeTypes: ['frame'],
            optional: true,
            enumValues: ['none', 'horizontal', 'vertical']
        },
        {
            id: 'gap',
            group: 'layout',
            path: 'gap',
            label: 'Gap',
            valueKind: 'number',
            nodeTypes: ['frame'],
            optional: true,
            unit: 'px'
        },
        {
            id: 'padding',
            group: 'layout',
            path: 'padding',
            label: 'Padding',
            valueKind: 'spacing',
            nodeTypes: ['frame'],
            optional: true
        },
        {
            id: 'justifyContent',
            group: 'layout',
            path: 'justifyContent',
            label: 'Justify Content',
            valueKind: 'enum',
            nodeTypes: ['frame'],
            optional: true,
            enumValues: [
                'start',
                'center',
                'end',
                'space_between',
                'space_around'
            ]
        },
        {
            id: 'alignItems',
            group: 'layout',
            path: 'alignItems',
            label: 'Align Items',
            valueKind: 'enum',
            nodeTypes: ['frame'],
            optional: true,
            enumValues: ['start', 'center', 'end', 'stretch']
        },
        {
            id: 'clip',
            group: 'layout',
            path: 'clip',
            label: 'Clip Content',
            valueKind: 'boolean',
            nodeTypes: ['frame'],
            optional: true
        },
        {
            id: 'opacity',
            group: 'appearance',
            path: 'opacity',
            label: 'Opacity',
            valueKind: 'number',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true,
            unit: '%'
        },
        {
            id: 'cornerRadius',
            group: 'appearance',
            path: 'cornerRadius',
            label: 'Corner radius',
            valueKind: 'dimension',
            nodeTypes: SHAPE_NODE_TYPES,
            optional: true,
            unit: 'px'
        },
        {
            id: 'fill',
            group: 'fill',
            path: 'fill',
            label: 'Fill',
            valueKind: 'fill',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true
        },
        {
            id: 'stroke',
            group: 'stroke',
            path: 'stroke',
            label: 'Stroke',
            valueKind: 'stroke',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true
        },
        {
            id: 'strokeWidth',
            group: 'stroke',
            path: 'strokeWidth',
            label: 'Stroke Width',
            valueKind: 'number',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true,
            unit: 'px'
        },
        {
            id: 'strokeAlignment',
            group: 'stroke',
            path: 'strokeAlignment',
            label: 'Stroke Alignment',
            valueKind: 'enum',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true,
            enumValues: ['center', 'inner', 'outer']
        },
        {
            id: 'effect',
            group: 'effects',
            path: 'effect',
            label: 'Effects',
            valueKind: 'effect',
            nodeTypes: FRAME_AND_SHAPES,
            optional: true
        },
        {
            id: 'content',
            group: 'text',
            path: 'content',
            label: 'Content',
            valueKind: 'string',
            nodeTypes: TEXT_NODE_TYPES
        },
        {
            id: 'textAlign',
            group: 'text',
            path: 'textAlign',
            label: 'Text Align',
            valueKind: 'enum',
            nodeTypes: TEXT_NODE_TYPES,
            optional: true,
            enumValues: ['left', 'center', 'right', 'justify']
        },
        {
            id: 'fontFamily',
            group: 'text',
            path: 'fontFamily',
            label: 'Font Family',
            valueKind: 'string',
            nodeTypes: TEXT_NODE_TYPES,
            optional: true
        },
        {
            id: 'fontSize',
            group: 'text',
            path: 'fontSize',
            label: 'Font Size',
            valueKind: 'number',
            nodeTypes: TEXT_NODE_TYPES,
            optional: true,
            unit: 'px'
        },
        {
            id: 'fontWeight',
            group: 'text',
            path: 'fontWeight',
            label: 'Font Weight',
            valueKind: 'string',
            nodeTypes: TEXT_NODE_TYPES,
            optional: true
        },
        {
            id: 'lineHeight',
            group: 'text',
            path: 'lineHeight',
            label: 'Line Height',
            valueKind: 'number',
            nodeTypes: TEXT_NODE_TYPES,
            optional: true
        }
    ];

export const getNodeInspectorProperties = (
    nodeType: MiaomaDesignNode['type']
): MiaomaInspectorPropertyDefinition[] =>
    INSPECTOR_PROPERTY_REGISTRY.filter((property) =>
        includesNodeType(property.nodeTypes, nodeType)
    );

export const getNodeInspectorGroups = (
    nodeType: MiaomaDesignNode['type']
): MiaomaInspectorGroupDefinition[] => {
    const groups = new Set(
        getNodeInspectorProperties(nodeType).map((property) => property.group)
    );

    return INSPECTOR_GROUPS.filter((group) => groups.has(group.id)).sort(
        (left, right) => left.order - right.order
    );
};
