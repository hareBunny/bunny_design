/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import { getRenderOriginFromAabb } from '../../../utils/rotationAabb';

const SELECTION_COLOR = '#4592FF';
const SELECTION_BORDER_WIDTH = 3;
const SELECTION_HANDLE_BORDER_WIDTH = 2;
const SELECTION_HANDLE_SIZE = 10;
const SELECTION_LABEL_HEIGHT = 24;
const SELECTION_LABEL_OFFSET = 6;

type Point = {
    x: number;
    y: number;
};

export type ViewportSelectionBounds = {
    nodeId: string;
    left: number;
    top: number;
    width: number;
    height: number;
    labelWidth: number;
    labelHeight: number;
    labelLeft: number;
    labelTop: number;
    transform?: string;
    transformOrigin?: string;
};

const selectionHandlePositions: {
    position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    style: CSSProperties;
}[] = [
    {
        position: 'top-left',
        style: { top: 0, left: 0, transform: 'translate(-50%, -50%)' }
    },
    {
        position: 'top-right',
        style: { top: 0, right: 0, transform: 'translate(50%, -50%)' }
    },
    {
        position: 'bottom-right',
        style: { right: 0, bottom: 0, transform: 'translate(50%, 50%)' }
    },
    {
        position: 'bottom-left',
        style: { bottom: 0, left: 0, transform: 'translate(-50%, 50%)' }
    }
];

const px = (value: number) => `${value}px`;

const normalizeCssNumber = (value: number) => Math.round(value * 10000) / 10000;

const escapeDesignNodeSelectorValue = (value: string) =>
    value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const toFiniteNumber = (value: string) => {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : null;
};

const resolveTransformMatrix = (transform: string) => {
    if (!transform || transform === 'none') {
        return null;
    }

    const rotateMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);

    if (rotateMatch) {
        const angle = (Number.parseFloat(rotateMatch[1]) * Math.PI) / 180;

        return {
            a: Math.cos(angle),
            b: Math.sin(angle),
            c: -Math.sin(angle),
            d: Math.cos(angle)
        };
    }

    const matrixMatch = transform.match(/matrix\(([^)]+)\)/);

    if (!matrixMatch) {
        return null;
    }

    const values = matrixMatch[1]
        .split(',')
        .map((value) => Number.parseFloat(value.trim()));

    if (values.length < 4 || values.some((value) => !Number.isFinite(value))) {
        return null;
    }

    return {
        a: values[0],
        b: values[1],
        c: values[2],
        d: values[3]
    };
};

