/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

const formatZoomLabel = (zoom: number) => `${Math.round(zoom * 100)}%`;

type CanvasZoomControlProps = {
    zoom: number;
    onZoomIn(): void;
    onZoomOut(): void;
};

export const CanvasZoomControl = ({
    zoom,
    onZoomIn,
    onZoomOut
}: CanvasZoomControlProps) => (
    <div
        aria-label="Zoom controls"
        className="editor-zoom-control absolute right-8 bottom-4 z-30 grid h-10 w-[143px] grid-cols-[28px_1fr_28px] items-center rounded-[14px] border border-[#ececee] bg-white px-[18px] text-[14px] font-medium text-[#575a62] shadow-[0_4px_18px_#00000010]"
    >
        <button
            aria-label="Zoom out"
            className="grid h-7 w-7 place-items-center border-0 bg-transparent p-0 text-[22px] leading-none text-[#666971]"
            onClick={onZoomOut}
            type="button"
        >
            −
        </button>
        <span className="text-center">{formatZoomLabel(zoom)}</span>
        <button
            aria-label="Zoom in"
            className="grid h-7 w-7 place-items-center border-0 bg-transparent p-0 text-[22px] leading-none text-[#666971]"
            onClick={onZoomIn}
            type="button"
        >
            +
        </button>
    </div>
);
