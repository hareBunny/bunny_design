/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { RefObject } from 'react';

import type {
    CanvasToolId,
    HitPathNode,
    InteractionPointerPayload
} from '@miaoma-design-ai/miaoma-editor-interaction';
import { useDrag } from '@use-gesture/react';

import { getNextSelectedNodeIdFromPath } from '../../document/documentSelectionUtils';

type NodeDragMemo = {
    nodeBaseTransform: string;
    nodeElement: HTMLElement;
    nodePath: HitPathNode[];
    selectionBaseTransform: string;
    selectionElement: HTMLElement | null;
};

export type BuildViewportPointerPayload = (payload: {
    button: number;
    clientX: number;
    clientY: number;
    target: EventTarget | null;
    nodePath?: HitPathNode[];
}) => InteractionPointerPayload | null;

type UseCanvasNodeDragGestureOptions = {
    activeTool: CanvasToolId;
    buildPointerPayloadFromClientPoint: BuildViewportPointerPayload;
    isSelectionEnabled: boolean;
    onDragStateChange?: (isDragging: boolean) => void;
    onViewportPointerDown?: (payload: InteractionPointerPayload) => void;
    onViewportPointerUp?: (payload: InteractionPointerPayload) => void;
    selectedNodePath?: string[] | null;
    scrollRef: RefObject<HTMLDivElement | null>;
    selectedNodeHitPath?: HitPathNode[] | null;
    selectedNodeId?: string | null;
    selectedNodeWorldRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    zoom: number;
};

const escapeSelectorValue = (value: string) =>
    value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const getSelectedNodeElement = (
    scrollElement: HTMLElement,
    selectedNodeId: string
) =>
    scrollElement.querySelector<HTMLElement>(
        `[data-design-node-id="${escapeSelectorValue(selectedNodeId)}"]`
    );

const getSelectionElement = (
    scrollElement: HTMLElement,
    selectedNodeId: string
) =>
    scrollElement.querySelector<HTMLElement>(
        `[data-viewport-selection-node-id="${escapeSelectorValue(
            selectedNodeId
        )}"]`
    );

const isPointWithinClientRect = ({
    clientX,
    clientY,
    rect
}: {
    clientX: number;
    clientY: number;
    rect: DOMRect;
}) =>
    (rect.width > 0 || rect.height > 0) &&
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom;

const isPointWithinWorldRect = ({
    point,
    rect
}: {
    point: { x: number; y: number };
    rect:
        | {
              x: number;
              y: number;
              width: number;
              height: number;
          }
        | null
        | undefined;
}) =>
    rect !== null &&
    rect !== undefined &&
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height;

const resolveDragTargetPayload = ({
    initialPayload,
    selectedNodeHitPath,
    selectedNodeId,
    selectedNodePath,
    selectedNodeWorldRect,
    targetRect
}: {
    initialPayload: InteractionPointerPayload;
    selectedNodeHitPath?: HitPathNode[] | null;
    selectedNodeId?: string | null;
    selectedNodePath?: string[] | null;
    selectedNodeWorldRect?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    targetRect: DOMRect;
}) => {
    const directlyHitsSelectedNode =
        selectedNodeId !== null &&
        selectedNodeId !== undefined &&
        initialPayload.nodePath.some((node) => node.id === selectedNodeId);
    const fallsWithinSelectedBounds =
        selectedNodeId !== null &&
        selectedNodeId !== undefined &&
        (isPointWithinClientRect({
            clientX: initialPayload.screenX,
            clientY: initialPayload.screenY,
            rect: targetRect
        }) ||
            isPointWithinWorldRect({
                point: {
                    x: initialPayload.worldX,
                    y: initialPayload.worldY
                },
                rect: selectedNodeWorldRect
            }));

    if (
        selectedNodeHitPath &&
        (directlyHitsSelectedNode || fallsWithinSelectedBounds)
    ) {
        return {
            nodeId: selectedNodeHitPath.at(-1)?.id ?? null,
            payload: {
                ...initialPayload,
                nodePath: selectedNodeHitPath
            }
        };
    }

    if (initialPayload.nodePath.length === 0) {
        return null;
    }

    const nextSelectedNodeId = getNextSelectedNodeIdFromPath({
        clickCount: 1,
        nodePath: initialPayload.nodePath.map((node) => node.id),
        selectedNodeId,
        selectedNodePath
    });

    if (!nextSelectedNodeId) {
        return null;
    }

    const targetNodeIndex = initialPayload.nodePath.findIndex(
        (node) => node.id === nextSelectedNodeId
    );

    if (targetNodeIndex === -1) {
        return null;
    }

    return {
        nodeId: nextSelectedNodeId,
        payload: {
            ...initialPayload,
            nodePath: initialPayload.nodePath.slice(0, targetNodeIndex + 1)
        }
    };
};

const applyDragPreview = ({
    memo,
    movement,
    zoom
}: {
    memo: NodeDragMemo;
    movement: [number, number];
    zoom: number;
}) => {
    const normalizedZoom = Math.max(zoom, 0.0001);
    const nodeTranslate = `translate(${movement[0] / normalizedZoom}px, ${
        movement[1] / normalizedZoom
    }px)`;
    const selectionTranslate = `translate(${movement[0]}px, ${movement[1]}px)`;

    memo.nodeElement.style.transform = [nodeTranslate, memo.nodeBaseTransform]
        .filter(Boolean)
        .join(' ');

    if (memo.selectionElement) {
        memo.selectionElement.style.transform = [
            selectionTranslate,
            memo.selectionBaseTransform
        ]
            .filter(Boolean)
            .join(' ');
    }
};

