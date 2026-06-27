/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

const SELECTION_COLOR = '#4592FF';
const SELECTION_BORDER_WIDTH = 3;
const SELECTION_HANDLE_BORDER_WIDTH = 2;
const SELECTION_HANDLE_SIZE = 10;
const SELECTION_LABEL_HEIGHT = 24;

export type ViewportSelectionBounds = {
    nodeId: string;
    left: number;
    top: number;
    width: number;
    height: number;
    labelWidth: number;
    labelHeight: number;
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

    return {
        nodeId: selectedNodeId,
        left: normalizeCssNumber(
            nodeRect.left - scrollRect.left + scrollElement.scrollLeft
        ),
        top: normalizeCssNumber(
            nodeRect.top - scrollRect.top + scrollElement.scrollTop
        ),
        width: normalizeCssNumber(nodeRect.width),
        height: normalizeCssNumber(nodeRect.height),
        labelWidth: normalizeCssNumber(nodeRect.width / normalizedZoom),
        labelHeight: normalizeCssNumber(nodeRect.height / normalizedZoom)
    };
};

export const ViewportSelectionOverlay = ({
    bounds
}: {
    bounds: ViewportSelectionBounds;
}) => (
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
        <span
            className="editor-viewport-selection-size-label"
            data-viewport-selection-size-label="true"
            style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translate(-50%, 6px)',
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
    </div>
);
