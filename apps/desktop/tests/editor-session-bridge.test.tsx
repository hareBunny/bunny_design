/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import {
    type EditorDocument,
    editorDocumentToRenderable,
    getSelectedNode
} from '@miaoma-design-ai/miaoma-editor-core';
import type { CanvasToolId } from '@miaoma-design-ai/miaoma-editor-interaction';
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CanvasDocumentRenderer } from '../renderer/components/document/CanvasDocumentRenderer';
import { useCanvasCreationBridge } from '../renderer/components/editor/bridges/useCanvasCreationBridge';
import { CanvasStage } from '../renderer/components/editor/CanvasStage';
import { CanvasToolRail } from '../renderer/components/editor/CanvasToolRail';
import { LeftSidebar } from '../renderer/components/editor/LeftSidebar';
import { MiaomaEditor } from '../renderer/components/editor/MiaomaEditor';
import { RightInspector } from '../renderer/components/editor/RightInspector';
import { EditorInteractionProvider } from '../renderer/components/editor/state/EditorInteractionProvider';
import { EditorSessionProvider } from '../renderer/components/editor/state/EditorSessionProvider';
import { useEditorInteraction } from '../renderer/components/editor/state/useEditorInteraction';
import { useEditorSession } from '../renderer/components/editor/state/useEditorSession';
import { useEditorSnapshot } from '../renderer/components/editor/state/useEditorSnapshot';
import { findFrameRectInRenderer } from '../renderer/components/editor/viewport/extractDesignNodePath';
import { CANVAS_SAMPLE_EDITOR_DOCUMENT } from '../renderer/fixtures/canvasSampleDocument';

const SAMPLE_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'frame-1',
            type: 'frame',
            name: 'Frame 1',
            x: 10,
            y: 20,
            rotation: 0,
            width: 120,
            height: 80,
            clip: true,
            layout: 'none',
            cornerRadius: 8,
            fills: [
                {
                    id: 'fill-1',
                    enabled: true,
                    type: 'color',
                    color: '#ff0000ff'
                }
            ],
            strokes: [
                {
                    id: 'stroke-1',
                    enabled: true,
                    type: 'color',
                    color: '#000000ff',
                    width: 1,
                    align: 'inner'
                }
            ],
            effects: [
                {
                    id: 'effect-1',
                    enabled: true,
                    type: 'shadow',
                    shadowType: 'outer',
                    color: '#00000033',
                    offsetX: 1,
                    offsetY: 2,
                    blur: 4
                }
            ],
            children: []
        },
        {
            id: 'text-1',
            type: 'text',
            name: 'Text 1',
            x: 90,
            y: 12,
            rotation: 5,
            content: 'Hello',
            fontSize: 16,
            fills: [
                {
                    id: 'fill-2',
                    enabled: true,
                    type: 'color',
                    color: '#3366ffff'
                }
            ],
            strokes: [],
            effects: []
        }
    ]
};

const NESTED_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'group-1',
            type: 'frame',
            name: 'Group 1',
            x: 0,
            y: 0,
            width: 200,
            height: 120,
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'nested-text',
                    type: 'text',
                    name: 'Nested Text',
                    x: 20,
                    y: 20,
                    content: 'Nested',
                    fills: [],
                    strokes: [],
                    effects: []
                }
            ]
        }
    ]
};

const SelectionControls = () => {
    const session = useEditorSession();

    return (
        <div>
            <button onClick={() => session.selectNode('frame-1')} type="button">
                Select frame
            </button>
            <button onClick={() => session.selectNode('text-1')} type="button">
                Select text
            </button>
        </div>
    );
};

const SelectedNodeDebug = () => {
    const snapshot = useEditorSnapshot();

    return (
        <pre data-testid="selected-node-json">
            {JSON.stringify(getSelectedNode(snapshot))}
        </pre>
    );
};

const CanvasDebug = () => {
    const snapshot = useEditorSnapshot();

    return (
        <CanvasDocumentRenderer
            document={editorDocumentToRenderable(snapshot.document)}
        />
    );
};

