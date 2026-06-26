/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import { DEFAULT_RULER_THICKNESS } from '../constants';
import { getRulerTicks } from '../math/getRulerTicks';
import type { CanvasRulerProps } from '../types';

const joinClassName = (...values: (string | undefined)[]) =>
    values.filter(Boolean).join(' ');

export const CanvasRuler = ({
    axis,
    zoom,
    viewportSize,
    worldStart,
    worldEnd,
    thickness = DEFAULT_RULER_THICKNESS,
    className
}: CanvasRulerProps) => {
    const ticks = getRulerTicks({
        axis,
        zoom,
        viewportSize,
        worldStart,
        worldEnd
    });
    const isHorizontal = axis === 'horizontal';
    const style: CSSProperties = isHorizontal
        ? { width: `${viewportSize}px`, height: `${thickness}px` }
        : { width: `${thickness}px`, height: `${viewportSize}px` };

    return (
        <div
            aria-label={isHorizontal ? 'Horizontal ruler' : 'Vertical ruler'}
            className={joinClassName('miaoma-canvas-ruler', className)}
            data-canvas-ruler-axis={axis}
            style={style}
        >
            {ticks.map((tick) => {
                const tickStyle: CSSProperties = isHorizontal
                    ? { left: `${tick.offset}px` }
                    : { top: `${tick.offset}px` };

                return (
                    <div
                        key={`${axis}-${tick.value}`}
                        className="miaoma-canvas-ruler__tick"
                        data-ruler-tick-level={tick.level}
                        style={tickStyle}
                    >
                        <span
                            aria-hidden="true"
                            className="miaoma-canvas-ruler__tick-mark"
                            data-ruler-tick-mark="true"
                        />
                        {tick.label ? (
                            <span
                                className={joinClassName(
                                    'miaoma-canvas-ruler__label',
                                    isHorizontal
                                        ? 'miaoma-canvas-ruler__label--horizontal'
                                        : 'miaoma-canvas-ruler__label--vertical'
                                )}
                            >
                                {tick.label}
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
};
