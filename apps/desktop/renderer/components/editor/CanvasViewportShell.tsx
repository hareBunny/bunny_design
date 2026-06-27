/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    type ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
    type WheelEvent
} from 'react';

import {
    CanvasRuler,
    CanvasRulerCorner,
    DEFAULT_RULER_THICKNESS
} from '@miaoma-design-ai/miaoma-canvas-ruler';
import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import { CanvasDocumentRenderer } from '../document/CanvasDocumentRenderer';

import { DEFAULT_INITIAL_ZOOM, ZOOM_PRESETS } from './viewport/constants';
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

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        setState((previous) =>
            applyScrollDelta(previous, {
                x: element.scrollLeft - previous.scrollLeft,
                y: element.scrollTop - previous.scrollTop
            })
        );
    };

    const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (event.metaKey || event.ctrlKey) {
            event.preventDefault();
            const element = scrollRef.current;
            const rect = element?.getBoundingClientRect();
            const delta = event.deltaY < 0 ? 1.1 : 0.9;

            setState((previous) =>
                setViewportZoom(previous, previous.zoom * delta, {
                    x: rect
                        ? event.clientX - rect.left
                        : previous.viewportWidth / 2,
                    y: rect
                        ? event.clientY - rect.top
                        : previous.viewportHeight / 2
                })
            );
        }
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
                onScroll={handleScroll}
                onWheel={handleWheel}
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
                            resolveAsset={resolveAsset}
                            selectedNodeId={selectedNodeId}
                        />
                    </div>
                    {overlay ? (
                        <div className="absolute inset-0 z-30">{overlay}</div>
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
