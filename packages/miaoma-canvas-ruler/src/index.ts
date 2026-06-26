/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import './styles/ruler.css';

export { CanvasRuler } from './components/CanvasRuler';
export { CanvasRulerCorner } from './components/CanvasRulerCorner';
export {
    DEFAULT_MIN_MAJOR_STEP_PX,
    DEFAULT_MINOR_DIVISIONS,
    DEFAULT_RULER_THICKNESS
} from './constants';
export { getRulerTicks } from './math/getRulerTicks';
export { pickRulerStep } from './math/pickRulerStep';
export { projectTickToViewport } from './math/projectTickToViewport';
export type {
    CanvasRulerProps,
    RulerAxis,
    RulerRenderOptions,
    RulerTick,
    RulerTickLevel
} from './types';