const SidebarCanvasDebug = () => {
    const session = useEditorSession();
    const snapshot = useEditorSnapshot();

    return (
        <>
            <LeftSidebar activeTab="layers" onSelectTab={() => undefined} />
            <CanvasDocumentRenderer
                document={editorDocumentToRenderable(snapshot.document)}
                onNodePointerDown={(nodeId) => {
                    session.selectNode(nodeId);
                }}
                selectedNodeId={snapshot.selection.selectedNodeId}
            />
        </>
    );
};

const renderInspector = () =>
    render(
        <EditorSessionProvider initialDocument={SAMPLE_EDITOR_DOCUMENT}>
            <SelectionControls />
            <RightInspector />
            <SelectedNodeDebug />
            <CanvasDebug />
        </EditorSessionProvider>
    );

const renderLayerSelectionHarness = () =>
    render(
        <EditorSessionProvider initialDocument={SAMPLE_EDITOR_DOCUMENT}>
            <SidebarCanvasDebug />
            <SelectedNodeDebug />
        </EditorSessionProvider>
    );

const renderNestedLayerHarness = () =>
    render(
        <EditorSessionProvider initialDocument={NESTED_EDITOR_DOCUMENT}>
            <LeftSidebar activeTab="layers" onSelectTab={() => undefined} />
            <SelectedNodeDebug />
        </EditorSessionProvider>
    );

const NestedCanvasDebug = () => {
    const session = useEditorSession();
    const snapshot = useEditorSnapshot();

    return (
        <>
            <CanvasDocumentRenderer
                document={editorDocumentToRenderable(snapshot.document)}
                onNodePointerDown={(nodeId) => {
                    session.selectNode(nodeId);
                }}
                selectedNodeId={snapshot.selection.selectedNodeId}
            />
            <SelectedNodeDebug />
        </>
    );
};

const renderNestedCanvasHarness = () =>
    render(
        <EditorSessionProvider initialDocument={NESTED_EDITOR_DOCUMENT}>
            <NestedCanvasDebug />
        </EditorSessionProvider>
    );

const CanvasCreationStageDebug = () => (
    <>
        <CanvasStage activeSidebarTab="layers" />
        <SelectedNodeDebug />
    </>
);

const renderCanvasCreationStageHarness = () =>
    render(
        <EditorSessionProvider
            initialDocument={CANVAS_SAMPLE_EDITOR_DOCUMENT}
            initialSelectedNodeId={
                CANVAS_SAMPLE_EDITOR_DOCUMENT.children[0]?.id
            }
        >
            <EditorInteractionProvider>
                <CanvasCreationStageDebug />
            </EditorInteractionProvider>
        </EditorSessionProvider>
    );

const readSelectedNode = () =>
    JSON.parse(screen.getByTestId('selected-node-json').textContent ?? 'null');

const readCheckboxBox = (button: HTMLElement) =>
    button.querySelector('.editor-check-box') as HTMLElement | null;

const SharedActiveToolDebug = () => {
    const { state } = useEditorInteraction();

    return <div data-testid="shared-active-tool">{state.activeTool}</div>;
};

const ToolRailBridgeHarness = () => {
    const bridge = useCanvasCreationBridge();

    return (
        <>
            <CanvasToolRail
                activeTool={bridge.activeTool}
                onSelectTool={bridge.selectTool}
            />
            <SharedActiveToolDebug />
        </>
    );
};

const LegacyLocalToolRailHarness = () => {
    const [activeTool, setActiveTool] = useState<CanvasToolId>('pointer');

    return (
        <>
            <CanvasToolRail
                activeTool={activeTool}
                onSelectTool={setActiveTool}
            />
            <SharedActiveToolDebug />
        </>
    );
};

