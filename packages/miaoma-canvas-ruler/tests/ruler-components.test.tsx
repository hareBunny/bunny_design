/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CanvasRuler, CanvasRulerCorner } from '../src';

const rulerStyles = () =>
    readFileSync(
        fileURLToPath(new URL('../src/styles/ruler.css', import.meta.url)),
        'utf8'
    );

describe('CanvasRuler', () => {
    it('renders a horizontal ruler with tick labels', () => {
        const markup = renderToStaticMarkup(
            <CanvasRuler
                axis="horizontal"
                zoom={1}
                viewportSize={320}
                worldStart={0}
                worldEnd={320}
            />
        );

        expect(markup).toContain('data-canvas-ruler-axis="horizontal"');
        expect(markup).toContain('aria-label="Horizontal ruler"');
        expect(markup).toContain('data-ruler-tick-level="major"');
        expect(markup).toContain('data-ruler-tick-mark="true"');
        expect(markup).toContain(
            'miaoma-canvas-ruler__label miaoma-canvas-ruler__label--horizontal'
        );
        expect(markup).toContain('>0<');
    });

    it('renders a vertical ruler and a fixed-size corner block', () => {
        const rulerMarkup = renderToStaticMarkup(
            <CanvasRuler
                axis="vertical"
                zoom={1}
                viewportSize={240}
                worldStart={-120}
                worldEnd={120}
            />
        );
        const cornerMarkup = renderToStaticMarkup(
            <CanvasRulerCorner thickness={24} />
        );

        expect(rulerMarkup).toContain('data-canvas-ruler-axis="vertical"');
        expect(rulerMarkup).toContain('aria-label="Vertical ruler"');
        expect(rulerMarkup).toContain('data-ruler-tick-mark="true"');
        expect(rulerMarkup).toContain(
            'miaoma-canvas-ruler__label miaoma-canvas-ruler__label--vertical'
        );
        expect(cornerMarkup).toContain('data-canvas-ruler-corner="true"');
        expect(cornerMarkup).toContain('width:24px');
        expect(cornerMarkup).toContain('height:24px');
    });

    it('aligns horizontal labels to the tick end and shifts vertical labels left of the tick line', () => {
        const styles = rulerStyles();

        expect(styles).toContain('.miaoma-canvas-ruler__label--horizontal');
        expect(styles).toContain('left: 50%;');
        expect(styles).toContain('transform: translateX(-50%);');
        expect(styles).toContain('.miaoma-canvas-ruler__label {');
        expect(styles).toContain('top: 3px;');
        expect(styles).toContain(`.miaoma-canvas-ruler__label--vertical {
    top: 50%;
    left: 0;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: center center;
}`);
    });
});
