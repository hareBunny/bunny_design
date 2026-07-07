/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    type CSSProperties,
    type KeyboardEvent as ReactKeyboardEvent,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import {
    CanvasRuler,
    CanvasRulerCorner,
    DEFAULT_RULER_THICKNESS
} from '@miaoma-design-ai/miaoma-canvas-ruler';
import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';
import type {
    CanvasToolId,
    HitPathNode,
    InteractionPointerPayload
} from '@miaoma-design-ai/miaoma-editor-interaction';

import { CanvasDocumentRenderer } from '../document/CanvasDocumentRenderer';
import { getTopLevelBounds } from '../document/CanvasNodeRenderers';
import {
    type DoubleClickSelectionTarget,
    findDesignNodePathById,
    getNextDoubleClickSelectionTarget,
    getNextSelectedNodeIdFromPath
} from '../document/documentSelectionUtils';

import { CanvasCreationOverlay } from './creation/CanvasCreationOverlay';
import { CanvasInlineTextEditor } from './creation/CanvasInlineTextEditor';
import { DEFAULT_INITIAL_ZOOM, ZOOM_PRESETS } from './viewport/constants';
import {
    extractDesignNodePath,
    findNodeRectInRenderer
} from './viewport/extractDesignNodePath';
import { useCanvasNodeDragGesture } from './viewport/useCanvasNodeDragGesture';
import { useShortcutWheelZoom } from './viewport/useShortcutWheelZoom';
import {
    measureViewportSelectionBounds,
    type ViewportSelectionBounds,
    ViewportSelectionOverlay
} from './viewport/ViewportSelectionOverlay';
import {
    applyScrollDelta,
    createCanvasViewportState,
    getAdjacentZoomPreset,
    getVisibleWorldRect,
    resizeViewport,
    screenToWorld,
    setViewportZoom,
    worldToScreen
} from './viewport/viewportState';
import { CanvasZoomControl } from './CanvasZoomControl';

type CanvasViewportShellProps = {
    document: MiaomaDesignDocument;
    activeTool: CanvasToolId;
    selectedNodeId?: string | null;
    textEditorState?: {
        nodeId: string;
        initialValue: string;
    } | null;
    creationDraft?: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    onNodePointerDown?: (nodeId: string) => void;
    onNodeDoubleClick?: (nodeId: string) => void;
    onCanvasPointerDown?: () => void;
    onViewportPointerDown?: (payload: InteractionPointerPayload) => void;
    onViewportPointerMove?: (payload: InteractionPointerPayload) => void;
    onViewportPointerUp?: (payload: InteractionPointerPayload) => void;
    onTextCommit?: (value: string) => void;
    onTextCancel?: () => void;
    selectionEnabled?: boolean;
    resolveAsset: (url: string) => string;
    overlay?: ReactNode;
};

const INITIAL_VIEWPORT_WIDTH = 1200;
const INITIAL_VIEWPORT_HEIGHT = 800;
const useIsomorphicLayoutEffect =
    typeof window === 'undefined' ? useEffect : useLayoutEffect;

const isInteractiveViewportTarget = (target: HTMLElement) =>
    target.closest(
        'button,input,textarea,select,[role="button"],[role="checkbox"],[role="tab"]'
    ) !== null;

const isSpaceKey = (event: Pick<KeyboardEvent, 'code' | 'key'>) =>
    event.code === 'Space' || event.key === ' ';

const escapeDesignNodeSelectorValue = (value: string) =>
    value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

type InlineTextEditorLayout = {
    left: number;
    top: number;
    width: number;
    height: number;
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    lineHeight?: number;
    textAlign?: CSSProperties['textAlign'];
};

type ViewportPointerSession = {
    clickCount: number;
    pointerId: number;
    tool: CanvasToolId;
    nodePath: HitPathNode[];
    originScreen: {
        x: number;
        y: number;
    };
    selectedNodeId: string | null;
    selectedNodePath: string[] | null;
    moved: boolean;
};

const buildNodeLookup = (document: MiaomaDesignDocument) => {
    const entries = new Map<
        string,
        Pick<HitPathNode, 'id' | 'layout' | 'type'>
    >();

    const visit = (nodes: MiaomaDesignDocument['children']) => {
        nodes.forEach((node) => {
            entries.set(node.id, {
                id: node.id,
                layout: node.type === 'frame' ? node.layout : undefined,
                type: node.type
            });

            if (node.type === 'frame') {
                visit(node.children);
            }
        });
    };

    visit(document.children);

    return entries;
};