class TestResizeObserver {
    constructor() {}

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

describe('RightInspectorFormBridge', () => {
    it('drives the tool rail from shared interaction state instead of local component state', async () => {
        const user = userEvent.setup();
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(
                <EditorSessionProvider initialDocument={SAMPLE_EDITOR_DOCUMENT}>
                    <EditorInteractionProvider>
                        <ToolRailBridgeHarness />
                    </EditorInteractionProvider>
                </EditorSessionProvider>
            );

            await user.click(
                screen.getByRole('button', { name: 'Frame tool' })
            );

            await waitFor(() => {
                expect(
                    document
                        .querySelector('[data-region="canvas-tool-rail"]')
                        ?.getAttribute('data-active-tool')
                ).toBe('frame');
                expect(
                    screen.getByTestId('shared-active-tool').textContent
                ).toBe('frame');
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('shows that a local-only tool rail does not update shared interaction state', async () => {
        const user = userEvent.setup();
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(
                <EditorInteractionProvider>
                    <LegacyLocalToolRailHarness />
                </EditorInteractionProvider>
            );

            await user.click(
                screen.getByRole('button', { name: 'Frame tool' })
            );

            await waitFor(() => {
                expect(
                    document
                        .querySelector('[data-region="canvas-tool-rail"]')
                        ?.getAttribute('data-active-tool')
                ).toBe('frame');
                expect(
                    screen.getByTestId('shared-active-tool').textContent
                ).toBe('pointer');
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('opens the shapes expand menu from the canvas toolbar and updates active tools', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(<MiaomaEditor />);
            const pointerToolButton = screen.getByRole('button', {
                name: 'Pointer tool'
            });
            const expandToolButton = screen.getByRole('button', {
                name: 'More shape tools'
            });

            expect(
                document
                    .querySelector('[data-region="canvas-tool-rail"]')
                    ?.getAttribute('data-active-tool')
            ).toBe('pointer');
            expect(pointerToolButton.className).toContain('border-[#e5e7eb]');
            expect(pointerToolButton.className).toContain('bg-[#f7f8fa]');
            expect(pointerToolButton.className).toContain(
                'shadow-[0_1px_4px_#1118270d]'
            );
            expect(expandToolButton.className).toContain('border-transparent');
            expect(expandToolButton.className).toContain('bg-transparent');

            await user.click(expandToolButton);

            const menu = screen.getByRole('menu', {
                name: 'Shapes expand menu'
            });

            expect(menu).not.toBeNull();
            expect(
                within(menu).getByRole('menuitem', { name: 'Rectangle' })
            ).not.toBeNull();
            expect(
                within(menu).getByRole('menuitem', { name: 'Ellipse' })
            ).not.toBeNull();
            expect(
                within(menu).getByRole('menuitem', { name: 'Polygon' })
            ).not.toBeNull();
            expect(
                within(menu).getByRole('menuitem', { name: 'Icon' })
            ).not.toBeNull();
            expect(
                within(menu)
                    .getByRole('menuitem', { name: 'Polygon' })
                    .getAttribute('aria-disabled')
            ).toBe('true');
            expect(
                within(menu)
                    .getByRole('menuitem', { name: 'Icon' })
                    .getAttribute('aria-disabled')
            ).toBe('true');
            expect(expandToolButton.className).toContain('border-[#f0f2f5]');
            expect(expandToolButton.className).toContain('bg-[#f7f8fa]');

            await user.click(
                within(menu).getByRole('menuitem', { name: 'Ellipse' })
            );

            expect(
                screen.queryByRole('menu', { name: 'Shapes expand menu' })
            ).toBeNull();
            expect(
                document
                    .querySelector('[data-region="canvas-tool-rail"]')
                    ?.getAttribute('data-active-tool')
            ).toBe('ellipse');

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            expect(
                document
                    .querySelector('[data-region="canvas-tool-rail"]')
                    ?.getAttribute('data-active-tool')
            ).toBe('text');
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps the right inspector header while hiding the body on empty canvas selection', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(<MiaomaEditor />);

            expect(
                document.querySelector('[data-region="right-inspector"]')
            ).not.toBeNull();
            expect(
                document.querySelector('[data-region="right-inspector-body"]')
            ).not.toBeNull();

            fireEvent.pointerDown(screen.getByLabelText('Canvas viewport'), {
                bubbles: true,
                button: 0
            });

            await waitFor(() => {
                expect(
                    document.querySelector('[data-region="right-inspector"]')
                ).not.toBeNull();
                expect(
                    document.querySelector(
                        '[data-region="right-inspector-body"]'
                    )
                ).toBeNull();
                expect(
                    document
                        .querySelector('[data-region="right-inspector"]')
                        ?.getAttribute('data-inspector-body-visible')
                ).toBe('false');
                expect(
                    document
                        .querySelector('[data-region="right-inspector-header"]')
                        ?.className.includes('bg-[#f6f6f6]')
                ).toBe(true);
            });

            fireEvent.pointerDown(screen.getByText('MIAOMAEDU'), {
                bubbles: true,
                button: 0
            });

            await waitFor(() => {
                expect(
                    document.querySelector('[data-region="right-inspector"]')
                ).not.toBeNull();
                expect(
                    document.querySelector(
                        '[data-region="right-inspector-body"]'
                    )
                ).not.toBeNull();
                expect(
                    document
                        .querySelector('[data-region="right-inspector"]')
                        ?.getAttribute('data-inspector-body-visible')
                ).toBe('true');
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('syncs layer panel selection with the shared canvas selection', async () => {
        const user = userEvent.setup();

        renderLayerSelectionHarness();

        const textLayerButton = screen.getByRole('button', {
            name: 'Select layer Text 1'
        });

        await user.click(textLayerButton);

        expect(readSelectedNode().id).toBe('text-1');
        const selectedLayerRow = textLayerButton.closest('.editor-layer-row');

        expect(selectedLayerRow?.getAttribute('data-selected')).toBe('true');
        expect(selectedLayerRow?.className).toContain('h-[30px]');
        expect(selectedLayerRow?.className).toContain(
            'grid-cols-[3px_minmax(0,1fr)_auto]'
        );
        expect(selectedLayerRow?.className).not.toContain('h-9');
        expect(selectedLayerRow?.className).not.toContain('text-[13px]');
        expect(selectedLayerRow?.className).not.toContain(
            'grid-cols-[minmax(0,1fr)_46px]'
        );

        await user.click(screen.getByText('Hello'));

        expect(readSelectedNode().id).toBe('text-1');
        expect(selectedLayerRow?.getAttribute('data-selected')).toBe('true');
    });

    it('shows one light group background around child layers when a parent group is selected', async () => {
        const user = userEvent.setup();

        renderNestedLayerHarness();

        await user.click(
            screen.getByRole('button', { name: 'Select layer Group 1' })
        );

        const groupButton = screen.getByRole('button', {
            name: 'Select layer Group 1'
        });
        const groupRow = groupButton.closest('.editor-layer-row');
        const nestedTextButton = screen.getByRole('button', {
            name: 'Select layer Nested Text'
        });
        const nestedTextRow = nestedTextButton.closest('.editor-layer-row');
        const groupHighlightBlock = document.querySelector(
            '[data-layer-group-highlight-block="true"]'
        );

        expect(readSelectedNode().id).toBe('group-1');
        expect(groupHighlightBlock).not.toBeNull();
        expect(groupHighlightBlock?.className).toContain('bg-[#eef2f7]');
        expect(groupHighlightBlock?.contains(groupRow)).toBe(true);
        expect(groupHighlightBlock?.contains(nestedTextRow)).toBe(true);
        expect(nestedTextRow?.getAttribute('data-group-highlight')).toBe(
            'true'
        );
        expect(nestedTextRow?.className).not.toContain('bg-[#eef2f7]');
    });

    it('does not clear canvas selection when clicking text content', () => {
        renderNestedCanvasHarness();

        const text = screen.getByText('Nested');
        const pointerDownEvent = new PointerEvent('pointerdown', {
            bubbles: true,
            button: 0,
            cancelable: true
        });

        expect(fireEvent(text, pointerDownEvent)).toBe(false);
        expect(readSelectedNode().id).toBe('group-1');
        expect(pointerDownEvent.defaultPrevented).toBe(true);
    });

    it('selects canvas nodes one hierarchy level at a time', async () => {
        const user = userEvent.setup();

        renderNestedCanvasHarness();

        await user.click(screen.getByText('Nested'));

        expect(readSelectedNode().id).toBe('group-1');

        await user.click(screen.getByText('Nested'));

        expect(readSelectedNode().id).toBe('nested-text');
    });

    it('selects the deepest canvas node on double click', async () => {
        const user = userEvent.setup();

        renderNestedCanvasHarness();

        await user.dblClick(screen.getByText('Nested'));

        expect(readSelectedNode().id).toBe('nested-text');
    });

    it('resets to the selected node and writes valid numeric edits back to the session', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select frame' }));

        const xInput = screen.getByLabelText('X position') as HTMLInputElement;

        expect(xInput.value).toBe('10');

        await user.clear(xInput);
        await user.type(xInput, '-');

        expect(xInput.value).toBe('-');
        expect(readSelectedNode().x).toBe(10);

        await user.clear(xInput);
        await user.type(xInput, '48');

        expect(readSelectedNode().x).toBe(48);

        await user.click(screen.getByRole('button', { name: 'Select text' }));

        expect(
            (screen.getByLabelText('X position') as HTMLInputElement).value
        ).toBe('90');
        expect(readSelectedNode().id).toBe('text-1');
    });

    it('updates style arrays for the selected node through the inspector form', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select frame' }));

        const fillRow = screen.getByTestId('style-row-fill-1');
        const fillColorInput = within(fillRow).getByLabelText('Fill color');

        await user.clear(fillColorInput);
        await user.type(fillColorInput, '#00ff00');

        expect(readSelectedNode().fills[0].color).toBe('#00ff00');

        const fillOpacityInput = within(fillRow).getByLabelText('Fill opacity');

        await user.clear(fillOpacityInput);
        await user.type(fillOpacityInput, '50%');

        expect(readSelectedNode().fills[0].color).toBe('#00ff0080');

        await user.click(screen.getByRole('button', { name: 'Add stroke' }));
        expect(readSelectedNode().strokes).toHaveLength(2);

        const secondStrokeRow = screen.getAllByTestId(/^style-row-stroke-/)[1];
        const secondStrokeColorInput =
            within(secondStrokeRow).getByLabelText('Stroke color');

        await user.clear(secondStrokeColorInput);
        await user.type(secondStrokeColorInput, '#112233');

        expect(readSelectedNode().strokes[1].color).toBe('#112233');

        await user.click(screen.getByRole('button', { name: 'Add effect' }));
        expect(readSelectedNode().effects).toHaveLength(2);

        const effectRow = screen.getByTestId('style-row-effect-1');
        const effectBlurInput = within(effectRow).getByLabelText('Effect blur');

        await user.clear(effectBlurInput);
        await user.type(effectBlurInput, '12');

        expect(readSelectedNode().effects[0].blur).toBe(12);
    });

    it('updates the selected frame layout mode through the shared inspector form state', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select frame' }));
        await user.click(
            screen.getByRole('button', { name: 'Vertical layout' })
        );

        expect(readSelectedNode().layout).toBe('vertical');

        await user.click(
            screen.getByRole('button', { name: 'Switch to layout' })
        );

        expect(readSelectedNode().layout).toBe('none');
    });

    it('updates flex layout alignment, spacing, and padding through the shared form state', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select frame' }));
        await user.click(
            screen.getByRole('button', { name: 'Vertical layout' })
        );

        const renderedFrame = document.querySelector(
            '[data-design-node-id="frame-1"]'
        ) as HTMLElement | null;
        const alignmentButton = screen.getByRole('button', {
            name: 'Alignment middle center'
        });
        const gapInput = screen.getByLabelText('Gap value') as HTMLInputElement;
        const horizontalPaddingInput = screen.getByLabelText(
            'Horizontal padding'
        ) as HTMLInputElement;
        const verticalPaddingInput = screen.getByLabelText(
            'Vertical padding'
        ) as HTMLInputElement;

        expect((alignmentButton as HTMLButtonElement).disabled).toBe(false);
        expect(gapInput.disabled).toBe(false);
        expect(horizontalPaddingInput.disabled).toBe(false);
        expect(verticalPaddingInput.disabled).toBe(false);

        await user.click(alignmentButton);

        expect(readSelectedNode().justifyContent).toBe('center');
        expect(readSelectedNode().alignItems).toBe('center');
        expect(renderedFrame?.style.justifyContent).toBe('center');
        expect(renderedFrame?.style.alignItems).toBe('center');

        await user.clear(gapInput);
        await user.type(gapInput, '16');

        expect(readSelectedNode().gap).toBe(16);
        expect(renderedFrame?.style.gap).toBe('16px');

        await user.click(
            screen.getByRole('button', { name: 'Space between gap mode' })
        );

        expect(readSelectedNode().justifyContent).toBe('space_between');
        expect(readSelectedNode().gap).toBeUndefined();
        expect(renderedFrame?.style.justifyContent).toBe('space-between');
        expect(renderedFrame?.style.gap).toBe('');

        await user.click(
            screen.getByRole('button', { name: 'Space around gap mode' })
        );

        expect(readSelectedNode().justifyContent).toBe('space_around');
        expect(readSelectedNode().gap).toBeUndefined();
        expect(renderedFrame?.style.justifyContent).toBe('space-around');
        expect(renderedFrame?.style.gap).toBe('');

        await user.clear(horizontalPaddingInput);
        await user.type(horizontalPaddingInput, '24');
        await user.clear(verticalPaddingInput);
        await user.type(verticalPaddingInput, '8');

        expect(readSelectedNode().padding).toEqual([8, 24]);
        expect(renderedFrame?.style.padding).toBe('8px 24px');
    });

    it('updates flex dimension toggles and clip checkbox with visible checked state', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select frame' }));
        await user.click(
            screen.getByRole('button', { name: 'Vertical layout' })
        );

        const renderedFrame = document.querySelector(
            '[data-design-node-id="frame-1"]'
        ) as HTMLElement | null;
        const fillWidthButton = screen.getByRole('checkbox', {
            name: 'Fill Width'
        });
        const hugHeightButton = screen.getByRole('checkbox', {
            name: 'Hug Height'
        });
        const clipButton = screen.getByRole('checkbox', {
            name: 'Clip Content'
        });
        const fillWidthBox = readCheckboxBox(fillWidthButton);
        const hugHeightBox = readCheckboxBox(hugHeightButton);
        const clipBox = readCheckboxBox(clipButton);

        expect((fillWidthButton as HTMLButtonElement).disabled).toBe(false);
        expect((hugHeightButton as HTMLButtonElement).disabled).toBe(false);
        expect(clipButton.getAttribute('aria-pressed')).toBe('true');
        expect(fillWidthButton.getAttribute('data-checked')).toBe('false');
        expect(hugHeightButton.getAttribute('data-checked')).toBe('false');
        expect(clipButton.getAttribute('data-checked')).toBe('true');
        expect(fillWidthBox?.className).not.toContain(
            'editor-check-box--checked'
        );
        expect(fillWidthBox?.className).toContain('h-[14px]');
        expect(fillWidthBox?.className).toContain('w-[14px]');
        expect(fillWidthBox?.className).toContain('rounded-[3px]');
        expect(fillWidthBox?.className).toContain('border-[#111111]');
        expect(fillWidthBox?.className).toContain('bg-white');
        expect(hugHeightBox?.className).not.toContain(
            'editor-check-box--checked'
        );
        expect(clipBox?.className).toContain('editor-check-box--checked');
        expect(clipBox?.className).toContain('bg-[#111111]');
        expect(clipBox?.className).toContain('text-white');
        expect(clipBox?.className).not.toContain('bg-white');
        expect(clipBox?.className).not.toContain('text-transparent');

        await user.click(fillWidthButton);
        await user.click(hugHeightButton);
        await user.click(clipButton);

        expect(fillWidthButton.getAttribute('aria-pressed')).toBe('true');
        expect(hugHeightButton.getAttribute('aria-pressed')).toBe('true');
        expect(clipButton.getAttribute('aria-pressed')).toBe('false');
        expect(fillWidthButton.getAttribute('data-checked')).toBe('true');
        expect(hugHeightButton.getAttribute('data-checked')).toBe('true');
        expect(clipButton.getAttribute('data-checked')).toBe('false');
        expect(fillWidthBox?.className).toContain('editor-check-box--checked');
        expect(fillWidthBox?.className).toContain('bg-[#111111]');
        expect(fillWidthBox?.className).toContain('text-white');
        expect(fillWidthBox?.className).not.toContain('bg-white');
        expect(fillWidthBox?.className).not.toContain('text-transparent');
        expect(hugHeightBox?.className).toContain('editor-check-box--checked');
        expect(hugHeightBox?.className).toContain('bg-[#111111]');
        expect(hugHeightBox?.className).toContain('text-white');
        expect(hugHeightBox?.className).not.toContain('bg-white');
        expect(hugHeightBox?.className).not.toContain('text-transparent');
        expect(clipBox?.className).not.toContain('editor-check-box--checked');
        expect(clipBox?.className).toContain('bg-white');
        expect(clipBox?.className).toContain('text-transparent');
        expect(readSelectedNode().width).toBe('fill_container');
        expect(readSelectedNode().height).toBe('hug_contents');
        expect(readSelectedNode().clip).toBe(false);
        expect(renderedFrame?.style.overflow).toBe('');
    });

    it('updates appearance controls through the shared form state and reflects on the render tree', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select frame' }));

        const opacityInput = screen.getByLabelText(
            'Opacity'
        ) as HTMLInputElement;
        const cornerRadiusInput = screen.getByLabelText(
            'Corner radius'
        ) as HTMLInputElement;
        const renderedFrame = document.querySelector(
            '[data-design-node-id="frame-1"]'
        ) as HTMLElement | null;

        expect(opacityInput.disabled).toBe(false);
        expect(opacityInput.value).toBe('100');
        expect(cornerRadiusInput.disabled).toBe(false);
        expect(cornerRadiusInput.value).toBe('8');
        expect(renderedFrame?.style.borderRadius).toBe('8px');

        await user.clear(opacityInput);
        await user.type(opacityInput, '25');

        expect(readSelectedNode().opacity).toBe(25);
        expect(renderedFrame?.style.opacity).toBe('0.25');

        await user.clear(cornerRadiusInput);
        await user.type(cornerRadiusInput, '16');

        expect(readSelectedNode().cornerRadius).toBe(16);
        expect(renderedFrame?.style.borderRadius).toBe('16px');
    });

    it('creates a rectangle inside the innermost frame after drag and selects it', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(<MiaomaEditor />);

            fireEvent.click(
                screen.getByRole('button', { name: 'Rectangle tool' })
            );

            const viewport = screen.getByLabelText('Canvas viewport');
            fireEvent.pointerDown(viewport, {
                button: 0,
                clientX: 260,
                clientY: 220
            });
            fireEvent.pointerMove(viewport, {
                button: 0,
                clientX: 340,
                clientY: 290
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                clientX: 340,
                clientY: 290
            });

            await waitFor(() => {
                expect(
                    document
                        .querySelector('[data-region="canvas-tool-rail"]')
                        ?.getAttribute('data-active-tool')
                ).toBe('pointer');
            });

            expect(
                document.querySelector('[data-design-node-name="Rectangle"]')
            ).not.toBeNull();
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('appends a newly created ellipse to the end of a vertical frame children list', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(<MiaomaEditor />);

            fireEvent.click(
                screen.getByRole('button', { name: 'More shape tools' })
            );
            fireEvent.click(screen.getByRole('menuitem', { name: 'Ellipse' }));

            const viewport = screen.getByLabelText('Canvas viewport');
            fireEvent.pointerDown(viewport, {
                button: 0,
                clientX: 240,
                clientY: 200
            });
            fireEvent.pointerMove(viewport, {
                button: 0,
                clientX: 300,
                clientY: 250
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                clientX: 300,
                clientY: 250
            });

            await waitFor(() => {
                expect(
                    document.querySelector('[data-design-node-name="Ellipse"]')
                ).not.toBeNull();
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('stores newly created rectangle coordinates relative to the innermost absolute frame', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            fireEvent.click(
                screen.getByRole('button', { name: 'Rectangle tool' })
            );

            const viewport = screen.getByLabelText('Canvas viewport');
            fireEvent.pointerDown(viewport, {
                button: 0,
                clientX: 360,
                clientY: 220
            });
            fireEvent.pointerMove(viewport, {
                button: 0,
                clientX: 420,
                clientY: 280
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                clientX: 420,
                clientY: 280
            });

            await waitFor(() => {
                expect(readSelectedNode()?.name).toBe('Rectangle');
            });

            expect(readSelectedNode()).toMatchObject({
                height: 60,
                width: 60,
                x: 60,
                y: 159
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps frame hit rects in document world coordinates after root bounds expand left', () => {
        const document = editorDocumentToRenderable({
            version: '1.0.0',
            children: [
                {
                    id: 'root-frame',
                    type: 'frame',
                    name: 'Root Frame',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 80,
                    fills: [],
                    strokes: [],
                    effects: [],
                    children: []
                },
                {
                    id: 'left-rectangle',
                    type: 'rectangle',
                    name: 'Left Rectangle',
                    x: -40,
                    y: 0,
                    width: 20,
                    height: 20,
                    fills: [],
                    strokes: [],
                    effects: []
                }
            ]
        });

        expect(findFrameRectInRenderer(document, 'root-frame')).toEqual({
            x: 0,
            y: 0,
            width: 100,
            height: 80
        });
    });

    it('shows the drag creation overlay while the pointer is moving', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            fireEvent.click(
                screen.getByRole('button', { name: 'Rectangle tool' })
            );

            const viewport = screen.getByLabelText('Canvas viewport');
            fireEvent.pointerDown(viewport, {
                button: 0,
                clientX: 360,
                clientY: 220
            });
            fireEvent.pointerMove(viewport, {
                button: 0,
                clientX: 420,
                clientY: 280
            });

            await waitFor(() => {
                const overlay = document.querySelector<HTMLElement>(
                    '[data-region="canvas-creation-overlay"]'
                );

                expect(overlay).not.toBeNull();
                expect(overlay?.className).toContain('border');
                expect(overlay?.className).toContain('border-[#4592FF]');
                expect(overlay?.className).toContain('bg-transparent');
                expect(overlay?.className).not.toContain('bg-[#11111114]');
                expect(overlay?.style.left).toBe(
                    `${viewport.scrollLeft + 360}px`
                );
                expect(overlay?.style.top).toBe(
                    `${viewport.scrollTop + 220}px`
                );
                expect(overlay?.style.width).toBe('60px');
                expect(overlay?.style.height).toBe('60px');
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps the inspector body visible while a shape creation drag starts from blank canvas space', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            render(<MiaomaEditor />);

            fireEvent.click(
                screen.getByRole('button', { name: 'Rectangle tool' })
            );

            fireEvent.pointerDown(screen.getByLabelText('Canvas viewport'), {
                button: 0,
                clientX: 40,
                clientY: 40
            });

            await waitFor(() => {
                expect(
                    document
                        .querySelector('[data-region="right-inspector"]')
                        ?.getAttribute('data-inspector-body-visible')
                ).toBe('true');
                expect(
                    document
                        .querySelector('[data-region="canvas-stage"]')
                        ?.className.includes('col-span-2')
                ).toBe(false);
                expect(
                    document.querySelector(
                        '[data-region="right-inspector-body"]'
                    )
                ).not.toBeNull();
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });
});
