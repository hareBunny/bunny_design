/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    applyScrollDelta,
    createCanvasViewportState,
    getVisibleWorldRect,
    resizeViewport,
    screenToWorld,
    setViewportZoom,
    worldToScreen
} from '../renderer/components/editor/viewport/viewportState';

describe('canvas viewport state', () => {
    it('derives visible world rect from camera and zoom', () => {
        const state = createCanvasViewportState({
            viewportWidth: 800,
            viewportHeight: 600,
            initialCameraX: 100,
            initialCameraY: 200
        });

        expect(getVisibleWorldRect(state)).toEqual({
            x: 100,
            y: 200,
            width: 800,
            height: 600
        });
    });

    it('keeps the anchor world point stable while zooming', () => {
        const initial = createCanvasViewportState({
            viewportWidth: 1000,
            viewportHeight: 700
        });
        const anchor = { x: 250, y: 175 };
        const before = screenToWorld(initial, anchor);
        const next = setViewportZoom(initial, 2, anchor);
        const after = screenToWorld(next, anchor);

        expect(after.x).toBeCloseTo(before.x, 6);
        expect(after.y).toBeCloseTo(before.y, 6);
        expect(worldToScreen(next, before)).toEqual(anchor);
    });

    it('reflows viewport dimensions while preserving the scroll offset from the anchor', () => {
        const initial = createCanvasViewportState({
            viewportWidth: 800,
            viewportHeight: 600,
            travelZoneWidth: 2000,
            travelZoneHeight: 1500
        });
        const panned = applyScrollDelta(initial, { x: 120, y: 80 });
        const next = resizeViewport(panned, 1000, 700);

        expect(next.viewportWidth).toBe(1000);
        expect(next.viewportHeight).toBe(700);
        expect(next.scrollLeft - next.anchorScrollLeft).toBe(
            panned.scrollLeft - panned.anchorScrollLeft
        );
        expect(next.scrollTop - next.anchorScrollTop).toBe(
            panned.scrollTop - panned.anchorScrollTop
        );
    });

    it('recenters the travel zone without changing camera continuity', () => {
        const state = createCanvasViewportState({
            viewportWidth: 400,
            viewportHeight: 300,
            travelZoneWidth: 1200,
            travelZoneHeight: 900
        });

        const next = applyScrollDelta(state, { x: 580, y: 0 });

        expect(next.cameraX).toBe(580);
        expect(next.scrollLeft).toBe(next.anchorScrollLeft);
    });
});
