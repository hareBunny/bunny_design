/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaDimension,
    MiaomaFrameNode,
    MiaomaSpacing
} from '@miaoma-design-ai/miaoma-design-schema';
import type { HitPathNode } from '@miaoma-design-ai/miaoma-editor-interaction';

type DesignNodeLookup = Map<
    string,
    Pick<HitPathNode, 'id' | 'layout' | 'type'>
>;

type Point = {
    x: number;
    y: number;
};

type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type FrameRect = Rect;

type MeasureContext = {
    availableWidth?: number;
    availableHeight?: number;
    parentLayout: 'absolute' | 'horizontal' | 'vertical';
};

const isFlowLayout = (
    layout: MiaomaFrameNode['layout']
): layout is 'horizontal' | 'vertical' =>
    layout === 'horizontal' || layout === 'vertical';

const toPaddingQuad = (
    padding: MiaomaSpacing | undefined
): [number, number, number, number] => {
    if (padding === undefined) {
        return [0, 0, 0, 0];
    }

    if (typeof padding === 'number') {
        return [padding, padding, padding, padding];
    }

    if (padding.length === 2) {
        return [padding[0], padding[1], padding[0], padding[1]];
    }

    return padding;
};

const isPointWithinRect = (point: Point, rect: Rect) =>
    point.x >= rect.x &&
    point.y >= rect.y &&
    point.x <= rect.x + rect.width &&
    point.y <= rect.y + rect.height;

const getDimensionToken = (
    node: MiaomaDesignNode,
    axis: 'width' | 'height'
): MiaomaDimension | undefined => {
    if (!('width' in node) && axis === 'width') {
        return undefined;
    }

    if (!('height' in node) && axis === 'height') {
        return undefined;
    }

    return axis === 'width'
        ? 'width' in node
            ? node.width
            : undefined
        : 'height' in node
          ? node.height
          : undefined;
};

const getAvailableAxisSize = (
    context: MeasureContext,
    axis: 'width' | 'height'
) =>
    axis === 'width'
        ? (context.availableWidth ?? 0)
        : (context.availableHeight ?? 0);

const getFlowIntrinsicSize = (
    node: MiaomaFrameNode & { layout: 'horizontal' | 'vertical' },
    context: MeasureContext
): { width: number; height: number } => {
    const children = node.children ?? [];
    const padding = toPaddingQuad(node.padding);
    const gap = node.gap ?? 0;
    const knownWidth =
        typeof node.width === 'number'
            ? node.width
            : node.width === 'fill_container'
              ? context.availableWidth
              : undefined;
    const knownHeight =
        typeof node.height === 'number'
            ? node.height
            : node.height === 'fill_container'
              ? context.availableHeight
              : undefined;
    const innerAvailableWidth =
        knownWidth === undefined
            ? context.availableWidth
            : Math.max(0, knownWidth - padding[1] - padding[3]);
    const innerAvailableHeight =
        knownHeight === undefined
            ? context.availableHeight
            : Math.max(0, knownHeight - padding[0] - padding[2]);
    const childSizes = measureFlowChildSizes(
        children,
        node.layout,
        {
            availableHeight: innerAvailableHeight,
            availableWidth: innerAvailableWidth
        },
        gap
    );

    if (node.layout === 'horizontal') {
        return {
            height:
                padding[0] +
                padding[2] +
                Math.max(0, ...childSizes.map((size) => size.height)),
            width:
                padding[1] +
                padding[3] +
                childSizes.reduce((sum, size) => sum + size.width, 0) +
                Math.max(0, children.length - 1) * gap
        };
    }

    return {
        width:
            padding[1] +
            padding[3] +
            Math.max(0, ...childSizes.map((size) => size.width)),
        height:
            padding[0] +
            padding[2] +
            childSizes.reduce((sum, size) => sum + size.height, 0) +
            Math.max(0, children.length - 1) * gap
    };
};

const getAbsoluteIntrinsicSize = (
    node: MiaomaFrameNode
): { width: number; height: number } => {
    const children = node.children ?? [];

    if (children.length === 0) {
        return { width: 0, height: 0 };
    }

    return children.reduce(
        (accumulator, child) => {
            const size = measureNodeSize(child, {
                parentLayout: 'absolute'
            });

            return {
                width: Math.max(accumulator.width, (child.x ?? 0) + size.width),
                height: Math.max(
                    accumulator.height,
                    (child.y ?? 0) + size.height
                )
            };
        },
        { width: 0, height: 0 }
    );
};

