/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaCornerRadius,
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaFill,
    MiaomaFrameNode,
    MiaomaShadowEffect,
    MiaomaStroke,
    MiaomaStrokeAlign
} from '@miaoma-design-ai/miaoma-design-schema';

import {
    type FigmaDecodedMessage,
    type FigmaGuid,
    type FigmaNodeChange,
    type FigmaTransform,
    isRecord,
    readFigmaArchive,
    readFiniteNumber,
    type UnknownRecord
} from './figmaArchive';

type NodeBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
};

type MiaomaNodeBase = Pick<
    MiaomaFrameNode,
    | 'id'
    | 'name'
    | 'opacity'
    | 'x'
    | 'y'
    | 'rotation'
    | 'fill'
    | 'stroke'
    | 'strokeWidth'
    | 'strokeAlignment'
    | 'effect'
    | 'cornerRadius'
>;

const FIGMA_DOCUMENT_VERSION = '2.14';

const guidKey = (guid: FigmaGuid | undefined): string | undefined => {
    const sessionID = readFiniteNumber(guid?.sessionID);
    const localID = readFiniteNumber(guid?.localID);

    return sessionID === undefined || localID === undefined
        ? undefined
        : `${sessionID}:${localID}`;
};

const guidToNodeId = (guid: FigmaGuid | undefined) => {
    const key = guidKey(guid);

    return key ? `figma-${key.replace(':', '-')}` : undefined;
};

const normalizeNearZero = (value: number) =>
    Math.abs(value) < 0.000001 ? 0 : value;

const readNodeBounds = (node: FigmaNodeChange): NodeBounds | undefined => {
    const rawWidth = readFiniteNumber(node.size?.x);
    const rawHeight = readFiniteNumber(node.size?.y);

    if (rawWidth === undefined || rawHeight === undefined) {
        return undefined;
    }

    const transform = node.transform;
    const m00 = readFiniteNumber(transform?.m00) ?? 1;
    const m01 = readFiniteNumber(transform?.m01) ?? 0;
    const m02 = readFiniteNumber(transform?.m02) ?? 0;
    const m10 = readFiniteNumber(transform?.m10) ?? 0;
    const m11 = readFiniteNumber(transform?.m11) ?? 1;
    const m12 = readFiniteNumber(transform?.m12) ?? 0;
    const scaleX = Math.hypot(m00, m10) || 1;
    const scaleY = Math.hypot(m01, m11) || 1;
    const width = Math.abs(rawWidth * scaleX);
    const height = Math.abs(rawHeight * scaleY);
    const matrixRotation = (Math.atan2(m10, m00) * 180) / Math.PI;
    const rotation = normalizeNearZero(-matrixRotation);
    const radians = (rotation * Math.PI) / 180;
    const boundingWidth =
        Math.abs(width * Math.cos(radians)) +
        Math.abs(height * Math.sin(radians));
    const boundingHeight =
        Math.abs(width * Math.sin(radians)) +
        Math.abs(height * Math.cos(radians));
    const centerX = m02 + (m00 * rawWidth + m01 * rawHeight) / 2;
    const centerY = m12 + (m10 * rawWidth + m11 * rawHeight) / 2;

    return {
        x: normalizeNearZero(centerX - boundingWidth / 2),
        y: normalizeNearZero(centerY - boundingHeight / 2),
        width,
        height,
        rotation: rotation === 0 ? undefined : rotation
    };
};

const clampColorChannel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value * 255)));

const toHexChannel = (value: number) =>
    clampColorChannel(value).toString(16).padStart(2, '0');

