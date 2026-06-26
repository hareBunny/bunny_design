/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type ViewportPoint = {
    x: number;
    y: number;
};

export type ViewportRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type CanvasViewportState = {
    zoom: number;
    minZoom: number;
    maxZoom: number;
    cameraX: number;
    cameraY: number;
    viewportWidth: number;
    viewportHeight: number;
    travelZoneWidth: number;
    travelZoneHeight: number;
    scrollLeft: number;
    scrollTop: number;
    anchorScrollLeft: number;
    anchorScrollTop: number;
};

export type CreateCanvasViewportStateOptions = {
    viewportWidth: number;
    viewportHeight: number;
    initialCameraX?: number;
    initialCameraY?: number;
    initialZoom?: number;
    minZoom?: number;
    maxZoom?: number;
    travelZoneWidth?: number;
    travelZoneHeight?: number;
};
