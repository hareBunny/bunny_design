/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import type {
    MiaomaAlignItems as AlignItems,
    MiaomaDesignNode as DesignNode,
    MiaomaDimension as Dimension,
    MiaomaFill as Fill,
    MiaomaFrameNode as FrameNode,
    MiaomaJustifyContent as JustifyContent,
    MiaomaLayoutDirection as LayoutDirection,
    MiaomaSpacing as Spacing
} from '@miaoma-design-ai/miaoma-design-schema';

import type {
    AssetResolver,
    Bounds,
    ParentLayout
} from './CanvasNodeRendererTypes';

export const px = (value: number) => `${value}px`;

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const toCssGradientAngle = (rotation = 0) => `${normalizeAngle(-rotation)}deg`;

const toCssNodeRotation = (rotation: number) => `rotate(${-rotation}deg)`;

const toCssOpacityValue = (opacity: number | undefined) => {
    if (opacity === undefined) {
        return undefined;
    }

    const normalizedValue = opacity > 1 ? opacity / 100 : opacity;

    return Math.max(0, Math.min(1, normalizedValue));
};

const toBackgroundSize = (mode: 'fill' | 'fit' | 'stretch') => {
    if (mode === 'fit') {
        return 'contain';
    }

    if (mode === 'stretch') {
        return '100% 100%';
    }

    return 'cover';
};

const escapeAssetUrl = (url: string) => url.replaceAll('"', '\\"');

const quoteFontFamily = (fontFamily: string) =>
    `'${fontFamily.replaceAll("'", "\\'")}'`;

export const toFontFamily = (fontFamily?: string) => {
    if (!fontFamily) {
        return undefined;
    }

    if (fontFamily === 'Alimama ShuHeiTi' || fontFamily === 'Heiti SC') {
        return `${quoteFontFamily(fontFamily)}, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`;
    }

    return `${quoteFontFamily(fontFamily)}, system-ui, sans-serif`;
};

const toGradientValue = (fill: Extract<Fill, { type: 'gradient' }>) =>
    `linear-gradient(${toCssGradientAngle(fill.rotation)}, ${fill.colors
        .map((stop) => `${stop.color} ${stop.position * 100}%`)
        .join(', ')})`;

export const getColorFillValue = (fill: Fill | undefined) =>
    fill?.type === 'color' ? fill.color : undefined;

const getFillStyle = (
    fill: Fill | undefined,
    resolveAsset: AssetResolver,
    target: 'shape' | 'text'
): CSSProperties => {
    if (!fill) {
        return {};
    }

    if (fill.type === 'color') {
        return target === 'text'
            ? { color: fill.color }
            : { backgroundColor: fill.color };
    }

    if (fill.type === 'gradient') {
        const gradientStyle: CSSProperties = {
            backgroundImage: toGradientValue(fill),
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%'
        };

        if (target === 'text') {
            return {
                ...gradientStyle,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
            };
        }

        return gradientStyle;
    }

    return {
        backgroundImage: `url("${escapeAssetUrl(resolveAsset(fill.url))}")`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: toBackgroundSize(fill.mode)
    };
};

const getStrokeStyle = (
    stroke: Fill | undefined,
    strokeWidth: number | undefined
): CSSProperties => {
    if (!stroke || strokeWidth === undefined) {
        return {};
    }

    if (stroke.type === 'color') {
        return {
            borderColor: stroke.color,
            borderStyle: 'solid',
            borderWidth: px(strokeWidth)
        };
    }

    if (stroke.type === 'gradient') {
        return {
            borderImage: `${toGradientValue(stroke)} 1`,
            borderStyle: 'solid',
            borderWidth: px(strokeWidth)
        };
    }

    return {};
};

const toCornerRadiusValue = (
    cornerRadius: FrameNode['cornerRadius']
): string | undefined => {
    if (cornerRadius === undefined) {
        return undefined;
    }

    if (typeof cornerRadius === 'number') {
        return px(cornerRadius);
    }

    return cornerRadius.map(px).join(' ');
};

export const toPaddingValue = (
    padding: Spacing | undefined
): string | undefined => {
    if (padding === undefined) {
        return undefined;
    }

    if (typeof padding === 'number') {
        return px(padding);
    }

    return padding.map(px).join(' ');
};

export const toJustifyContent = (
    justifyContent: JustifyContent | undefined
): CSSProperties['justifyContent'] => {
    if (justifyContent === 'end') {
        return 'flex-end';
    }

    if (justifyContent === 'space_between') {
        return 'space-between';
    }

    if (justifyContent === 'space_around') {
        return 'space-around';
    }

    if (justifyContent === 'start') {
        return 'flex-start';
    }

    return justifyContent;
};

