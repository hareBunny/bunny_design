/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaFill,
    MiaomaFrameNode
} from '@miaoma-design-ai/miaoma-design-schema';

import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';
import type { FillItem, StrokeItem } from '../model/style';

const toFill = (fill: FillItem | undefined): MiaomaFill | undefined => {
    if (!fill || !fill.enabled) {
        return undefined;
    }

    if (fill.type === 'color') {
        return { type: 'color', color: fill.color };
    }

    if (fill.type === 'gradient') {
        return {
            type: 'gradient',
            gradientType: 'linear',
            rotation: fill.rotation,
            colors: fill.colors
        };
    }

    return {
        type: 'image',
        url: fill.url,
        mode: fill.mode
    };
};

const toStrokeFill = (
    stroke: StrokeItem | undefined
): MiaomaFill | undefined => {
    if (!stroke || !stroke.enabled) {
        return undefined;
    }

    if (stroke.type === 'color') {
        return { type: 'color', color: stroke.color };
    }

    if (stroke.type === 'gradient') {
        return {
            type: 'gradient',
            gradientType: 'linear',
            rotation: stroke.rotation,
            colors: stroke.colors
        };
    }

    return {
        type: 'image',
        url: stroke.url,
        mode: stroke.mode
    };
};

const toRenderableNode = (node: EditorNode): MiaomaDesignNode => {
    const fill = toFill(node.fills[0]);
    const stroke = toStrokeFill(node.strokes[0]);
    const effect = node.effects[0]
        ? {
              type: 'shadow' as const,
              shadowType: node.effects[0].shadowType,
              color: node.effects[0].color,
              offset: {
                  x: node.effects[0].offsetX,
                  y: node.effects[0].offsetY
              },
              blur: node.effects[0].blur
          }
        : undefined;

    switch (node.type) {
        case 'frame': {
            const renderable: MiaomaFrameNode = {
                id: node.id,
                type: 'frame',
                name: node.name,
                opacity: node.opacity,
                x: node.x,
                y: node.y,
                rotation: node.rotation,
                width: node.width,
                height: node.height,
                clip: node.clip,
                layout: node.layout,
                gap: node.gap,
                padding: node.padding,
                justifyContent: node.justifyContent,
                alignItems: node.alignItems,
                cornerRadius: node.cornerRadius,
                fill,
                stroke,
                strokeWidth: node.strokes[0]?.width,
                strokeAlignment: node.strokes[0]?.align,
                effect,
                children: node.children.map(toRenderableNode)
            };

            return renderable;
        }
        case 'rectangle':
            return {
                id: node.id,
                type: 'rectangle',
                name: node.name,
                opacity: node.opacity,
                x: node.x,
                y: node.y,
                rotation: node.rotation,
                width: node.width ?? 0,
                height: node.height ?? 0,
                cornerRadius: node.cornerRadius,
                fill,
                stroke,
                strokeWidth: node.strokes[0]?.width,
                strokeAlignment: node.strokes[0]?.align,
                effect
            };
        case 'ellipse':
            return {
                id: node.id,
                type: 'ellipse',
                name: node.name,
                opacity: node.opacity,
                x: node.x,
                y: node.y,
                rotation: node.rotation,
                width: node.width ?? 0,
                height: node.height ?? 0,
                fill,
                stroke,
                strokeWidth: node.strokes[0]?.width,
                strokeAlignment: node.strokes[0]?.align,
                effect
            };
        case 'icon':
            return {
                id: node.id,
                type: 'icon',
                name: node.name,
                opacity: node.opacity,
                x: node.x,
                y: node.y,
                rotation: node.rotation,
                width: node.width ?? 0,
                height: node.height ?? 0,
                icon: node.icon ?? '',
                library: node.library,
                fill,
                stroke,
                strokeWidth: node.strokes[0]?.width,
                strokeAlignment: node.strokes[0]?.align,
                effect
            };
        case 'text':
            return {
                id: node.id,
                type: 'text',
                name: node.name,
                opacity: node.opacity,
                x: node.x,
                y: node.y,
                rotation: node.rotation,
                content: node.content ?? '',
                width: node.width,
                height: node.height,
                textGrowth: node.textGrowth,
                textAlign: node.textAlign,
                fontFamily: node.fontFamily,
                fontSize: node.fontSize,
                fontWeight: node.fontWeight,
                lineHeight: node.lineHeight,
                fill,
                stroke,
                strokeWidth: node.strokes[0]?.width,
                strokeAlignment: node.strokes[0]?.align,
                effect
            };
    }
};

export const editorDocumentToRenderable = (
    document: EditorDocument
): MiaomaDesignDocument => ({
    version: document.version,
    fileToken: document.fileToken,
    children: document.children.map(toRenderableNode)
});
