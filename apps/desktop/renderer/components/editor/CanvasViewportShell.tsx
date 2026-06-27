/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
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

import { CanvasDocumentRenderer } from '../document/CanvasDocumentRenderer';

import { DEFAULT_INITIAL_ZOOM, ZOOM_PRESETS } from './viewport/constants';
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
    setViewportZoom
} from './viewport/viewportState';
import { CanvasZoomControl } from './CanvasZoomControl';

type CanvasViewportShellProps = {
    document: MiaomaDesignDocument;
    selectedNodeId?: string | null;
    onNodePointerDown?: (nodeId: string) => void;
    onCanvasPointerDown?: () => void;
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

export const CanvasViewportShell = ({
    document,
    selectedNodeId,
    onNodePointerDown,
    onCanvasPointerDown,
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
    const consumeShortcutWheelScrollLock = useShortcutWheelZoom({
        scrollRef,
        setState
    });

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

        if (!element || !selectedNodeId) {
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
        selectedNodeId,
        state.cameraX,
        state.cameraY,
        state.scrollLeft,
        state.scrollTop,
        state.zoom
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

    const handleViewportPointerDown = (
        event: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (event.button !== 0 || !(event.target instanceof HTMLElement)) {
            return;
        }

        if (
            event.target.closest('[data-document-renderer="true"]') ||
            isInteractiveViewportTarget(event.target)
        ) {
            return;
        }

        onCanvasPointerDown?.();
    };

    const surfaceStyle = {
        left: `${state.scrollLeft}px`,
        top: `${state.scrollTop}px`,
        transform: `translate(${-state.cameraX * state.zoom}px, ${-state.cameraY * state.zoom}px) scale(${state.zoom})`,
        transformOrigin: 'top left'
    } as const;

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
                className="absolute top-[var(--editor-ruler-thickness)] right-0 bottom-0 left-[var(--editor-ruler-thickness)] overflow-scroll"
                onPointerDown={handleViewportPointerDown}
                onScroll={handleScroll}
                ref={scrollRef}
            >
                <div
                    className="relative"
                    style={{
                        width: `${state.travelZoneWidth}px`,
                        height: `${state.travelZoneHeight}px`
                    }}
                >
                    <div className="absolute" style={surfaceStyle}>
                        <CanvasDocumentRenderer
                            document={document}
                            onCanvasPointerDown={onCanvasPointerDown}
                            onNodePointerDown={onNodePointerDown}
                            renderSelectionOverlay={false}
                            resolveAsset={resolveAsset}
                            selectedNodeId={selectedNodeId}
                            zoom={state.zoom}
                        />
                    </div>
                    {selectionBounds ? (
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