export const toAlignItems = (
    alignItems: AlignItems | undefined
): CSSProperties['alignItems'] => {
    if (alignItems === 'end') {
        return 'flex-end';
    }

    if (alignItems === 'start') {
        return 'flex-start';
    }

    return alignItems;
};

const getEffectStyle = (node: DesignNode): CSSProperties => {
    if (node.effect?.type !== 'shadow') {
        return {};
    }

    const offsetX = node.effect.offset?.x ?? 0;
    const offsetY = node.effect.offset?.y ?? 0;
    const blur = node.effect.blur ?? 0;
    const inset = node.effect.shadowType === 'inner' ? 'inset ' : '';

    return {
        boxShadow: `${inset}${px(offsetX)} ${px(offsetY)} ${px(blur)} ${node.effect.color}`
    };
};

export const getVisualStyle = (
    node: DesignNode,
    resolveAsset: AssetResolver,
    target: 'shape' | 'text'
): CSSProperties => ({
    ...getFillStyle(node.fill, resolveAsset, target),
    ...getStrokeStyle(node.stroke, node.strokeWidth),
    ...getEffectStyle(node),
    borderRadius: toCornerRadiusValue(node.cornerRadius)
});

const getNumericDimension = (value: Dimension | undefined) =>
    typeof value === 'number' ? value : 0;

const getNodeWidth = (node: DesignNode) =>
    'width' in node ? getNumericDimension(node.width) : 0;

const getNodeHeight = (node: DesignNode) =>
    'height' in node ? getNumericDimension(node.height) : 0;

export const getTopLevelBounds = (nodes: DesignNode[]): Bounds => {
    if (nodes.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...nodes.map((node) => node.x ?? 0));
    const minY = Math.min(...nodes.map((node) => node.y ?? 0));
    const maxX = Math.max(
        ...nodes.map((node) => (node.x ?? 0) + getNodeWidth(node))
    );
    const maxY = Math.max(
        ...nodes.map((node) => (node.y ?? 0) + getNodeHeight(node))
    );

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

const applyDimensionStyle = ({
    dimension,
    axis,
    parentLayout,
    style
}: {
    dimension: Dimension | undefined;
    axis: 'height' | 'width';
    parentLayout: ParentLayout;
    style: CSSProperties;
}) => {
    if (dimension === undefined || dimension === 'hug_contents') {
        return;
    }

    if (typeof dimension === 'number') {
        style[axis] = px(dimension);
        return;
    }

    if (axis === 'width') {
        if (parentLayout === 'horizontal') {
            style.flex = '1 1 0';
            style.minWidth = 0;
            return;
        }

        style.width = '100%';
        return;
    }

    if (parentLayout === 'vertical') {
        style.flex = '1 1 0';
        style.minHeight = 0;
        return;
    }

    style.height = '100%';
};

const getNodePlacementStyle = (
    node: DesignNode,
    bounds: Bounds | undefined,
    parentLayout: ParentLayout
): CSSProperties => {
    if (parentLayout !== 'absolute') {
        return { position: 'relative' };
    }

    const x = node.x ?? 0;
    const y = node.y ?? 0;

    return {
        position: 'absolute',
        left: px(bounds ? x - bounds.x : x),
        top: px(bounds ? y - bounds.y : y)
    };
};

export const getNodeBoxStyle = ({
    height,
    node,
    parentLayout,
    topLevelBounds,
    width
}: {
    node: DesignNode;
    width?: Dimension;
    height?: Dimension;
    parentLayout: ParentLayout;
    topLevelBounds?: Bounds;
}): CSSProperties => {
    const style: CSSProperties = {
        ...getNodePlacementStyle(node, topLevelBounds, parentLayout),
        boxSizing: 'border-box',
        opacity: toCssOpacityValue(node.opacity),
        transform:
            node.rotation === undefined
                ? undefined
                : toCssNodeRotation(node.rotation),
        transformOrigin: node.rotation === undefined ? undefined : 'top left'
    };

    applyDimensionStyle({
        dimension: width,
        axis: 'width',
        parentLayout,
        style
    });
    applyDimensionStyle({
        dimension: height,
        axis: 'height',
        parentLayout,
        style
    });

    return style;
};

export const getFlowLayout = (
    layout: LayoutDirection | undefined
): Exclude<LayoutDirection, 'none'> | undefined =>
    layout === 'horizontal' || layout === 'vertical' ? layout : undefined;