const resolveDimension = (
    value: MiaomaDimension | undefined,
    axis: 'width' | 'height',
    context: MeasureContext,
    measureIntrinsic: () => number
) => {
    if (typeof value === 'number') {
        return value;
    }

    if (value === 'fill_container') {
        return getAvailableAxisSize(context, axis);
    }

    return measureIntrinsic();
};

const measureFrameSize = (
    node: MiaomaFrameNode,
    context: MeasureContext
): { width: number; height: number } => {
    const intrinsicSize = isFlowLayout(node.layout)
        ? getFlowIntrinsicSize(node, context)
        : getAbsoluteIntrinsicSize(node);

    return {
        width: resolveDimension(node.width, 'width', context, () => {
            return intrinsicSize.width;
        }),
        height: resolveDimension(node.height, 'height', context, () => {
            return intrinsicSize.height;
        })
    };
};

const measureNodeSize = (
    node: MiaomaDesignNode,
    context: MeasureContext
): { width: number; height: number } => {
    if (node.type === 'frame') {
        return measureFrameSize(node, context);
    }

    return {
        width: resolveDimension(
            getDimensionToken(node, 'width'),
            'width',
            context,
            () => 0
        ),
        height: resolveDimension(
            getDimensionToken(node, 'height'),
            'height',
            context,
            () => 0
        )
    };
};

const measureFlowChildSizes = (
    children: MiaomaDesignNode[],
    layout: 'horizontal' | 'vertical',
    availableSize: {
        availableWidth?: number;
        availableHeight?: number;
    },
    gap: number
) => {
    const mainAxis = layout === 'horizontal' ? 'width' : 'height';
    const crossAxis = layout === 'horizontal' ? 'height' : 'width';
    const mainAvailable =
        mainAxis === 'width'
            ? availableSize.availableWidth
            : availableSize.availableHeight;
    const crossAvailable =
        crossAxis === 'width'
            ? availableSize.availableWidth
            : availableSize.availableHeight;
    const intrinsicSizes = children.map((child) =>
        measureNodeSize(child, {
            availableHeight: availableSize.availableHeight,
            availableWidth: availableSize.availableWidth,
            parentLayout: layout
        })
    );
    const fillMainAxisIndexes = children.flatMap((child, index) =>
        getDimensionToken(child, mainAxis) === 'fill_container' ? [index] : []
    );
    const fixedMainAxisTotal = intrinsicSizes.reduce((sum, size, index) => {
        return fillMainAxisIndexes.includes(index) ? sum : sum + size[mainAxis];
    }, 0);
    const remainingMainAxis =
        mainAvailable === undefined
            ? 0
            : Math.max(
                  0,
                  mainAvailable -
                      fixedMainAxisTotal -
                      Math.max(0, children.length - 1) * gap
              );
    const sharedFillMainAxisSize =
        fillMainAxisIndexes.length === 0
            ? 0
            : remainingMainAxis / fillMainAxisIndexes.length;

    return children.map((child, index) => {
        const intrinsicSize = intrinsicSizes[index];
        const crossToken = getDimensionToken(child, crossAxis);
        const nextCrossSize =
            crossToken === 'fill_container'
                ? (crossAvailable ?? intrinsicSize[crossAxis])
                : intrinsicSize[crossAxis];

        if (layout === 'horizontal') {
            return {
                width:
                    getDimensionToken(child, 'width') === 'fill_container'
                        ? sharedFillMainAxisSize
                        : intrinsicSize.width,
                height: nextCrossSize
            };
        }

        return {
            width: nextCrossSize,
            height:
                getDimensionToken(child, 'height') === 'fill_container'
                    ? sharedFillMainAxisSize
                    : intrinsicSize.height
        };
    });
};

const getChildRects = (frame: MiaomaFrameNode, frameRect: Rect) => {
    const children = frame.children ?? [];

    if (!isFlowLayout(frame.layout)) {
        return children.map((child) => {
            const size = measureNodeSize(child, {
                availableHeight: frameRect.height,
                availableWidth: frameRect.width,
                parentLayout: 'absolute'
            });

            return {
                node: child,
                rect: {
                    height: size.height,
                    width: size.width,
                    x: frameRect.x + (child.x ?? 0),
                    y: frameRect.y + (child.y ?? 0)
                }
            };
        });
    }

    const padding = toPaddingQuad(frame.padding);
    const gap = frame.gap ?? 0;
    const innerWidth = Math.max(0, frameRect.width - padding[1] - padding[3]);
    const innerHeight = Math.max(0, frameRect.height - padding[0] - padding[2]);
    const sizes = measureFlowChildSizes(
        children,
        frame.layout,
        {
            availableHeight: innerHeight,
            availableWidth: innerWidth
        },
        gap
    );
    let cursorX = frameRect.x + padding[3];
    let cursorY = frameRect.y + padding[0];

    return children.map((child, index) => {
        const size = sizes[index];
        const rect =
            frame.layout === 'horizontal'
                ? {
                      height: size.height,
                      width: size.width,
                      x: cursorX,
                      y: frameRect.y + padding[0]
                  }
                : {
                      height: size.height,
                      width: size.width,
                      x: frameRect.x + padding[3],
                      y: cursorY
                  };

        if (frame.layout === 'horizontal') {
            cursorX += size.width + gap;
        } else {
            cursorY += size.height + gap;
        }

        return {
            node: child,
            rect
        };
    });
};