const extractRotationDegrees = (transform: string) => {
    const matrix = resolveTransformMatrix(transform);

    return matrix ? (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI : 0;
};

const resolveTransformOriginComponent = ({
    axis,
    size,
    value
}: {
    value: string | undefined;
    size: number;
    axis: 'x' | 'y';
}) => {
    if (!value) {
        return 0;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (axis === 'x') {
        if (normalizedValue === 'left') {
            return 0;
        }

        if (normalizedValue === 'center') {
            return size / 2;
        }

        if (normalizedValue === 'right') {
            return size;
        }
    }

    if (axis === 'y') {
        if (normalizedValue === 'top') {
            return 0;
        }

        if (normalizedValue === 'center') {
            return size / 2;
        }

        if (normalizedValue === 'bottom') {
            return size;
        }
    }

    if (normalizedValue.endsWith('%')) {
        const percentage = Number.parseFloat(normalizedValue);

        if (Number.isFinite(percentage)) {
            return (size * percentage) / 100;
        }
    }

    const parsed = Number.parseFloat(normalizedValue);

    return Number.isFinite(parsed) ? parsed : 0;
};

const resolveTransformOrigin = ({
    height,
    transformOrigin,
    width
}: {
    width: number;
    height: number;
    transformOrigin: string;
}): Point => {
    const [rawX, rawY] = transformOrigin.trim().split(/\s+/);

    return {
        x: resolveTransformOriginComponent({
            axis: 'x',
            size: width,
            value: rawX
        }),
        y: resolveTransformOriginComponent({
            axis: 'y',
            size: height,
            value: rawY
        })
    };
};

const applyMatrixToPoint = ({
    matrix,
    origin,
    point
}: {
    point: Point;
    origin: Point;
    matrix: NonNullable<ReturnType<typeof resolveTransformMatrix>>;
}): Point => ({
    x:
        origin.x +
        matrix.a * (point.x - origin.x) +
        matrix.c * (point.y - origin.y),
    y:
        origin.y +
        matrix.b * (point.x - origin.x) +
        matrix.d * (point.y - origin.y)
});

const measureTransformedRectGeometry = ({
    height,
    transform,
    transformOrigin,
    width
}: {
    width: number;
    height: number;
    transform: string;
    transformOrigin: string;
}) => {
    const matrix = resolveTransformMatrix(transform);

    if (!matrix) {
        return {
            bottomEdgeMaxY: height,
            bottomEdgeMidpoint: { x: width / 2, y: height }
        };
    }

    const origin = resolveTransformOrigin({
        height,
        transformOrigin,
        width
    });
    const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
    ].map((corner) =>
        applyMatrixToPoint({
            matrix,
            origin,
            point: corner
        })
    );
    const bottomEdge = corners
        .map((point, index) => {
            const nextPoint = corners[(index + 1) % corners.length];

            return {
                maxY: Math.max(point.y, nextPoint.y),
                midpoint: {
                    x: (point.x + nextPoint.x) / 2,
                    y: (point.y + nextPoint.y) / 2
                }
            };
        })
        .reduce((lowestEdge, edge) => {
            if (edge.midpoint.y > lowestEdge.midpoint.y) {
                return edge;
            }

            if (
                edge.midpoint.y === lowestEdge.midpoint.y &&
                edge.maxY > lowestEdge.maxY
            ) {
                return edge;
            }

            return lowestEdge;
        });

    return {
        bottomEdgeMaxY: bottomEdge.maxY,
        bottomEdgeMidpoint: bottomEdge.midpoint
    };
};

const formatSelectionSizeValue = (value: number) => {
    const rounded = Math.round(value * 100) / 100;

    return Number.isInteger(rounded)
        ? String(rounded)
        : String(rounded).replace(/\.?0+$/, '');
};

export const measureViewportSelectionBounds = ({
    scrollElement,
    selectedNodeId,
    zoom
}: {
    scrollElement: HTMLElement;
    selectedNodeId: string;
    zoom: number;
}): ViewportSelectionBounds | null => {
    const nodeElement = scrollElement.querySelector<HTMLElement>(
        `[data-design-node-id="${escapeDesignNodeSelectorValue(selectedNodeId)}"]`
    );

    if (!nodeElement) {
        return null;
    }

    const scrollRect = scrollElement.getBoundingClientRect();
    const nodeRect = nodeElement.getBoundingClientRect();
    const normalizedZoom = Math.max(zoom, 0.0001);
    const computedStyle = window.getComputedStyle(nodeElement);
    const transform =
        nodeElement.style.transform || computedStyle.transform || '';
    const transformOrigin =
        nodeElement.style.transformOrigin ||
        computedStyle.transformOrigin ||
        '0px 0px';
    const intrinsicWidth =
        nodeElement.offsetWidth ||
        toFiniteNumber(computedStyle.width) ||
        nodeRect.width / normalizedZoom;
    const intrinsicHeight =
        nodeElement.offsetHeight ||
        toFiniteNumber(computedStyle.height) ||
        nodeRect.height / normalizedZoom;
    const screenWidth = normalizeCssNumber(intrinsicWidth * normalizedZoom);
    const screenHeight = normalizeCssNumber(intrinsicHeight * normalizedZoom);
    const normalizedTransform =
        transform && transform !== 'none' ? transform : undefined;
    const normalizedTransformOrigin = normalizedTransform
        ? transformOrigin
        : undefined;
    const { bottomEdgeMaxY, bottomEdgeMidpoint } =
        measureTransformedRectGeometry({
            height: screenHeight,
            transform: normalizedTransform ?? '',
            transformOrigin: normalizedTransformOrigin ?? '0px 0px',
            width: screenWidth
        });
    const aabbLeft = normalizeCssNumber(
        nodeRect.left - scrollRect.left + scrollElement.scrollLeft
    );
    const aabbTop = normalizeCssNumber(
        nodeRect.top - scrollRect.top + scrollElement.scrollTop
    );
    const renderOrigin = getRenderOriginFromAabb({
        x: aabbLeft,
        y: aabbTop,
        width: screenWidth,
        height: screenHeight,
        rotation: extractRotationDegrees(normalizedTransform ?? '')
    });
    const left = normalizeCssNumber(renderOrigin.x);
    const top = normalizeCssNumber(renderOrigin.y);

    return {
        nodeId: selectedNodeId,
        left,
        top,
        width: screenWidth,
        height: screenHeight,
        labelWidth: normalizeCssNumber(intrinsicWidth),
        labelHeight: normalizeCssNumber(intrinsicHeight),
        labelLeft: normalizeCssNumber(left + bottomEdgeMidpoint.x),
        labelTop: normalizeCssNumber(
            top + bottomEdgeMaxY + SELECTION_LABEL_OFFSET
        ),
        transform: normalizedTransform,
        transformOrigin: normalizedTransformOrigin
    };
};

export const ViewportSelectionOverlay = ({
    bounds
}: {
    bounds: ViewportSelectionBounds;
}) => (
    <>
        <div
            aria-hidden="true"
            className="editor-viewport-selection-frame"
            data-viewport-selection-node-id={bounds.nodeId}
            style={{
                position: 'absolute',
                left: px(bounds.left),
                top: px(bounds.top),
                width: px(bounds.width),
                height: px(bounds.height),
                boxSizing: 'border-box',
                border: `${SELECTION_BORDER_WIDTH}px solid ${SELECTION_COLOR}`,
                transform: bounds.transform,
                transformOrigin: bounds.transformOrigin,
                pointerEvents: 'none'
            }}
        >
            {selectionHandlePositions.map(({ position, style }) => (
                <span
                    className="editor-viewport-selection-handle"
                    data-viewport-selection-handle-position={position}
                    key={position}
                    style={{
                        position: 'absolute',
                        width: px(SELECTION_HANDLE_SIZE),
                        height: px(SELECTION_HANDLE_SIZE),
                        boxSizing: 'border-box',
                        border: `${SELECTION_HANDLE_BORDER_WIDTH}px solid ${SELECTION_COLOR}`,
                        backgroundColor: '#FFFFFF',
                        ...style
                    }}
                />
            ))}
        </div>
        <span
            className="editor-viewport-selection-size-label"
            data-viewport-selection-size-label="true"
            style={{
                position: 'absolute',
                left: px(bounds.labelLeft),
                top: px(bounds.labelTop),
                transform: 'translate(-50%, 0)',
                height: px(SELECTION_LABEL_HEIGHT),
                minWidth: '60px',
                padding: '0 8px',
                borderRadius: '7px',
                backgroundColor: SELECTION_COLOR,
                color: '#FFFFFF',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '13px',
                fontWeight: 600,
                lineHeight: px(SELECTION_LABEL_HEIGHT),
                textAlign: 'center',
                whiteSpace: 'nowrap'
            }}
        >
            {formatSelectionSizeValue(bounds.labelWidth)} ×{' '}
            {formatSelectionSizeValue(bounds.labelHeight)}
        </span>
    </>
);