const resetDragPreview = (memo: NodeDragMemo) => {
    memo.nodeElement.style.transform = memo.nodeBaseTransform;

    if (memo.selectionElement) {
        memo.selectionElement.style.transform = memo.selectionBaseTransform;
    }
};

const resolveDropTargetElement = ({
    clientX,
    clientY,
    fallbackTarget,
    memo
}: {
    clientX: number;
    clientY: number;
    fallbackTarget: EventTarget | null;
    memo: NodeDragMemo;
}) => {
    if (
        fallbackTarget instanceof HTMLElement &&
        !memo.nodeElement.contains(fallbackTarget)
    ) {
        return fallbackTarget;
    }

    const ownerDocument = memo.nodeElement.ownerDocument;

    if (typeof ownerDocument.elementFromPoint !== 'function') {
        return fallbackTarget;
    }

    const previousPointerEvents = memo.nodeElement.style.pointerEvents;
    memo.nodeElement.style.pointerEvents = 'none';

    const resolvedTarget = ownerDocument.elementFromPoint(clientX, clientY);

    memo.nodeElement.style.pointerEvents = previousPointerEvents;

    return resolvedTarget ?? fallbackTarget;
};

export const useCanvasNodeDragGesture = ({
    activeTool,
    buildPointerPayloadFromClientPoint,
    isSelectionEnabled,
    onDragStateChange,
    onViewportPointerDown,
    onViewportPointerUp,
    selectedNodePath,
    scrollRef,
    selectedNodeHitPath,
    selectedNodeId,
    selectedNodeWorldRect,
    zoom
}: UseCanvasNodeDragGestureOptions) => {
    useDrag(
        ({
            cancel,
            event,
            first,
            initial,
            last,
            memo,
            movement,
            target,
            xy
        }) => {
            if (!isSelectionEnabled || activeTool !== 'pointer') {
                return null;
            }

            const previousMemo = memo as NodeDragMemo | null | undefined;
            let nextMemo = previousMemo ?? null;

            if (first) {
                const scrollElement = scrollRef.current;
                if (!scrollElement) {
                    cancel();
                    return null;
                }

                const selectedNodeElement =
                    selectedNodeId && scrollElement
                        ? getSelectedNodeElement(scrollElement, selectedNodeId)
                        : null;
                const initialPayload = buildPointerPayloadFromClientPoint({
                    button: 0,
                    clientX: initial[0],
                    clientY: initial[1],
                    target
                });

                if (!initialPayload) {
                    cancel();
                    return null;
                }

                const dragStart = resolveDragTargetPayload({
                    initialPayload,
                    selectedNodeHitPath,
                    selectedNodeId,
                    selectedNodePath,
                    selectedNodeWorldRect,
                    targetRect:
                        selectedNodeElement?.getBoundingClientRect() ??
                        new DOMRect()
                });

                if (!dragStart?.nodeId) {
                    cancel();
                    return null;
                }
                const dragTargetElement = getSelectedNodeElement(
                    scrollElement,
                    dragStart.nodeId
                );

                if (!dragTargetElement) {
                    cancel();
                    return null;
                }
                const dragSelectionElement = scrollElement
                    ? getSelectionElement(scrollElement, dragStart.nodeId)
                    : null;

                onDragStateChange?.(true);
                onViewportPointerDown?.(dragStart.payload);
                nextMemo = {
                    nodeBaseTransform: dragTargetElement.style.transform,
                    nodeElement: dragTargetElement,
                    nodePath: dragStart.payload.nodePath,
                    selectionBaseTransform:
                        dragSelectionElement?.style.transform ?? '',
                    selectionElement: dragSelectionElement
                };
            }

            if (!nextMemo) {
                return null;
            }

            event.preventDefault();
            applyDragPreview({
                memo: nextMemo,
                movement,
                zoom
            });

            const fallbackTarget =
                event.target instanceof EventTarget ? event.target : target;
            const resolvedTarget = last
                ? resolveDropTargetElement({
                      clientX: xy[0],
                      clientY: xy[1],
                      fallbackTarget,
                      memo: nextMemo
                  })
                : fallbackTarget;
            const shouldResolveHoverPath =
                last &&
                resolvedTarget instanceof HTMLElement &&
                resolvedTarget.closest('[data-document-renderer="true"]') !==
                    null;
            const finalNodePath =
                last && !shouldResolveHoverPath ? [] : nextMemo.nodePath;
            const payload = buildPointerPayloadFromClientPoint({
                button: 0,
                clientX: xy[0],
                clientY: xy[1],
                nodePath: shouldResolveHoverPath ? undefined : finalNodePath,
                target: resolvedTarget
            });

            if (!payload) {
                if (last) {
                    window.requestAnimationFrame(() => {
                        resetDragPreview(nextMemo);
                        onDragStateChange?.(false);
                    });
                    return null;
                }
                return nextMemo;
            }

            if (last) {
                onViewportPointerUp?.(payload);
                window.requestAnimationFrame(() => {
                    resetDragPreview(nextMemo);
                    onDragStateChange?.(false);
                });
                return null;
            }

            return nextMemo;
        },
        {
            enabled: isSelectionEnabled && activeTool === 'pointer',
            eventOptions: { passive: false },
            filterTaps: true,
            pointer: {
                buttons: 1,
                capture: false,
                keys: false
            },
            target: scrollRef,
            threshold: 1
        }
    );
};