const readColor = (value: unknown, opacity = 1): string | undefined => {
    if (!isRecord(value)) {
        return undefined;
    }

    const red = readFiniteNumber(value.r);
    const green = readFiniteNumber(value.g);
    const blue = readFiniteNumber(value.b);

    if (red === undefined || green === undefined || blue === undefined) {
        return undefined;
    }

    const alpha = (readFiniteNumber(value.a) ?? 1) * opacity;

    return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}${toHexChannel(alpha)}`;
};

const detectImageMimeType = (data: Uint8Array): string | undefined => {
    if (
        data[0] === 0x89 &&
        data[1] === 0x50 &&
        data[2] === 0x4e &&
        data[3] === 0x47
    ) {
        return 'image/png';
    }

    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
        return 'image/jpeg';
    }

    if (
        data[0] === 0x47 &&
        data[1] === 0x49 &&
        data[2] === 0x46 &&
        data[3] === 0x38
    ) {
        return 'image/gif';
    }

    if (
        Buffer.from(data.subarray(0, 4)).toString('ascii') === 'RIFF' &&
        Buffer.from(data.subarray(8, 12)).toString('ascii') === 'WEBP'
    ) {
        return 'image/webp';
    }

    return undefined;
};

const readImageHash = (paint: UnknownRecord): string | undefined => {
    if (!isRecord(paint.image) || !(paint.image.hash instanceof Uint8Array)) {
        return undefined;
    }

    return Buffer.from(paint.image.hash).toString('hex');
};

const toImageMode = (value: unknown): 'fill' | 'fit' | 'stretch' => {
    if (value === 'FIT') {
        return 'fit';
    }

    if (value === 'STRETCH') {
        return 'stretch';
    }

    return 'fill';
};

const readGradient = (
    paint: UnknownRecord,
    opacity: number
): MiaomaFill | undefined => {
    if (!Array.isArray(paint.stops)) {
        return undefined;
    }

    const colors = paint.stops.flatMap((stop) => {
        if (!isRecord(stop)) {
            return [];
        }

        const color = readColor(stop.color, opacity);
        const position = readFiniteNumber(stop.position);

        return color && position !== undefined ? [{ color, position }] : [];
    });

    if (colors.length === 0) {
        return undefined;
    }

    const transform = isRecord(paint.transform)
        ? (paint.transform as FigmaTransform)
        : undefined;
    const matrixRotation =
        (Math.atan2(
            readFiniteNumber(transform?.m10) ?? 0,
            readFiniteNumber(transform?.m00) ?? 1
        ) *
            180) /
        Math.PI;

    if (paint.type === 'GRADIENT_LINEAR') {
        return {
            type: 'gradient',
            gradientType: 'linear',
            rotation: normalizeNearZero(-matrixRotation),
            colors
        };
    }

    if (paint.type === 'GRADIENT_RADIAL') {
        return {
            type: 'gradient',
            gradientType: 'radial',
            center: {
                x: readFiniteNumber(transform?.m02) ?? 0.5,
                y: readFiniteNumber(transform?.m12) ?? 0.5
            },
            colors
        };
    }

    return undefined;
};

const readPaint = (
    paint: UnknownRecord,
    images: Map<string, Uint8Array>
): MiaomaFill | undefined => {
    if (paint.visible === false) {
        return undefined;
    }

    const opacity = readFiniteNumber(paint.opacity) ?? 1;

    if (paint.type === 'SOLID') {
        const color = readColor(paint.color, opacity);

        return color ? { type: 'color', color } : undefined;
    }

    if (paint.type === 'GRADIENT_LINEAR' || paint.type === 'GRADIENT_RADIAL') {
        return readGradient(paint, opacity);
    }

    if (paint.type === 'IMAGE') {
        const hash = readImageHash(paint);
        const data = hash ? images.get(hash) : undefined;
        const mimeType = data ? detectImageMimeType(data) : undefined;

        if (!data || !mimeType) {
            return undefined;
        }

        return {
            type: 'image',
            url: `data:${mimeType};base64,${Buffer.from(data).toString('base64')}`,
            mode: toImageMode(paint.imageScaleMode)
        };
    }

    return undefined;
};

const readPaints = (
    value: unknown,
    images: Map<string, Uint8Array>
): MiaomaFill[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const paints = value.flatMap((paint) => {
        const fill = isRecord(paint) ? readPaint(paint, images) : undefined;

        return fill ? [fill] : [];
    });

    return paints.length > 0 ? paints : undefined;
};

const readStrokeAlignment = (value: unknown): MiaomaStrokeAlign | undefined => {
    if (value === 'INSIDE') {
        return 'inner';
    }

    if (value === 'OUTSIDE') {
        return 'outer';
    }

    return value === 'CENTER' ? 'center' : undefined;
};

const readStrokes = (
    node: FigmaNodeChange,
    images: Map<string, Uint8Array>
): MiaomaStroke[] | undefined => {
    const fills = readPaints(node.strokePaints, images);

    if (!fills) {
        return undefined;
    }

    const width = readFiniteNumber(node.strokeWeight);
    const align = readStrokeAlignment(node.strokeAlign);

    return fills.flatMap((fill) =>
        typeof fill === 'string' ? [] : [{ ...fill, width, align }]
    );
};

const readEffects = (value: unknown): MiaomaShadowEffect[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const effects = value.flatMap((effect) => {
        if (
            !isRecord(effect) ||
            effect.visible === false ||
            (effect.type !== 'DROP_SHADOW' && effect.type !== 'INNER_SHADOW')
        ) {
            return [];
        }

        const color = readColor(effect.color);

        if (!color) {
            return [];
        }

        const offset = isRecord(effect.offset)
            ? {
                  x: readFiniteNumber(effect.offset.x) ?? 0,
                  y: readFiniteNumber(effect.offset.y) ?? 0
              }
            : undefined;
        const shadow: MiaomaShadowEffect = {
            type: 'shadow',
            shadowType: effect.type === 'INNER_SHADOW' ? 'inner' : 'outer',
            color,
            offset,
            blur: readFiniteNumber(effect.radius)
        };

        return [shadow];
    });

    return effects.length > 0 ? effects : undefined;
};

const readCornerRadius = (
    node: FigmaNodeChange
): MiaomaCornerRadius | undefined => {
    const radius = readFiniteNumber(node.cornerRadius);

    if (radius !== undefined) {
        return radius;
    }

    const corners = [
        readFiniteNumber(node.rectangleTopLeftCornerRadius),
        readFiniteNumber(node.rectangleTopRightCornerRadius),
        readFiniteNumber(node.rectangleBottomRightCornerRadius),
        readFiniteNumber(node.rectangleBottomLeftCornerRadius)
    ];

    if (corners.some((corner) => corner === undefined)) {
        return undefined;
    }

    return corners as MiaomaCornerRadius;
};

const readTextGrowth = (
    value: unknown
): 'auto' | 'fixed-width' | 'fixed-width-height' | undefined => {
    if (value === 'WIDTH_AND_HEIGHT') {
        return 'auto';
    }

    if (value === 'HEIGHT') {
        return 'fixed-width';
    }

    if (value === 'NONE' || value === 'TRUNCATE') {
        return 'fixed-width-height';
    }

    return undefined;
};

const readTextAlign = (
    value: unknown
): 'left' | 'center' | 'right' | 'justify' | undefined => {
    if (value === 'CENTER') {
        return 'center';
    }

    if (value === 'RIGHT') {
        return 'right';
    }

    if (value === 'JUSTIFIED') {
        return 'justify';
    }

    return value === 'LEFT' ? 'left' : undefined;
};

const readLineHeight = (node: FigmaNodeChange): number | undefined => {
    const value = readFiniteNumber(node.lineHeight?.value);

    if (value === undefined) {
        return undefined;
    }

    if (node.lineHeight?.units === 'PERCENT') {
        return value / 100;
    }

    if (node.lineHeight?.units === 'PIXELS' && node.fontSize) {
        return value / node.fontSize;
    }

    return undefined;
};

const compareFigmaPosition = (
    left: FigmaNodeChange,
    right: FigmaNodeChange
) => {
    const leftPosition = left.parentIndex?.position ?? '';
    const rightPosition = right.parentIndex?.position ?? '';

    if (leftPosition === rightPosition) {
        return 0;
    }

    return leftPosition < rightPosition ? -1 : 1;
};

const buildDocument = (
    message: FigmaDecodedMessage,
    images: Map<string, Uint8Array>
): MiaomaDesignDocument => {
    const nodes = message.nodeChanges.filter(
        (node) => node.phase !== 'REMOVED' && guidKey(node.guid)
    );
    const childrenByParent = new Map<string, FigmaNodeChange[]>();

    for (const node of nodes) {
        const parentKey = guidKey(node.parentIndex?.guid);

        if (!parentKey) {
            continue;
        }

        const children = childrenByParent.get(parentKey) ?? [];
        children.push(node);
        childrenByParent.set(parentKey, children);
    }

    for (const children of childrenByParent.values()) {
        children.sort(compareFigmaPosition);
    }

    const readBaseNode = (
        node: FigmaNodeChange,
        bounds: NodeBounds
    ): MiaomaNodeBase | undefined => {
        const id = guidToNodeId(node.guid);

        if (!id) {
            return undefined;
        }

        const stroke = readStrokes(node, images);
        const firstStroke = stroke?.[0];

        return {
            id,
            name: typeof node.name === 'string' ? node.name : undefined,
            opacity: readFiniteNumber(node.opacity),
            x: bounds.x,
            y: bounds.y,
            rotation: bounds.rotation,
            fill: readPaints(node.fillPaints, images),
            stroke,
            strokeWidth:
                typeof firstStroke === 'string'
                    ? undefined
                    : firstStroke?.width,
            strokeAlignment:
                typeof firstStroke === 'string'
                    ? undefined
                    : firstStroke?.align,
            effect: readEffects(node.effects),
            cornerRadius: readCornerRadius(node)
        };
    };

    const mapNode = (node: FigmaNodeChange): MiaomaDesignNode | undefined => {
        if (node.visible === false) {
            return undefined;
        }

        const bounds = readNodeBounds(node);

        if (!bounds) {
            return undefined;
        }

        const base = readBaseNode(node, bounds);

        if (!base) {
            return undefined;
        }

        if (node.type === 'FRAME' || node.type === 'SYMBOL') {
            const key = guidKey(node.guid);
            const children = key
                ? (childrenByParent.get(key) ?? []).flatMap((child) => {
                      const mapped = mapNode(child);

                      return mapped ? [mapped] : [];
                  })
                : [];

            return {
                ...base,
                type: 'frame',
                width: bounds.width,
                height: bounds.height,
                clip:
                    typeof node.frameMaskDisabled === 'boolean'
                        ? !node.frameMaskDisabled
                        : undefined,
                layout: 'none',
                children
            };
        }

        if (node.type === 'RECTANGLE' || node.type === 'ROUNDED_RECTANGLE') {
            return {
                ...base,
                type: 'rectangle',
                width: bounds.width,
                height: bounds.height
            };
        }

        if (node.type === 'ELLIPSE') {
            return {
                ...base,
                type: 'ellipse',
                width: bounds.width,
                height: bounds.height
            };
        }

        if (node.type === 'TEXT') {
            const content = node.textData?.characters;

            if (!content) {
                return undefined;
            }

            const fontWeight =
                node.derivedTextData?.fontMetaData?.[0]?.fontWeight;

            return {
                ...base,
                type: 'text',
                content,
                width: bounds.width,
                height: bounds.height,
                textGrowth: readTextGrowth(node.textAutoResize),
                textAlign: readTextAlign(node.textAlignHorizontal),
                fontFamily: node.fontName?.family,
                fontSize: readFiniteNumber(node.fontSize),
                fontWeight:
                    typeof fontWeight === 'number'
                        ? String(fontWeight)
                        : node.fontName?.style,
                lineHeight: readLineHeight(node)
            };
        }

        return undefined;
    };

    const canvases = nodes.filter(
        (node) =>
            node.type === 'CANVAS' &&
            node.visible !== false &&
            node.name !== 'Internal Only Canvas'
    );
    const children = canvases.flatMap((canvas) => {
        const key = guidKey(canvas.guid);

        return key
            ? (childrenByParent.get(key) ?? []).flatMap((node) => {
                  const mapped = mapNode(node);

                  return mapped ? [mapped] : [];
              })
            : [];
    });

    return {
        version: FIGMA_DOCUMENT_VERSION,
        children
    };
};

export const readFigmaDesignDocument = async (
    filePath: string
): Promise<MiaomaDesignDocument> => {
    const { images, message } = await readFigmaArchive(filePath);

    return buildDocument(message, images);
};