export const CanvasViewportShell = ({
    document,
    activeTool,
    selectedNodeId,
    textEditorState,
    creationDraft,
    onNodePointerDown,
    onNodeDoubleClick,
    onCanvasPointerDown,
    onViewportPointerDown,
    onViewportPointerMove,
    onViewportPointerUp,
    onTextCommit,
    onTextCancel,
    selectionEnabled = true,
    resolveAsset,
    overlay
}: CanvasViewportShellProps) => {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState(() =>
        createCanvasViewportState({
            viewportWidth: INITIAL_VIEWPORT_WIDTH,
            viewportHeight: INITIAL_VIEWPORT_HEIGHT,
            initialZoom: DEFAULT_INITIAL_ZOOM
        })
    );
    const [selectionBounds, setSelectionBounds] =
        useState<ViewportSelectionBounds | null>(null);
    const [textEditorLayout, setTextEditorLayout] =
        useState<InlineTextEditorLayout | null>(null);
    const [isDraggingSelection, setIsDraggingSelection] = useState(false);
    const [isSpacePanActive, setIsSpacePanActive] = useState(false);
    const [isPanningViewport, setIsPanningViewport] = useState(false);
    const lastDocumentPointerPayloadRef =
        useRef<InteractionPointerPayload | null>(null);
    const pointerSessionRef = useRef<ViewportPointerSession | null>(null);
    const doubleClickTargetRef = useRef<DoubleClickSelectionTarget | null>(
        null
    );
    const panSessionRef = useRef<{
        pointerId: number;
        startScreenX: number;
        startScreenY: number;
        startScrollLeft: number;
        startScrollTop: number;
    } | null>(null);
    const consumeShortcutWheelScrollLock = useShortcutWheelZoom({
        scrollRef,
        setState
    });
    const nodeLookup = useMemo(() => buildNodeLookup(document), [document]);
    const documentBounds = useMemo(
        () => getTopLevelBounds(document.children),
        [document.children]
    );
    const selectedNodePath = useMemo(
        () =>
            selectedNodeId
                ? findDesignNodePathById(document.children, selectedNodeId)
                : null,
        [document.children, selectedNodeId]
    );
    const selectedNodeHitPath = useMemo(() => {
        if (!selectedNodePath) {
            return null;
        }

        const hitPath = selectedNodePath
            .map((nodeId) => nodeLookup.get(nodeId))
            .filter((node): node is HitPathNode => node !== undefined);

        return hitPath.length === selectedNodePath.length ? hitPath : null;
    }, [nodeLookup, selectedNodePath]);
    const selectedNodeWorldRect = useMemo(
        () =>
            selectedNodeId
                ? findNodeRectInRenderer(document, selectedNodeId)
                : null,
        [document, selectedNodeId]
    );
    const isPanMode = activeTool === 'hand' || isSpacePanActive;
    const isSelectionEnabled = selectionEnabled && !isPanMode;

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        const syncViewportSize = () => {
            setState((previous) =>
                resizeViewport(
                    previous,
                    element.clientWidth,
                    element.clientHeight
                )
            );
        };

        syncViewportSize();

        const resizeObserver = new ResizeObserver(() => {
            syncViewportSize();
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const resetPanState = () => {
            pointerSessionRef.current = null;
            panSessionRef.current = null;
            setIsDraggingSelection(false);
            setIsPanningViewport(false);
            setIsSpacePanActive(false);
        };

        window.addEventListener('blur', resetPanState);

        return () => {
            window.removeEventListener('blur', resetPanState);
        };
    }, []);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        element.scrollLeft = state.scrollLeft;
        element.scrollTop = state.scrollTop;
    }, [state.scrollLeft, state.scrollTop]);

    const visibleWorldRect = useMemo(() => getVisibleWorldRect(state), [state]);

    useIsomorphicLayoutEffect(() => {
        const element = scrollRef.current;

        if (!element || !selectedNodeId || isDraggingSelection) {
            setSelectionBounds(null);
            return;
        }

        setSelectionBounds(
            measureViewportSelectionBounds({
                scrollElement: element,
                selectedNodeId,
                zoom: state.zoom
            })
        );
    }, [
        document,
        isDraggingSelection,
        selectedNodeId,
        state.cameraX,
        state.cameraY,
        state.scrollLeft,
        state.scrollTop,
        state.zoom
    ]);

    useIsomorphicLayoutEffect(() => {
        const element = scrollRef.current;

        if (!element || !textEditorState) {
            setTextEditorLayout(null);
            return;
        }

        const nodeElement = element.querySelector<HTMLElement>(
            `[data-design-node-id="${escapeDesignNodeSelectorValue(
                textEditorState.nodeId
            )}"]`
        );

        if (!nodeElement) {
            setTextEditorLayout(null);
            return;
        }

        const scrollRect = element.getBoundingClientRect();
        const nodeRect = nodeElement.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(nodeElement);
        const fontSize = Number.parseFloat(computedStyle.fontSize) || 16;
        const parsedLineHeight = Number.parseFloat(computedStyle.lineHeight);
        const lineHeight = Number.isFinite(parsedLineHeight)
            ? parsedLineHeight
            : fontSize * 1.5;

        setTextEditorLayout({
            color: computedStyle.color || undefined,
            fontFamily: computedStyle.fontFamily || undefined,
            fontSize,
            fontWeight: computedStyle.fontWeight || undefined,
            height: Math.max(nodeRect.height, lineHeight),
            left: nodeRect.left - scrollRect.left + element.scrollLeft,
            lineHeight,
            textAlign: computedStyle.textAlign as CSSProperties['textAlign'],
            top: nodeRect.top - scrollRect.top + element.scrollTop,
            width: Math.max(nodeRect.width, fontSize * 4)
        });
    }, [
        document,
        state.cameraX,
        state.cameraY,
        state.scrollLeft,
        state.scrollTop,
        state.zoom,
        textEditorState
    ]);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        if (consumeShortcutWheelScrollLock(element)) {
            return;
        }

        setState((previous) =>
            applyScrollDelta(previous, {
                x: element.scrollLeft - previous.scrollLeft,
                y: element.scrollTop - previous.scrollTop
            })
        );
    };

    const syncViewportScroll = (
        nextScrollLeft: number,
        nextScrollTop: number
    ) => {
        const element = scrollRef.current;

        if (!element) {
            return;
        }

        element.scrollLeft = nextScrollLeft;
        element.scrollTop = nextScrollTop;
        setState((previous) =>
            applyScrollDelta(previous, {
                x: element.scrollLeft - previous.scrollLeft,
                y: element.scrollTop - previous.scrollTop
            })
        );
    };

    const buildPointerPayloadFromClientPoint = ({
        button,
        clientX,
        clientY,
        nodePath,
        target
    }: {
        button: number;
        clientX: number;
        clientY: number;
        target: EventTarget | null;
        nodePath?: HitPathNode[];
    }): InteractionPointerPayload | null => {
        const viewportElement = scrollRef.current;

        if (!viewportElement) {
            return null;
        }

        const rect = viewportElement.getBoundingClientRect();
        const worldPoint = screenToWorld(state, {
            x: clientX - rect.left,
            y: clientY - rect.top
        });
        const shouldResolveNodePath =
            nodePath !== undefined ||
            (target instanceof HTMLElement &&
                target.closest('[data-document-renderer="true"]') !== null);
        const nextNodePath: HitPathNode[] =
            nodePath ??
            (shouldResolveNodePath
                ? extractDesignNodePath({
                      document,
                      lookup: nodeLookup,
                      rendererRoot: viewportElement,
                      target,
                      worldX: worldPoint.x,
                      worldY: worldPoint.y
                  })
                : []);

        return {
            button,
            nodePath: nextNodePath,
            screenX: clientX,
            screenY: clientY,
            worldX: worldPoint.x,
            worldY: worldPoint.y
        };
    };

    const buildPointerPayload = (
        event: ReactPointerEvent<HTMLDivElement>,
        options?: {
            nodePath?: HitPathNode[];
        }
    ): InteractionPointerPayload | null =>
        buildPointerPayloadFromClientPoint({
            button: event.button,
            clientX: event.clientX,
            clientY: event.clientY,
            nodePath: options?.nodePath,
            target: event.target
        });

    const commitPointerClickSelection = (
        pointerSession: ViewportPointerSession
    ) => {
        if (!isSelectionEnabled) {
            return;
        }

        if (pointerSession.nodePath.length === 0) {
            onCanvasPointerDown?.();
            return;
        }

        const nextSelectedNodeId = getNextSelectedNodeIdFromPath({
            clickCount: pointerSession.clickCount,
            nodePath: pointerSession.nodePath.map((node) => node.id),
            selectedNodeId: pointerSession.selectedNodeId,
            selectedNodePath: pointerSession.selectedNodePath
        });

        if (nextSelectedNodeId) {
            onNodePointerDown?.(nextSelectedNodeId);
        }
    };

    const markPointerSessionMoved = () => {
        if (pointerSessionRef.current) {
            pointerSessionRef.current.moved = true;
        }
    };

    const handleNodeDragGestureStart = (payload: InteractionPointerPayload) => {
        markPointerSessionMoved();
        onViewportPointerDown?.(payload);
    };

    useCanvasNodeDragGesture({
        activeTool,
        buildPointerPayloadFromClientPoint,
        isSelectionEnabled,
        onDragStateChange: setIsDraggingSelection,
        selectedNodeHitPath,
        selectedNodePath,
        selectedNodeWorldRect,
        onViewportPointerDown: handleNodeDragGestureStart,
        onViewportPointerUp,
        scrollRef,
        selectedNodeId,
        zoom: state.zoom
    });

    const handleViewportPointerDown = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (event.button !== 0 || !(event.target instanceof HTMLElement)) {
            return;
        }

        if (isInteractiveViewportTarget(event.target)) {
            return;
        }

        event.currentTarget.focus();

        if (
            activeTool !== 'pointer' &&
            typeof event.currentTarget.setPointerCapture === 'function'
        ) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        if (isPanMode) {
            event.preventDefault();
            panSessionRef.current = {
                pointerId: event.pointerId,
                startScreenX: event.clientX,
                startScreenY: event.clientY,
                startScrollLeft: event.currentTarget.scrollLeft,
                startScrollTop: event.currentTarget.scrollTop
            };
            setIsPanningViewport(true);
            return;
        }

        const payload = buildPointerPayload(event);

        if (payload) {
            pointerSessionRef.current = {
                clickCount: event.detail,
                pointerId: event.pointerId,
                tool: activeTool,
                nodePath: payload.nodePath,
                originScreen: {
                    x: event.clientX,
                    y: event.clientY
                },
                selectedNodeId: selectedNodeId ?? null,
                selectedNodePath,
                moved: false
            };
            lastDocumentPointerPayloadRef.current =
                payload.nodePath.length > 0 ? payload : null;

            const deepestNodeId = payload.nodePath.at(-1)?.id;

            doubleClickTargetRef.current = getNextDoubleClickSelectionTarget({
                clickCount: event.detail,
                currentTarget: doubleClickTargetRef.current,
                eventTimeStamp: event.timeStamp,
                nodeId: deepestNodeId,
                selectedNodeId
            });

            if (activeTool !== 'pointer') {
                onViewportPointerDown?.(payload);
            } else {
                return;
            }
        }

        if (event.target.closest('[data-document-renderer="true"]')) {
            return;
        }

        if (!selectionEnabled) {
            return;
        }

        onCanvasPointerDown?.();
    };

    const handleViewportPointerMove = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        if (isInteractiveViewportTarget(event.target)) {
            return;
        }

        const panSession = panSessionRef.current;
        const pointerSession = pointerSessionRef.current;

        if (panSession && panSession.pointerId === event.pointerId) {
            event.preventDefault();
            syncViewportScroll(
                panSession.startScrollLeft -
                    (event.clientX - panSession.startScreenX),
                panSession.startScrollTop -
                    (event.clientY - panSession.startScreenY)
            );
            return;
        }

        if (pointerSession && pointerSession.pointerId === event.pointerId) {
            const distance = Math.hypot(
                event.clientX - pointerSession.originScreen.x,
                event.clientY - pointerSession.originScreen.y
            );

            if (distance > 4) {
                pointerSession.moved = true;
                event.preventDefault();
            }

            if (pointerSession.tool === 'pointer') {
                return;
            }

            if (activeTool === 'pointer') {
                return;
            }

            const payload = buildPointerPayload(event, {
                nodePath: pointerSession.nodePath
            });

            if (payload) {
                onViewportPointerMove?.(payload);
            }

            return;
        }

        if (activeTool === 'pointer') {
            return;
        }

        const payload = buildPointerPayload(event);

        if (payload) {
            onViewportPointerMove?.(payload);
        }
    };

    const handleViewportPointerUp = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        if (isInteractiveViewportTarget(event.target)) {
            return;
        }

        const panSession = panSessionRef.current;
        const pointerSession = pointerSessionRef.current;

        if (panSession && panSession.pointerId === event.pointerId) {
            panSessionRef.current = null;
            setIsPanningViewport(false);

            if (
                typeof event.currentTarget.releasePointerCapture ===
                    'function' &&
                (typeof event.currentTarget.hasPointerCapture !== 'function' ||
                    event.currentTarget.hasPointerCapture(event.pointerId))
            ) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }

            return;
        }

        if (pointerSession && pointerSession.pointerId === event.pointerId) {
            pointerSessionRef.current = null;

            if (pointerSession.moved) {
                event.preventDefault();
            }

            if (pointerSession.tool === 'pointer') {
                if (!pointerSession.moved) {
                    commitPointerClickSelection(pointerSession);
                }

                return;
            }

            if (activeTool === 'pointer') {
                return;
            }

            const payload = buildPointerPayload(event, {
                nodePath: pointerSession.nodePath
            });

            if (payload) {
                onViewportPointerUp?.(payload);
            }

            if (
                typeof event.currentTarget.releasePointerCapture ===
                    'function' &&
                (typeof event.currentTarget.hasPointerCapture !== 'function' ||
                    event.currentTarget.hasPointerCapture(event.pointerId))
            ) {
                event.currentTarget.releasePointerCapture(event.pointerId);
            }

            return;
        }

        if (activeTool === 'pointer') {
            return;
        }

        const payload = buildPointerPayload(event);

        if (payload) {
            onViewportPointerUp?.(payload);
        }

        if (
            typeof event.currentTarget.releasePointerCapture === 'function' &&
            (typeof event.currentTarget.hasPointerCapture !== 'function' ||
                event.currentTarget.hasPointerCapture(event.pointerId))
        ) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleViewportDoubleClick = (
        event: ReactMouseEvent<HTMLDivElement>
    ) => {
        if (
            !isSelectionEnabled ||
            !onNodeDoubleClick ||
            !(event.target instanceof HTMLElement)
        ) {
            return;
        }

        if (isInteractiveViewportTarget(event.target)) {
            return;
        }

        const nextSelectedNodeId =
            lastDocumentPointerPayloadRef.current?.nodePath.at(-1)?.id;

        const doubleClickTarget = doubleClickTargetRef.current;

        if (
            nextSelectedNodeId &&
            doubleClickTarget?.nodeId === nextSelectedNodeId &&
            doubleClickTarget.wasSelectedAtSequenceStart
        ) {
            onNodeDoubleClick(nextSelectedNodeId);
        }
    };

    const handleViewportKeyDown = (
        event: ReactKeyboardEvent<HTMLDivElement>
    ) => {
        if (!isSpaceKey(event)) {
            return;
        }

        if (
            event.target instanceof HTMLElement &&
            isInteractiveViewportTarget(event.target)
        ) {
            return;
        }

        event.preventDefault();

        if (!isSpacePanActive) {
            setIsSpacePanActive(true);
        }
    };

    const handleViewportKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (!isSpaceKey(event)) {
            return;
        }

        event.preventDefault();
        panSessionRef.current = null;
        pointerSessionRef.current = null;
        setIsDraggingSelection(false);
        setIsPanningViewport(false);
        setIsSpacePanActive(false);
    };

    const surfaceStyle = {
        left: `${state.scrollLeft}px`,
        top: `${state.scrollTop}px`,
        transform: `translate(${-state.cameraX * state.zoom}px, ${-state.cameraY * state.zoom}px) scale(${state.zoom})`,
        transformOrigin: 'top left'
    } as const;
    const creationOverlayBounds = creationDraft
        ? (() => {
              const topLeft = worldToScreen(state, {
                  x: creationDraft.x,
                  y: creationDraft.y
              });
              const bottomRight = worldToScreen(state, {
                  x: creationDraft.x + creationDraft.width,
                  y: creationDraft.y + creationDraft.height
              });

              return {
                  height: Math.max(0, bottomRight.y - topLeft.y),
                  left: state.scrollLeft + topLeft.x,
                  top: state.scrollTop + topLeft.y,
                  width: Math.max(0, bottomRight.x - topLeft.x)
              };
          })()
        : null;

    return (
        <div
            className="editor-viewport-shell relative h-full w-full"
            data-region="canvas-viewport"
        >
            <div className="absolute top-0 left-0 z-20">
                <CanvasRulerCorner thickness={DEFAULT_RULER_THICKNESS} />
            </div>
            <div className="absolute top-0 left-[var(--editor-ruler-thickness)] right-0 z-20">
                <CanvasRuler
                    axis="horizontal"
                    viewportSize={state.viewportWidth}
                    worldEnd={visibleWorldRect.x + visibleWorldRect.width}
                    worldStart={visibleWorldRect.x}
                    zoom={state.zoom}
                />
            </div>
            <div className="absolute top-[var(--editor-ruler-thickness)] left-0 bottom-0 z-20">
                <CanvasRuler
                    axis="vertical"
                    viewportSize={state.viewportHeight}
                    worldEnd={visibleWorldRect.y + visibleWorldRect.height}
                    worldStart={visibleWorldRect.y}
                    zoom={state.zoom}
                />
            </div>
            <div
                aria-label="Canvas viewport"
                className={[
                    'absolute top-[var(--editor-ruler-thickness)] right-0 bottom-0 left-[var(--editor-ruler-thickness)] overflow-scroll outline-none',
                    isPanningViewport
                        ? 'cursor-grabbing'
                        : isPanMode
                          ? 'cursor-grab'
                          : 'cursor-default'
                ].join(' ')}
                onDoubleClick={handleViewportDoubleClick}
                onKeyDown={handleViewportKeyDown}
                onKeyUp={handleViewportKeyUp}
                onPointerDown={handleViewportPointerDown}
                onPointerMove={handleViewportPointerMove}
                onPointerUp={handleViewportPointerUp}
                onScroll={handleScroll}
                ref={scrollRef}
                tabIndex={0}
            >
                <div
                    className="relative"
                    style={{
                        width: `${state.travelZoneWidth}px`,
                        height: `${state.travelZoneHeight}px`
                    }}
                >
                    <div
                        className="absolute"
                        data-region="canvas-world-surface"
                        style={surfaceStyle}
                    >
                        <div
                            className="absolute"
                            data-region="canvas-document-world-layer"
                            style={{
                                left: `${documentBounds.x}px`,
                                top: `${documentBounds.y}px`
                            }}
                        >
                            <CanvasDocumentRenderer
                                document={document}
                                editingTextNodeId={textEditorState?.nodeId}
                                onCanvasPointerDown={undefined}
                                onNodeDoubleClick={undefined}
                                onNodePointerDown={undefined}
                                renderSelectionOverlay={false}
                                resolveAsset={resolveAsset}
                                selectedNodeId={selectedNodeId}
                                zoom={state.zoom}
                            />
                        </div>
                    </div>
                    {!isDraggingSelection && selectionBounds ? (
                        <div
                            aria-hidden="true"
                            className="editor-viewport-selection-layer absolute inset-0 z-20 overflow-visible"
                            data-viewport-selection-layer="true"
                            style={{ pointerEvents: 'none' }}
                        >
                            <ViewportSelectionOverlay
                                bounds={selectionBounds}
                            />
                        </div>
                    ) : null}
                    {creationOverlayBounds ? (
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 z-20 overflow-visible"
                        >
                            <CanvasCreationOverlay
                                bounds={creationOverlayBounds}
                            />
                        </div>
                    ) : null}
                    {textEditorState &&
                    textEditorLayout &&
                    onTextCommit &&
                    onTextCancel ? (
                        <div className="absolute inset-0 z-40 overflow-visible">
                            <CanvasInlineTextEditor
                                initialValue={textEditorState.initialValue}
                                layout={textEditorLayout}
                                onCancel={onTextCancel}
                                onCommit={onTextCommit}
                            />
                        </div>
                    ) : null}
                    {overlay ? (
                        <div className="pointer-events-none absolute inset-0 z-30">
                            {overlay}
                        </div>
                    ) : null}
                </div>
            </div>
            <CanvasZoomControl
                onZoomIn={() =>
                    setState((previous) =>
                        setViewportZoom(
                            previous,
                            getAdjacentZoomPreset(
                                previous.zoom,
                                ZOOM_PRESETS,
                                1
                            ),
                            {
                                x: previous.viewportWidth / 2,
                                y: previous.viewportHeight / 2
                            }
                        )
                    )
                }
                onZoomOut={() =>
                    setState((previous) =>
                        setViewportZoom(
                            previous,
                            getAdjacentZoomPreset(
                                previous.zoom,
                                ZOOM_PRESETS,
                                -1
                            ),
                            {
                                x: previous.viewportWidth / 2,
                                y: previous.viewportHeight / 2
                            }
                        )
                    )
                }
                zoom={state.zoom}
            />
        </div>
    );
};
