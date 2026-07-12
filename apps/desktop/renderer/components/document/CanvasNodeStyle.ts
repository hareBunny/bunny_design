/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import type {
    MiaomaAlignItems as AlignItems,
    MiaomaDesignNode as DesignNode,
    MiaomaDesignVariables as DesignVariables,
    MiaomaDimension as Dimension,
    MiaomaFill as Fill,
    MiaomaFrameNode as FrameNode,
    MiaomaJustifyContent as JustifyContent,
    MiaomaLayoutDirection as LayoutDirection,
    MiaomaShadowEffect as ShadowEffect,
    MiaomaSpacing as Spacing,
    MiaomaStroke as Stroke
} from '@miaoma-design-ai/miaoma-design-schema';
import { isMiaomaVariableReference } from '@miaoma-design-ai/miaoma-design-schema';

import {
    getRenderOriginFromAabb,
    getRotatedBoundingBoxSize
} from '../../utils/rotationAabb';

import type {
    AssetResolver,
    Bounds,
    ParentLayout
} from './CanvasNodeRendererTypes';

export const px = (value: number) => `${value}px`;

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const toCssGradientAngle = (rotation = 0) => `${normalizeAngle(-rotation)}deg`;

const toCssNodeRotation = (rotation: number) => `rotate(${-rotation}deg)`;

const toStyleArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};

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

const resolveVariableValue = (
    value: string | undefined,
    variables: DesignVariables | undefined,
    expectedType: 'color' | 'string'
) => {
    if (!value || !isMiaomaVariableReference(value)) {
        return value;
    }

    const variable = variables?.[value.slice(1)];

    return variable?.type === expectedType ? variable.value : undefined;
};

const resolveNumberVariable = (
    value: string,
    variables: DesignVariables | undefined
) => {
    const variable = variables?.[value.slice(1)];

    return variable?.type === 'number' ? variable.value : undefined;
};

export const toFontFamily = (
    fontFamily?: string,
    variables?: DesignVariables
) => {
    const resolvedFontFamily = resolveVariableValue(
        fontFamily,
        variables,
        'string'
    );

    if (!resolvedFontFamily) {
        return undefined;
    }

    if (
        resolvedFontFamily === 'Alimama ShuHeiTi' ||
        resolvedFontFamily === 'Heiti SC'
    ) {
        return `${quoteFontFamily(resolvedFontFamily)}, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`;
    }

    return `${quoteFontFamily(resolvedFontFamily)}, system-ui, sans-serif`;
};

type GradientFill = Extract<Fill, { type: 'gradient' }>;

const toGradientStops = (
    fill: GradientFill,
    variables: DesignVariables | undefined
) =>
    fill.colors
        .map(
            (stop) =>
                `${resolveVariableValue(stop.color, variables, 'color') ?? 'transparent'} ${stop.position * 100}%`
        )
        .join(', ');

const toGradientCenter = (fill: Extract<Fill, { type: 'gradient' }>) => {
    const x = fill.center?.x ?? 0.5;
    const y = fill.center?.y ?? 0.5;

    return `${x * 100}% ${y * 100}%`;
};

const toGradientValue = (
    fill: GradientFill,
    variables: DesignVariables | undefined
) =>
    fill.gradientType === 'radial'
        ? `radial-gradient(circle at ${toGradientCenter(fill)}, ${toGradientStops(fill, variables)})`
        : `linear-gradient(${toCssGradientAngle(fill.rotation)}, ${toGradientStops(fill, variables)})`;

export const getColorFillValue = (
    fill: Fill | Fill[] | undefined,
    variables?: DesignVariables
) => {
    for (const item of toStyleArray(fill)) {
        if (typeof item === 'string') {
            const color = resolveVariableValue(item, variables, 'color');

            if (color) {
                return color;
            }

            continue;
        }

        if (item.type === 'color') {
            const color = resolveVariableValue(item.color, variables, 'color');

            if (color) {
                return color;
            }
        }
    }

    return undefined;
};

const getFillStyle = (
    fill: Fill | Fill[] | undefined,
    resolveAsset: AssetResolver,
    target: 'shape' | 'text',
    variables: DesignVariables | undefined
): CSSProperties => {
    const fills = toStyleArray(fill);

    if (fills.length === 0) {
        return {};
    }

    if (target === 'text') {
        const firstFill = fills[0];

        if (typeof firstFill === 'string') {
            const color = resolveVariableValue(firstFill, variables, 'color');

            return color ? { color } : {};
        }

        if (firstFill.type === 'color') {
            return {
                color: resolveVariableValue(firstFill.color, variables, 'color')
            };
        }

        if (firstFill.type === 'gradient') {
            return {
                backgroundImage: toGradientValue(firstFill, variables),
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
            };
        }

        return {
            backgroundImage: `url("${escapeAssetUrl(resolveAsset(firstFill.url))}")`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: toBackgroundSize(firstFill.mode)
        };
    }

    const backgroundImages: string[] = [];
    const backgroundSizes: string[] = [];
    const backgroundPositions: string[] = [];
    let backgroundColor: string | undefined;

    for (const item of fills) {
        if (typeof item === 'string') {
            backgroundColor = resolveVariableValue(item, variables, 'color');
            continue;
        }

        if (item.type === 'color') {
            backgroundColor = resolveVariableValue(
                item.color,
                variables,
                'color'
            );
            continue;
        }

        if (item.type === 'gradient') {
            backgroundImages.push(toGradientValue(item, variables));
            backgroundSizes.push('100% 100%');
            backgroundPositions.push('center');
            continue;
        }

        backgroundImages.push(
            `url("${escapeAssetUrl(resolveAsset(item.url))}")`
        );
        backgroundSizes.push(toBackgroundSize(item.mode));
        backgroundPositions.push('center');
    }

    if (backgroundImages.length === 0) {
        return backgroundColor ? { backgroundColor } : {};
    }

    return {
        backgroundColor,
        backgroundImage: backgroundImages.join(', '),
        backgroundPosition: backgroundPositions.join(', '),
        backgroundRepeat: backgroundImages.map(() => 'no-repeat').join(', '),
        backgroundSize: backgroundSizes.join(', ')
    };
};

