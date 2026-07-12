/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import type { MiaomaDesignDocument as DesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import {
    type AssetResolver,
    CanvasRenderNode,
    defaultNodeRenderers,
    getTopLevelBounds,
    type NodeRendererRegistry
} from './CanvasNodeRenderers';
import {
    type DoubleClickSelectionTarget,
    findDesignNodePathById,
    getNextDoubleClickSelectionTarget,
    getNextSelectedNodeIdFromPath
} from './documentSelectionUtils';
import {
    escapeDesignNodeSelectorValue,
    getSelectionOverlayBounds,
    type SelectionOverlayBounds,
    SelectionOverlayLayer
} from './SelectionOverlayLayer';

type CanvasDocumentRendererProps = {
    document: DesignDocument;
    resolveAsset?: AssetResolver;
    className?: string;
    nodeRenderers?: Partial<NodeRendererRegistry>;
    selectedNodeId?: string | null;
    editingTextNodeId?: string | null;
    onNodePointerDown?: (nodeId: string) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onCanvasPointerDown?: () => void;
    renderSelectionOverlay?: boolean;
    zoom?: number;
};

const defaultAssetResolver: AssetResolver = (url) => url;

const px = (value: number) => `${value}px`;

const useIsomorphicLayoutEffect =
    typeof window === 'undefined' ? useEffect : useLayoutEffect;

const getDesignNodePathFromTarget = (
    target: EventTarget | null,
    rendererElement: HTMLElement
) => {
    if (!(target instanceof HTMLElement)) {
        return [];
    }

    const nodePath: string[] = [];
    let currentElement: HTMLElement | null = target;

    while (currentElement && currentElement !== rendererElement) {
        const nodeId = currentElement.dataset.designNodeId;

        if (nodeId) {
            nodePath.unshift(nodeId);
        }

        currentElement = currentElement.parentElement;
    }

    return nodePath;
};

export const CanvasDocumentRenderer = ({
    className,
    document,
    editingTextNodeId,
    nodeRenderers,
    resolveAsset = defaultAssetResolver,
    selectedNodeId,
    onNodePointerDown,
    onNodeDoubleClick,
    onCanvasPointerDown,
    renderSelectionOverlay = true,
    zoom = 1
}: CanvasDocumentRendererProps) => {
    const bounds = getTopLevelBounds(document.children);
    const rendererRef = useRef<HTMLDivElement>(null);
    const doubleClickTargetRef = useRef<DoubleClickSelectionTarget | null>(
        null
    );
    const selectedNodeIds = useMemo(
        () => (selectedNodeId ? [selectedNodeId] : []),
        [selectedNodeId]
    );
    const selectedNodeIdSet = useMemo(
        () => new Set(selectedNodeIds),
        [selectedNodeIds]
    );
    const fallbackSelectionBounds = useMemo(
        () =>
            getSelectionOverlayBounds({
                nodes: document.children,
                parentLayout: 'absolute',
                parentOffset: {
                    x: -bounds.x,
                    y: -bounds.y
                },
                selectedNodeIds: selectedNodeIdSet
            }),
        [bounds.x, bounds.y, document.children, selectedNodeIdSet]
    );
    const selectionKey = selectedNodeIds.join('\u001f');
    const [measuredSelectionBounds, setMeasuredSelectionBounds] = useState<{
        selectionKey: string;
        bounds: SelectionOverlayBounds[];
    } | null>(null);
    const rendererRegistry = {
        ...defaultNodeRenderers,
        ...nodeRenderers
    };
    const selectedNodePath = useMemo(
        () =>
            selectedNodeId
                ? findDesignNodePathById(document.children, selectedNodeId)
                : null,
        [document.children, selectedNodeId]
    );
    const selectionBounds =
        measuredSelectionBounds?.selectionKey === selectionKey
            ? measuredSelectionBounds.bounds
            : fallbackSelectionBounds;

    useIsomorphicLayoutEffect(() => {
        const rendererElement = rendererRef.current;

        if (!rendererElement || selectedNodeIds.length === 0) {
            setMeasuredSelectionBounds({
                selectionKey,
                bounds: []
            });
            return;
        }

        const rendererRect = rendererElement.getBoundingClientRect();
        const rendererWidth =
            Number.parseFloat(rendererElement.style.width) ||
            rendererElement.offsetWidth ||
            rendererRect.width;
        const rendererHeight =
            Number.parseFloat(rendererElement.style.height) ||
            rendererElement.offsetHeight ||
            rendererRect.height;
        const scaleX =
            rendererWidth === 0 ? 1 : rendererRect.width / rendererWidth;
        const scaleY =
            rendererHeight === 0 ? 1 : rendererRect.height / rendererHeight;
        const nextMeasuredBounds = selectedNodeIds.flatMap((nodeId) => {
            const nodeElement = rendererElement.querySelector<HTMLElement>(
                `[data-design-node-id="${escapeDesignNodeSelectorValue(nodeId)}"]`
            );

            if (!nodeElement) {
                return [];
            }

            const nodeRect = nodeElement.getBoundingClientRect();

            return [
                {
                    nodeId,
                    x: (nodeRect.left - rendererRect.left) / scaleX,
                    y: (nodeRect.top - rendererRect.top) / scaleY,
                    width: nodeRect.width / scaleX,
                    height: nodeRect.height / scaleY
                }
            ];
        });
        const hasMeasurableBounds = nextMeasuredBounds.some(
            (nodeBounds) => nodeBounds.width > 0 || nodeBounds.height > 0
        );

        setMeasuredSelectionBounds({
            selectionKey,
            bounds: hasMeasurableBounds
                ? nextMeasuredBounds
                : fallbackSelectionBounds
        });
    }, [fallbackSelectionBounds, selectedNodeIds, selectionKey]);

    const handleRendererPointerDown = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        const rendererElement = rendererRef.current;

        if (!rendererElement) {
            return;
        }

        const nodePath = getDesignNodePathFromTarget(
            event.target,
            rendererElement
        );

        if (nodePath.length === 0) {
            doubleClickTargetRef.current = null;
            onCanvasPointerDown?.();
            return;
        }

        event.preventDefault();

        const deepestNodeId = nodePath.at(-1);

        doubleClickTargetRef.current = getNextDoubleClickSelectionTarget({
            clickCount: event.detail,
            currentTarget: doubleClickTargetRef.current,
            eventTimeStamp: event.timeStamp,
            nodeId: deepestNodeId,
            selectedNodeId
        });

        if (!onNodePointerDown) {
            return;
        }

        const nextSelectedNodeId = getNextSelectedNodeIdFromPath({
            nodePath,
            selectedNodeId,
            selectedNodePath,
            clickCount: event.detail
        });

        if (nextSelectedNodeId) {
            onNodePointerDown?.(nextSelectedNodeId);
        }
    };

    const handleRendererDoubleClick = (
        event: ReactMouseEvent<HTMLDivElement>
    ) => {
        const rendererElement = rendererRef.current;

        if (!rendererElement || !onNodeDoubleClick) {
            return;
        }

        const nodePath = getDesignNodePathFromTarget(
            event.target,
            rendererElement
        );

        if (nodePath.length === 0) {
            return;
        }

        const nextSelectedNodeId = getNextSelectedNodeIdFromPath({
            nodePath,
            selectedNodeId,
            selectedNodePath,
            clickCount: 2
        });

        if (nextSelectedNodeId) {
            const doubleClickTarget = doubleClickTargetRef.current;

            if (
                doubleClickTarget?.nodeId === nextSelectedNodeId &&
                doubleClickTarget.wasSelectedAtSequenceStart
            ) {
                onNodeDoubleClick(nextSelectedNodeId);
            }
        }
    };

    return (
        <div
            ref={rendererRef}
            className={['editor-document-renderer relative', className]
                .filter(Boolean)
                .join(' ')}
            data-document-renderer="true"
            onDoubleClick={handleRendererDoubleClick}
            onPointerDown={handleRendererPointerDown}
            style={{
                width: px(bounds.width),
                height: px(bounds.height),
                userSelect: 'none'
            }}
        >
            {document.children.map((node) => (
                <CanvasRenderNode
                    key={node.id}
                    editingTextNodeId={editingTextNodeId}
                    node={node}
                    nodeRenderers={rendererRegistry}
                    onNodePointerDown={onNodePointerDown}
                    parentLayout="absolute"
                    resolveAsset={resolveAsset}
                    selectedNodeId={selectedNodeId}
                    topLevelBounds={bounds}
                    variables={document.variables}
                />
            ))}
            {renderSelectionOverlay ? (
                <SelectionOverlayLayer
                    selectionBounds={selectionBounds}
                    zoom={zoom}
                />
            ) : null}
        </div>
    );
};
