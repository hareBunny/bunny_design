/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaFill,
    MiaomaFrameNode,
    MiaomaShadowEffect,
    MiaomaStroke
} from '@miaoma-design-ai/miaoma-design-schema';

import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';
import type { EffectItem, FillItem, StrokeItem } from '../model/style';

const toFill = (fill: FillItem | undefined): MiaomaFill | undefined => {
    if (!fill || !fill.enabled) {
        return undefined;
    }

    if (fill.type === 'variable') {
        return fill.reference;
    }

    if (fill.type === 'color') {
        return { type: 'color', color: fill.color };
    }

    if (fill.type === 'gradient') {
        return {
            type: 'gradient',
            gradientType: fill.gradientType,
            rotation: fill.rotation,
            colors: fill.colors,
            center: fill.center,
            size: fill.size
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
): MiaomaStroke | undefined => {
    if (!stroke || !stroke.enabled) {
        return undefined;
    }

    if (stroke.type === 'variable') {
        return stroke.reference;
    }

    if (stroke.type === 'color') {
        return {
            type: 'color',
            color: stroke.color,
            width: stroke.width,
            align: stroke.align
        };
    }

    if (stroke.type === 'gradient') {
        return {
            type: 'gradient',
            gradientType: stroke.gradientType,
            rotation: stroke.rotation,
            colors: stroke.colors,
            center: stroke.center,
            size: stroke.size,
            width: stroke.width,
            align: stroke.align
        };
    }

    return {
        type: 'image',
        url: stroke.url,
        mode: stroke.mode,
        width: stroke.width,
        align: stroke.align
    };
};

const toEffect = (
    effect: EffectItem | undefined
): MiaomaShadowEffect | undefined => {
    if (!effect || !effect.enabled) {
        return undefined;
    }

    return {
        type: 'shadow',
        shadowType: effect.shadowType,
        color: effect.color,
        offset: {
            x: effect.offsetX,
            y: effect.offsetY
        },
        blur: effect.blur
    };
};

const toStyleArray = <TInput, TOutput>(
    items: TInput[],
    mapItem: (item: TInput) => TOutput | undefined
): TOutput[] | undefined => {
    const values = items.flatMap((item) => {
        const value = mapItem(item);

        return value ? [value] : [];
    });

    return values.length > 0 ? values : undefined;
};

const toRenderableNode = (node: EditorNode): MiaomaDesignNode => {
    const fill = toStyleArray(node.fills, toFill);
    const stroke = toStyleArray(node.strokes, toStrokeFill);
    const effect = toStyleArray(node.effects, toEffect);
    const firstStroke = node.strokes.find((item) => item.enabled);
    const firstStrokeWidth = firstStroke?.width;
    const firstStrokeAlignment = firstStroke?.align;

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
                strokeWidth: firstStrokeWidth,
                strokeAlignment: firstStrokeAlignment,
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
                strokeWidth: firstStrokeWidth,
                strokeAlignment: firstStrokeAlignment,
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
                strokeWidth: firstStrokeWidth,
                strokeAlignment: firstStrokeAlignment,
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
                strokeWidth: firstStrokeWidth,
                strokeAlignment: firstStrokeAlignment,
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
                strokeWidth: firstStrokeWidth,
                strokeAlignment: firstStrokeAlignment,
                effect
            };
    }
};

export const editorDocumentToRenderable = (
    document: EditorDocument
): MiaomaDesignDocument => ({
    version: document.version,
    fileToken: document.fileToken,
    variables: document.variables,
    children: document.children.map(toRenderableNode)
});