const getStrokeStyle = (
    stroke: Stroke | Stroke[] | undefined,
    strokeWidth: number | undefined,
    variables: DesignVariables | undefined
): CSSProperties => {
    const firstStroke = toStyleArray(stroke)[0];
    const width =
        firstStroke && typeof firstStroke !== 'string'
            ? (firstStroke.width ?? strokeWidth)
            : strokeWidth;

    if (!firstStroke || width === undefined) {
        return {};
    }

    if (typeof firstStroke === 'string') {
        const color = resolveVariableValue(firstStroke, variables, 'color');

        return color
            ? {
                  borderColor: color,
                  borderStyle: 'solid',
                  borderWidth: px(width)
              }
            : {};
    }

    if (firstStroke.type === 'color') {
        return {
            borderColor: resolveVariableValue(
                firstStroke.color,
                variables,
                'color'
            ),
            borderStyle: 'solid',
            borderWidth: px(width)
        };
    }

    if (firstStroke.type === 'gradient') {
        return {
            borderImage: `${toGradientValue(firstStroke, variables)} 1`,
            borderStyle: 'solid',
            borderWidth: px(width)
        };
    }

    return {};
};

const toCornerRadiusValue = (
    cornerRadius: FrameNode['cornerRadius'],
    variables: DesignVariables | undefined
): string | undefined => {
    if (cornerRadius === undefined) {
        return undefined;
    }

    if (typeof cornerRadius === 'number') {
        return px(cornerRadius);
    }

    if (typeof cornerRadius === 'string') {
        const value = resolveNumberVariable(cornerRadius, variables);

        return value === undefined ? undefined : px(value);
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

const getEffectStyle = (
    node: DesignNode,
    variables: DesignVariables | undefined
): CSSProperties => {
    const shadows = toStyleArray(node.effect)
        .filter((effect): effect is ShadowEffect => effect.type === 'shadow')
        .map((effect) => {
            const offsetX = effect.offset?.x ?? 0;
            const offsetY = effect.offset?.y ?? 0;
            const blur = effect.blur ?? 0;
            const inset = effect.shadowType === 'inner' ? 'inset ' : '';

            const color =
                resolveVariableValue(effect.color, variables, 'color') ??
                'transparent';

            return `${inset}${px(offsetX)} ${px(offsetY)} ${px(blur)} ${color}`;
        });

    if (shadows.length === 0) {
        return {};
    }

    return {
        boxShadow: shadows.join(', ')
    };
};

export const getVisualStyle = (
    node: DesignNode,
    resolveAsset: AssetResolver,
    target: 'shape' | 'text',
    variables?: DesignVariables
): CSSProperties => ({
    ...getFillStyle(node.fill, resolveAsset, target, variables),
    ...getStrokeStyle(node.stroke, node.strokeWidth, variables),
    ...getEffectStyle(node, variables),
    borderRadius: toCornerRadiusValue(node.cornerRadius, variables)
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

    const boxes = nodes.map((node) => {
        const width = getNodeWidth(node);
        const height = getNodeHeight(node);
        const bbox = getRotatedBoundingBoxSize({
            width,
            height,
            rotation: node.rotation
        });

        return {
            minX: node.x ?? 0,
            minY: node.y ?? 0,
            maxX: (node.x ?? 0) + bbox.width,
            maxY: (node.y ?? 0) + bbox.height
        };
    });

    const minX = Math.min(...boxes.map((box) => box.minX));
    const minY = Math.min(...boxes.map((box) => box.minY));
    const maxX = Math.max(...boxes.map((box) => box.maxX));
    const maxY = Math.max(...boxes.map((box) => box.maxY));

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

    const width = getNodeWidth(node);
    const height = getNodeHeight(node);
    const origin = getRenderOriginFromAabb({
        x: node.x ?? 0,
        y: node.y ?? 0,
        width,
        height,
        rotation: node.rotation
    });

    return {
        position: 'absolute',
        left: px(bounds ? origin.x - bounds.x : origin.x),
        top: px(bounds ? origin.y - bounds.y : origin.y)
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
        transformOrigin:
            node.rotation === undefined ? undefined : 'center center'
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