const toHitPathNode = (node: MiaomaDesignNode): HitPathNode => ({
    id: node.id,
    layout: node.type === 'frame' ? node.layout : undefined,
    type: node.type
});

const findFramePathAtPoint = (
    frame: MiaomaFrameNode,
    frameRect: Rect,
    point: Point
): HitPathNode[] => {
    if (!isPointWithinRect(point, frameRect)) {
        return [];
    }

    const childRects = getChildRects(frame, frameRect);

    for (const child of [...childRects].reverse()) {
        if (child.node.type !== 'frame') {
            continue;
        }

        const nestedPath = findFramePathAtPoint(child.node, child.rect, point);

        if (nestedPath.length > 0) {
            return [toHitPathNode(frame), ...nestedPath];
        }
    }

    return [toHitPathNode(frame)];
};

const extractNodePathFromTarget = ({
    lookup,
    rendererRoot,
    target
}: {
    target: EventTarget | null;
    rendererRoot: HTMLElement;
    lookup: DesignNodeLookup;
}) => {
    if (!(target instanceof HTMLElement)) {
        return [];
    }

    const nodePath: HitPathNode[] = [];
    let currentElement: HTMLElement | null = target;

    while (currentElement && currentElement !== rendererRoot) {
        const nodeId = currentElement.dataset.designNodeId;

        if (nodeId) {
            const node = lookup.get(nodeId);

            if (node) {
                nodePath.unshift(node);
            }
        }

        currentElement = currentElement.parentElement;
    }

    return nodePath;
};

const hitTestFramePath = (
    document: MiaomaDesignDocument,
    point: Point
): HitPathNode[] => {
    for (const node of [...document.children].reverse()) {
        if (node.type !== 'frame') {
            continue;
        }

        const size = measureNodeSize(node, {
            parentLayout: 'absolute'
        });
        const rect = {
            height: size.height,
            width: size.width,
            x: node.x ?? 0,
            y: node.y ?? 0
        };
        const path = findFramePathAtPoint(node, rect, point);

        if (path.length > 0) {
            return path;
        }
    }

    return [];
};

const findFrameRectAtId = (
    frame: MiaomaFrameNode,
    frameRect: Rect,
    frameId: string
): FrameRect | null => {
    if (frame.id === frameId) {
        return frameRect;
    }

    const childRects = getChildRects(frame, frameRect);

    for (const child of childRects) {
        if (child.node.type !== 'frame') {
            continue;
        }

        const nestedRect = findFrameRectAtId(child.node, child.rect, frameId);

        if (nestedRect) {
            return nestedRect;
        }
    }

    return null;
};

export const findFrameRectInRenderer = (
    document: MiaomaDesignDocument,
    frameId: string
): FrameRect | null => {
    for (const node of document.children) {
        if (node.type !== 'frame') {
            continue;
        }

        const size = measureNodeSize(node, {
            parentLayout: 'absolute'
        });
        const frameRect = {
            height: size.height,
            width: size.width,
            x: node.x ?? 0,
            y: node.y ?? 0
        };
        const nestedRect = findFrameRectAtId(node, frameRect, frameId);

        if (nestedRect) {
            return nestedRect;
        }
    }

    return null;
};

export const extractDesignNodePath = ({
    document,
    lookup,
    rendererRoot,
    target,
    worldX,
    worldY
}: {
    document: MiaomaDesignDocument;
    lookup: DesignNodeLookup;
    rendererRoot: HTMLElement;
    target: EventTarget | null;
    worldX: number;
    worldY: number;
}) => {
    const domPath = extractNodePathFromTarget({
        lookup,
        rendererRoot,
        target
    });

    if (domPath.length > 0) {
        return domPath;
    }

    return hitTestFramePath(document, {
        x: worldX,
        y: worldY
    });
};
