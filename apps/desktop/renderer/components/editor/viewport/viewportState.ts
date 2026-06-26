/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    DEFAULT_INITIAL_ZOOM,
    DEFAULT_MAX_ZOOM,
    DEFAULT_MIN_ZOOM,
    DEFAULT_TRAVEL_ZONE_HEIGHT,
    DEFAULT_TRAVEL_ZONE_WIDTH
} from './constants';
import type {
    CanvasViewportState,
    CreateCanvasViewportStateOptions,
    ViewportPoint,
    ViewportRect
} from './types';

const clampZoom = (value: number, minZoom: number, maxZoom: number) =>
    Math.min(maxZoom, Math.max(minZoom, value));

const createAnchorScroll = (travelZoneSize: number, viewportSize: number) =>
    (travelZoneSize - viewportSize) / 2;

const shouldRecenter = (
    scrollValue: number,
    viewportSize: number,
    travelZoneSize: number
) => {
    const threshold = viewportSize;

    return (
        scrollValue < threshold ||
        scrollValue > travelZoneSize - viewportSize - threshold
    );
};

export const createCanvasViewportState = ({
    viewportWidth,
    viewportHeight,
    initialCameraX = 0,
    initialCameraY = 0,
    initialZoom = DEFAULT_INITIAL_ZOOM,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    travelZoneWidth = DEFAULT_TRAVEL_ZONE_WIDTH,
    travelZoneHeight = DEFAULT_TRAVEL_ZONE_HEIGHT
}: CreateCanvasViewportStateOptions): CanvasViewportState => {
    const zoom = clampZoom(initialZoom, minZoom, maxZoom);
    const anchorScrollLeft = createAnchorScroll(travelZoneWidth, viewportWidth);
    const anchorScrollTop = createAnchorScroll(
        travelZoneHeight,
        viewportHeight
    );

    return {
        zoom,
        minZoom,
        maxZoom,
        cameraX: initialCameraX,
        cameraY: initialCameraY,
        viewportWidth,
        viewportHeight,
        travelZoneWidth,
        travelZoneHeight,
        scrollLeft: anchorScrollLeft,
        scrollTop: anchorScrollTop,
        anchorScrollLeft,
        anchorScrollTop
    };
};

export const getVisibleWorldRect = (
    state: CanvasViewportState
): ViewportRect => ({
    x: state.cameraX,
    y: state.cameraY,
    width: state.viewportWidth / state.zoom,
    height: state.viewportHeight / state.zoom
});

export const screenToWorld = (
    state: CanvasViewportState,
    point: ViewportPoint
): ViewportPoint => ({
    x: state.cameraX + point.x / state.zoom,
    y: state.cameraY + point.y / state.zoom
});

export const worldToScreen = (
    state: CanvasViewportState,
    point: ViewportPoint
): ViewportPoint => ({
    x: (point.x - state.cameraX) * state.zoom,
    y: (point.y - state.cameraY) * state.zoom
});

export const resizeViewport = (
    state: CanvasViewportState,
    viewportWidth: number,
    viewportHeight: number
): CanvasViewportState => {
    if (
        state.viewportWidth === viewportWidth &&
        state.viewportHeight === viewportHeight
    ) {
        return state;
    }

    const anchorScrollLeft = createAnchorScroll(
        state.travelZoneWidth,
        viewportWidth
    );
    const anchorScrollTop = createAnchorScroll(
        state.travelZoneHeight,
        viewportHeight
    );
    const scrollLeft =
        state.scrollLeft + (anchorScrollLeft - state.anchorScrollLeft);
    const scrollTop =
        state.scrollTop + (anchorScrollTop - state.anchorScrollTop);

    return {
        ...state,
        viewportWidth,
        viewportHeight,
        anchorScrollLeft,
        anchorScrollTop,
        scrollLeft,
        scrollTop
    };
};

export const applyScrollDelta = (
    state: CanvasViewportState,
    delta: ViewportPoint
): CanvasViewportState => {
    const scrollLeft = state.scrollLeft + delta.x;
    const scrollTop = state.scrollTop + delta.y;
    const next: CanvasViewportState = {
        ...state,
        cameraX: state.cameraX + delta.x / state.zoom,
        cameraY: state.cameraY + delta.y / state.zoom,
        scrollLeft,
        scrollTop
    };

    return {
        ...next,
        scrollLeft: shouldRecenter(
            next.scrollLeft,
            state.viewportWidth,
            state.travelZoneWidth
        )
            ? state.anchorScrollLeft
            : next.scrollLeft,
        scrollTop: shouldRecenter(
            next.scrollTop,
            state.viewportHeight,
            state.travelZoneHeight
        )
            ? state.anchorScrollTop
            : next.scrollTop
    };
};

export const getAdjacentZoomPreset = (
    zoom: number,
    presets: number[],
    direction: 1 | -1
) => {
    const ordered = [...presets].sort((left, right) => left - right);

    if (direction === 1) {
        return ordered.find((value) => value > zoom) ?? ordered.at(-1) ?? zoom;
    }

    return (
        [...ordered].reverse().find((value) => value < zoom) ??
        ordered[0] ??
        zoom
    );
};

export const setViewportZoom = (
    state: CanvasViewportState,
    nextZoom: number,
    anchor: ViewportPoint
): CanvasViewportState => {
    const zoom = clampZoom(nextZoom, state.minZoom, state.maxZoom);
    const worldAnchor = screenToWorld(state, anchor);

    return {
        ...state,
        zoom,
        cameraX: worldAnchor.x - anchor.x / zoom,
        cameraY: worldAnchor.y - anchor.y / zoom
    };
};
