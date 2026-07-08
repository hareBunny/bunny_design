/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { CanvasDocumentRenderer } from '../renderer/components/document/CanvasDocumentRenderer';
import { CanvasViewportShell } from '../renderer/components/editor/CanvasViewportShell';

const selectionDocument: MiaomaDesignDocument = {
    version: '2.14',
    children: [
        {
            id: 'target-frame',
            type: 'frame',
            x: 20,
            y: 30,
            width: 100,
            height: 50,
            fill: {
                type: 'color',
                color: '#ffffff'
            },
            children: []
        }
    ]
};

const rotatedSelectionDocument: MiaomaDesignDocument = {
    version: '2.14',
    children: [
        {
            id: 'rotated-frame',
            type: 'frame',
            x: 20,
            y: 30,
            width: 100,
            height: 50,
            rotation: 90,
            fill: {
                type: 'color',
                color: '#ffffff'
            },
            children: []
        }
    ]
};

const domRect = ({
    height,
    left,
    top,
    width
}: {
    left: number;
    top: number;
    width: number;
    height: number;
}): DOMRect => ({
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({})
});

class TestResizeObserver {
    constructor() {}

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

describe('Canvas selection overlay', () => {
    const originalResizeObserver = globalThis.ResizeObserver;

    beforeEach(() => {
        globalThis.ResizeObserver = TestResizeObserver;
    });

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver;
    });

    it('normalizes measured bounds back into renderer coordinates after viewport scale', async () => {
        const { container, rerender } = render(
            <CanvasDocumentRenderer document={selectionDocument} />
        );
        const renderer = container.querySelector(
            '[data-document-renderer="true"]'
        ) as HTMLElement;
        const targetNode = container.querySelector(
            '[data-design-node-id="target-frame"]'
        ) as HTMLElement;

        renderer.getBoundingClientRect = () =>
            domRect({ left: 10, top: 20, width: 200, height: 100 });
        targetNode.getBoundingClientRect = () =>
            domRect({ left: 50, top: 80, width: 80, height: 40 });

        rerender(
            <CanvasDocumentRenderer
                document={selectionDocument}
                selectedNodeId="target-frame"
            />
        );

        await waitFor(() => {
            const selectionFrame = container.querySelector(
                '[data-selection-node-id="target-frame"]'
            ) as HTMLElement;

            expect(selectionFrame.style.left).toBe('20px');
            expect(selectionFrame.style.top).toBe('30px');
            expect(selectionFrame.style.width).toBe('40px');
            expect(selectionFrame.style.height).toBe('20px');
        });
    });

    it('uses rotated bounding-box dimensions for fallback document selection overlays', async () => {
        const { container, rerender } = render(
            <CanvasDocumentRenderer document={rotatedSelectionDocument} />
        );

        rerender(
            <CanvasDocumentRenderer
                document={rotatedSelectionDocument}
                selectedNodeId="rotated-frame"
            />
        );

        await waitFor(() => {
            const selectionFrame = container.querySelector(
                '[data-selection-node-id="rotated-frame"]'
            ) as HTMLElement;

            expect(selectionFrame.style.left).toBe('0px');
            expect(selectionFrame.style.top).toBe('0px');
            expect(selectionFrame.style.width).toBe('50px');
            expect(selectionFrame.style.height).toBe('100px');
        });
    });

    it('renders viewport selection chrome with fixed screen-space sizes', async () => {
        const { container, rerender } = render(
            <CanvasViewportShell
                document={selectionDocument}
                resolveAsset={(url) => url}
            />
        );
        const viewport = container.querySelector(
            '[aria-label="Canvas viewport"]'
        ) as HTMLElement;
        const targetNode = container.querySelector(
            '[data-design-node-id="target-frame"]'
        ) as HTMLElement;

        viewport.getBoundingClientRect = () =>
            domRect({ left: 10, top: 20, width: 1200, height: 800 });
        targetNode.getBoundingClientRect = () =>
            domRect({ left: 110, top: 170, width: 200, height: 100 });

        rerender(
            <CanvasViewportShell
                document={selectionDocument}
                resolveAsset={(url) => url}
                selectedNodeId="target-frame"
            />
        );

        await waitFor(() => {
            const selectionFrame = container.querySelector(
                '[data-viewport-selection-node-id="target-frame"]'
            ) as HTMLElement;
            const selectionHandle = container.querySelector(
                '[data-viewport-selection-handle-position="top-left"]'
            ) as HTMLElement;

            expect(
                Number.parseFloat(selectionFrame.style.left) -
                    viewport.scrollLeft
            ).toBe(100);
            expect(
                Number.parseFloat(selectionFrame.style.top) - viewport.scrollTop
            ).toBe(150);
            expect(selectionFrame.style.width).toBe('100px');
            expect(selectionFrame.style.height).toBe('50px');
            expect(selectionFrame.style.borderWidth).toBe('3px');
            expect(selectionFrame.style.borderStyle).toBe('solid');
            expect(selectionHandle.style.width).toBe('10px');
            expect(selectionHandle.style.height).toBe('10px');
            expect(selectionHandle.style.borderWidth).toBe('2px');
            expect(selectionHandle.style.borderStyle).toBe('solid');
        });
    });

