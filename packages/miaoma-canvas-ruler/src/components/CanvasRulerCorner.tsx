/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import { DEFAULT_RULER_THICKNESS } from '../constants';

const joinClassName = (...values: (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

export const CanvasRulerCorner = ({
    thickness = DEFAULT_RULER_THICKNESS,
    className
}: {
    thickness?: number;
    className?: string;
}) => {
    const style: CSSProperties = {
        width: `${thickness}px`,
        height: `${thickness}px`
    };

    return (
        <div
            aria-hidden="true"
            className={joinClassName('miaoma-canvas-ruler-corner', className)}
            data-canvas-ruler-corner="true"
            style={style}
        />
    );
};
