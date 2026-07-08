/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import type {
    MiaomaDesignNode as DesignNode,
    MiaomaDimension as Dimension,
    MiaomaLayoutDirection as LayoutDirection
} from '@miaoma-design-ai/miaoma-design-schema';

import { getRotatedBoundingBoxSize } from '../../utils/rotationAabb';

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type SelectionParentLayout = 'absolute' | Exclude<LayoutDirection, 'none'>;

export type SelectionOverlayBounds = Bounds & {
    nodeId: string;
};

const SELECTION_COLOR = '#4592FF';
const SELECTION_BORDER_WIDTH = 3;
const SELECTION_HANDLE_SIZE = 10;

const px = (value: number) => `${value}px`;

const normalizeCssNumber = (value: number) => Math.round(value * 10000) / 10000;

const scaledPx = (value: number, zoom: number) =>
    px(normalizeCssNumber(value / Math.max(zoom, 0.0001)));

const getNumericDimension = (value: Dimension | undefined) =>
    typeof value === 'number' ? value : 0;

const getNodeWidth = (node: DesignNode) =>
    'width' in node ? getNumericDimension(node.width) : 0;

const getNodeHeight = (node: DesignNode) =>
    'height' in node ? getNumericDimension(node.height) : 0;

const getNodeBoundsSize = (node: DesignNode) =>
    getRotatedBoundingBoxSize({
        width: getNodeWidth(node),
        height: getNodeHeight(node),
        rotation: node.rotation
    });

const getFlowLayout = (
    layout: LayoutDirection | undefined
): Exclude<LayoutDirection, 'none'> | undefined =>
    layout === 'horizontal' || layout === 'vertical' ? layout : undefined;

const getNodeOffset = (
    node: DesignNode,
    parentLayout: SelectionParentLayout
): Pick<Bounds, 'x' | 'y'> =>
    parentLayout === 'absolute'
        ? {
              x: node.x ?? 0,
              y: node.y ?? 0
          }
        : { x: 0, y: 0 };

export const getSelectionOverlayBounds = ({
    nodes,
    parentLayout,
    parentOffset,
    selectedNodeIds
}: {
    nodes: DesignNode[];
    parentLayout: SelectionParentLayout;
    parentOffset: Pick<Bounds, 'x' | 'y'>;
    selectedNodeIds: Set<string>;
}): SelectionOverlayBounds[] =>
    nodes.flatMap((node) => {
        const nodeOffset = getNodeOffset(node, parentLayout);
        const absoluteOffset = {
            x: parentOffset.x + nodeOffset.x,
            y: parentOffset.y + nodeOffset.y
        };
        const nodeBoundsSize = getNodeBoundsSize(node);
        const currentBounds = selectedNodeIds.has(node.id)
            ? [
                  {
                      nodeId: node.id,
                      x: absoluteOffset.x,
                      y: absoluteOffset.y,
                      width: nodeBoundsSize.width,
                      height: nodeBoundsSize.height
                  }
              ]
            : [];

        if (node.type !== 'frame') {
            return currentBounds;
        }

        return [
            ...currentBounds,
            ...getSelectionOverlayBounds({
                nodes: node.children ?? [],
                parentLayout: getFlowLayout(node.layout) ?? 'absolute',
                parentOffset: absoluteOffset,
                selectedNodeIds
            })
        ];
    });

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

export const escapeDesignNodeSelectorValue = (value: string) =>
    value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const formatSelectionSizeValue = (value: number) => {
    const rounded = Math.round(value * 100) / 100;

    return Number.isInteger(rounded)
        ? String(rounded)
        : String(rounded).replace(/\.?0+$/, '');
};

const SelectionOverlay = ({
    bounds,
    zoom
}: {
    bounds: SelectionOverlayBounds;
    zoom: number;
}) => (
    <div
        aria-hidden="true"
        className="editor-document-selection-frame"
        data-selection-node-id={bounds.nodeId}
        style={{
            position: 'absolute',
            left: px(bounds.x),
            top: px(bounds.y),
            width: px(bounds.width),
            height: px(bounds.height),
            boxSizing: 'border-box',
            border: `${scaledPx(SELECTION_BORDER_WIDTH, zoom)} solid ${SELECTION_COLOR}`,
            pointerEvents: 'none'
        }}
    >
        {selectionHandlePositions.map(({ position, style }) => (
            <span
                className="editor-document-selection-handle"
                data-selection-handle-position={position}
                key={position}
                style={{
                    position: 'absolute',
                    width: scaledPx(SELECTION_HANDLE_SIZE, zoom),
                    height: scaledPx(SELECTION_HANDLE_SIZE, zoom),
                    boxSizing: 'border-box',
                    border: `${scaledPx(2, zoom)} solid ${SELECTION_COLOR}`,
                    backgroundColor: '#FFFFFF',
                    ...style
                }}
            />
        ))}
        <span
            className="editor-document-selection-size-label"
            data-selection-size-label="true"
            style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: `translate(-50%, ${scaledPx(6, zoom)})`,
                height: scaledPx(24, zoom),
                minWidth: scaledPx(60, zoom),
                padding: `0 ${scaledPx(8, zoom)}`,
                borderRadius: scaledPx(7, zoom),
                backgroundColor: SELECTION_COLOR,
                color: '#FFFFFF',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: scaledPx(13, zoom),
                fontWeight: 600,
                lineHeight: scaledPx(24, zoom),
                textAlign: 'center',
                whiteSpace: 'nowrap'
            }}
        >
            {formatSelectionSizeValue(bounds.width)} ×{' '}
            {formatSelectionSizeValue(bounds.height)}
        </span>
    </div>
);

export const SelectionOverlayLayer = ({
    selectionBounds,
    zoom
}: {
    selectionBounds: SelectionOverlayBounds[];
    zoom: number;
}) =>
    selectionBounds.length > 0 ? (
        <div
            aria-hidden="true"
            className="editor-document-selection-layer"
            data-selection-overlay-layer="true"
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 9999,
                overflow: 'visible',
                pointerEvents: 'none'
            }}
        >
            {selectionBounds.map((bounds) => (
                <SelectionOverlay
                    bounds={bounds}
                    key={bounds.nodeId}
                    zoom={zoom}
                />
            ))}
        </div>
    ) : null;