    it('keeps the rotated selection frame and size label in the render-origin coordinate system', async () => {
        const { container, rerender } = render(
            <CanvasViewportShell
                document={rotatedSelectionDocument}
                resolveAsset={(url) => url}
            />
        );
        const viewport = container.querySelector(
            '[aria-label="Canvas viewport"]'
        ) as HTMLElement;
        const targetNode = container.querySelector(
            '[data-design-node-id="rotated-frame"]'
        ) as HTMLElement;

        viewport.getBoundingClientRect = () =>
            domRect({ left: 10, top: 20, width: 1200, height: 800 });
        targetNode.getBoundingClientRect = () =>
            domRect({ left: 55, top: 25, width: 50, height: 100 });

        Object.defineProperty(targetNode, 'offsetWidth', {
            configurable: true,
            value: 100
        });
        Object.defineProperty(targetNode, 'offsetHeight', {
            configurable: true,
            value: 50
        });

        rerender(
            <CanvasViewportShell
                document={rotatedSelectionDocument}
                resolveAsset={(url) => url}
                selectedNodeId="rotated-frame"
            />
        );

        await waitFor(() => {
            const selectionFrame = container.querySelector(
                '[data-viewport-selection-node-id="rotated-frame"]'
            ) as HTMLElement;
            const selectionLabel = container.querySelector(
                '[data-viewport-selection-size-label="true"]'
            ) as HTMLElement;

            expect(targetNode.style.transform).toBe('rotate(-90deg)');
            expect(targetNode.style.transformOrigin).toBe('center center');
            expect(
                Number.parseFloat(selectionFrame.style.left) -
                    viewport.scrollLeft
            ).toBe(20);
            expect(
                Number.parseFloat(selectionFrame.style.top) - viewport.scrollTop
            ).toBe(30);
            expect(selectionFrame.style.width).toBe('100px');
            expect(selectionFrame.style.height).toBe('50px');
            expect(selectionFrame.style.transform).toBe('rotate(-90deg)');
            expect(selectionFrame.style.transformOrigin).toBe('center center');
            expect(
                Number.parseFloat(selectionLabel.style.left) -
                    viewport.scrollLeft
            ).toBe(70);
            expect(
                Number.parseFloat(selectionLabel.style.top) - viewport.scrollTop
            ).toBe(111);
            expect(selectionLabel.style.transform).toBe('translate(-50%, 0)');
        });
    });

    it('ignores scroll events produced by shortcut wheel zooming', async () => {
        const { container } = render(
            <CanvasViewportShell
                document={selectionDocument}
                resolveAsset={(url) => url}
            />
        );
        const viewport = container.querySelector(
            '[aria-label="Canvas viewport"]'
        ) as HTMLElement;
        const surface = container.querySelector(
            '[data-region="canvas-world-surface"]'
        ) as HTMLElement;

        viewport.getBoundingClientRect = () =>
            domRect({ left: 0, top: 0, width: 1200, height: 800 });

        expect(
            fireEvent.wheel(viewport, {
                bubbles: true,
                cancelable: true,
                clientX: 300,
                clientY: 220,
                ctrlKey: true,
                deltaY: -100
            })
        ).toBe(false);

        await waitFor(() => {
            expect(surface.style.transform).toContain('scale(1.1)');
        });

        const transformAfterZoom = surface.style.transform;

        viewport.scrollTop += 180;
        fireEvent.scroll(viewport);

        await waitFor(() => {
            expect(surface.style.transform).toBe(transformAfterZoom);
        });
    });
});
