/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

type CanvasCreationOverlayProps = {
    bounds: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
};

export const CanvasCreationOverlay = ({
    bounds
}: CanvasCreationOverlayProps) => (
    <div
        aria-hidden="true"
        className="absolute border border-[#4592FF] bg-transparent"
        data-region="canvas-creation-overlay"
        style={{
            left: `${bounds.left}px`,
            top: `${bounds.top}px`,
            width: `${bounds.width}px`,
            height: `${bounds.height}px`
        }}
    />
);
