/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaFill,
    MiaomaShadowEffect
} from '@miaoma-design-ai/miaoma-design-schema';

import type { EditorDocument } from '../model/document';
import type {
    EditorEllipseNode,
    EditorFrameNode,
    EditorIconNode,
    EditorNode,
    EditorRectangleNode,
    EditorTextNode
} from '../model/node';
import type { EffectItem, FillItem, StrokeItem } from '../model/style';
import { buildStyleId } from '../utils/ids';

const toFillItem = (
    nodeId: string,
    fill: MiaomaFill | undefined,
    index: number
): FillItem[] => {
    if (!fill) {
        return [];
    }

    const id = buildStyleId(nodeId, 'fill', index);

    if (fill.type === 'color') {
        return [{ id, enabled: true, type: 'color', color: fill.color }];
    }

    if (fill.type === 'gradient') {
        return [
            {
                id,
                enabled: true,
                type: 'gradient',
                gradientType: 'linear',
                rotation: fill.rotation,
                colors: fill.colors
            }
        ];
    }

    return [
        {
            id,
            enabled: true,
            type: 'image',
            url: fill.url,
            mode: fill.mode
        }
    ];
};

const toStrokeItem = (node: MiaomaDesignNode, index: number): StrokeItem[] => {
    if (!node.stroke || node.strokeWidth === undefined) {
        return [];
    }

    const id = buildStyleId(node.id, 'stroke', index);
    const shared = {
        id,
        enabled: true,
        width: node.strokeWidth,
        align: node.strokeAlignment
    } as const;

    if (node.stroke.type === 'color') {
        return [
            {
                ...shared,
                type: 'color',
                color: node.stroke.color
            }
        ];
    }

    if (node.stroke.type === 'gradient') {
        return [
            {
                ...shared,
                type: 'gradient',
                gradientType: 'linear',
                rotation: node.stroke.rotation,
                colors: node.stroke.colors
            }
        ];
    }

    return [
        {
            ...shared,
            type: 'image',
            url: node.stroke.url,
            mode: node.stroke.mode
        }
    ];
};

const toEffectItem = (
    nodeId: string,
    effect: MiaomaShadowEffect | undefined,
    index: number
): EffectItem[] => {
    if (!effect || effect.type !== 'shadow') {
        return [];
    }

    return [
        {
            id: buildStyleId(nodeId, 'effect', index),
            enabled: true,
            type: 'shadow',
            shadowType: effect.shadowType,
            color: effect.color,
            offsetX: effect.offset?.x ?? 0,
            offsetY: effect.offset?.y ?? 0,
            blur: effect.blur ?? 0
        }
    ];
};

const toEditorNodeBase = (node: MiaomaDesignNode) => ({
    id: node.id,
    name: node.name,
    opacity: node.opacity,
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    fills: toFillItem(node.id, node.fill, 0),
    strokes: toStrokeItem(node, 0),
    effects: toEffectItem(node.id, node.effect, 0)
});

const toEditorNode = (node: MiaomaDesignNode): EditorNode => {
    switch (node.type) {
        case 'frame': {
            const editorNode: EditorFrameNode = {
                ...toEditorNodeBase(node),
                type: 'frame',
                width: node.width,
                height: node.height,
                clip: node.clip,
                layout: node.layout,
                gap: node.gap,
                padding: node.padding,
                justifyContent: node.justifyContent,
                alignItems: node.alignItems,
                cornerRadius: node.cornerRadius,
                children: node.children?.map(toEditorNode) ?? []
            };

            return editorNode;
        }
        case 'rectangle': {
            const editorNode: EditorRectangleNode = {
                ...toEditorNodeBase(node),
                type: 'rectangle',
                width: node.width,
                height: node.height,
                cornerRadius: node.cornerRadius
            };

            return editorNode;
        }
        case 'ellipse': {
            const editorNode: EditorEllipseNode = {
                ...toEditorNodeBase(node),
                type: 'ellipse',
                width: node.width,
                height: node.height
            };

            return editorNode;
        }
        case 'icon': {
            const editorNode: EditorIconNode = {
                ...toEditorNodeBase(node),
                type: 'icon',
                width: node.width,
                height: node.height,
                icon: node.icon,
                library: node.library
            };

            return editorNode;
        }
        case 'text': {
            const editorNode: EditorTextNode = {
                ...toEditorNodeBase(node),
                type: 'text',
                content: node.content,
                width: node.width,
                height: node.height,
                textGrowth: node.textGrowth,
                textAlign: node.textAlign,
                fontFamily: node.fontFamily,
                fontSize: node.fontSize,
                fontWeight: node.fontWeight,
                lineHeight: node.lineHeight
            };

            return editorNode;
        }
        default:
            throw new Error('Unsupported design node type');
    }
};

export const schemaToEditorDocument = (
    document: MiaomaDesignDocument
): EditorDocument => ({
    version: document.version,
    fileToken: document.fileToken,
    children: document.children.map(toEditorNode)
});
