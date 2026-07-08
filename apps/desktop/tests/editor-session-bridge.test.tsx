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
    act,
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
import { getCenterFromAabb } from '../renderer/utils/rotationAabb';

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

const SIBLING_NESTED_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'group-1',
            type: 'frame',
            name: 'Group 1',
            x: 0,
            y: 0,
            width: 260,
            height: 180,
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'nested-frame-a',
                    type: 'frame',
                    name: 'Nested Frame A',
                    x: 20,
                    y: 20,
                    fills: [],
                    strokes: [],
                    effects: [],
                    width: 100,
                    height: 50,
                    children: [
                        {
                            id: 'nested-text-a',
                            type: 'text',
                            name: 'Nested Text A',
                            x: 8,
                            y: 8,
                            content: 'Nested A',
                            fills: [],
                            strokes: [],
                            effects: []
                        }
                    ]
                },
                {
                    id: 'nested-frame-b',
                    type: 'frame',
                    name: 'Nested Frame B',
                    x: 20,
                    y: 90,
                    fills: [],
                    strokes: [],
                    effects: [],
                    width: 100,
                    height: 50,
                    children: [
                        {
                            id: 'nested-text-b',
                            type: 'text',
                            name: 'Nested Text B',
                            x: 8,
                            y: 8,
                            content: 'Nested B',
                            fills: [],
                            strokes: [],
                            effects: []
                        }
                    ]
                }
            ]
        }
    ]
};

const GAP_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'gap-frame-left',
            type: 'frame',
            name: 'Gap Frame Left',
            x: 0,
            y: 0,
            width: 120,
            height: 120,
            fills: [],
            strokes: [],
            effects: [],
            children: []
        },
        {
            id: 'gap-frame-right',
            type: 'frame',
            name: 'Gap Frame Right',
            x: 300,
            y: 0,
            width: 120,
            height: 120,
            fills: [],
            strokes: [],
            effects: [],
            children: []
        }
    ]
};

const REPARENT_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'frame-source',
            type: 'frame',
            name: 'Source Frame',
            x: 0,
            y: 0,
            width: 180,
            height: 180,
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'drag-text',
                    type: 'text',
                    name: 'Drag Text',
                    x: 20,
                    y: 20,
                    content: 'Drag me',
                    fills: [],
                    strokes: [],
                    effects: []
                }
            ]
        },
        {
            id: 'frame-target-flow',
            type: 'frame',
            name: 'Target Flow Frame',
            x: 260,
            y: 0,
            width: 200,
            height: 220,
            layout: 'vertical',
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'existing-target-child',
                    type: 'text',
                    name: 'Existing Target Child',
                    content: 'Existing',
                    fills: [],
                    strokes: [],
                    effects: []
                }
            ]
        }
    ]
};

const ANCESTOR_REPARENT_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'frame-outer',
            type: 'frame',
            name: 'Outer Frame',
            x: 0,
            y: 0,
            width: 420,
            height: 320,
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'frame-source',
                    type: 'frame',
                    name: 'Source Frame',
                    x: 20,
                    y: 20,
                    width: 180,
                    height: 180,
                    fills: [],
                    strokes: [],
                    effects: [],
                    children: [
                        {
                            id: 'drag-text',
                            type: 'text',
                            name: 'Drag Text',
                            x: 20,
                            y: 20,
                            content: 'Drag me',
                            fills: [],
                            strokes: [],
                            effects: []
                        }
                    ]
                }
            ]
        }
    ]
};

const FLEX_DRAG_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'frame-source-flow',
            type: 'frame',
            name: 'Source Flow',
            x: 0,
            y: 0,
            width: 160,
            height: 220,
            layout: 'vertical',
            gap: 10,
            padding: 10,
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'source-a',
                    type: 'rectangle',
                    name: 'Source A',
                    width: 80,
                    height: 30,
                    fills: [],
                    strokes: [],
                    effects: []
                },
                {
                    id: 'source-b',
                    type: 'rectangle',
                    name: 'Source B',
                    width: 80,
                    height: 30,
                    fills: [],
                    strokes: [],
                    effects: []
                },
                {
                    id: 'source-c',
                    type: 'rectangle',
                    name: 'Source C',
                    width: 80,
                    height: 30,
                    fills: [],
                    strokes: [],
                    effects: []
                }
            ]
        },
        {
            id: 'frame-target-flow-reorder',
            type: 'frame',
            name: 'Target Flow Reorder',
            x: 240,
            y: 0,
            width: 160,
            height: 220,
            layout: 'vertical',
            gap: 10,
            padding: 10,
            fills: [],
            strokes: [],
            effects: [],
            children: [
                {
                    id: 'target-a',
                    type: 'rectangle',
                    name: 'Target A',
                    width: 80,
                    height: 30,
                    fills: [],
                    strokes: [],
                    effects: []
                },
                {
                    id: 'target-b',
                    type: 'rectangle',
                    name: 'Target B',
                    width: 80,
                    height: 30,
                    fills: [],
                    strokes: [],
                    effects: []
                }
            ]
        }
    ]
};

const OVERLAPPING_EDITOR_DOCUMENT: EditorDocument = {
    version: '1.0.0',
    children: [
        {
            id: 'overlap-back',
            type: 'frame',
            name: 'Overlap Back',
            x: 120,
            y: 100,
            width: 200,
            height: 160,
            fills: [],
            strokes: [],
            effects: [],
            children: []
        },
        {
            id: 'overlap-front',
            type: 'frame',
            name: 'Overlap Front',
            x: 150,
            y: 130,
            width: 200,
            height: 160,
            fills: [],
            strokes: [],
            effects: [],
            children: []
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

const DocumentDebug = () => {
    const snapshot = useEditorSnapshot();

    return (
        <pre data-testid="document-json">
            {JSON.stringify(snapshot.document)}
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

const renderSiblingNestedCanvasHarness = () =>
    render(
        <EditorSessionProvider initialDocument={SIBLING_NESTED_EDITOR_DOCUMENT}>
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

const renderCanvasStageHarnessForDocument = ({
    document,
    initialSelectedNodeId
}: {
    document: EditorDocument;
    initialSelectedNodeId?: string | null;
}) =>
    render(
        <EditorSessionProvider
            initialDocument={document}
            initialSelectedNodeId={initialSelectedNodeId ?? null}
        >
            <EditorInteractionProvider>
                <CanvasStage activeSidebarTab="layers" />
                <SelectedNodeDebug />
                <DocumentDebug />
            </EditorInteractionProvider>
        </EditorSessionProvider>
    );

const renderCanvasStageWithInspectorHarness = ({
    document,
    initialSelectedNodeId
}: {
    document: EditorDocument;
    initialSelectedNodeId?: string | null;
}) =>
    render(
        <EditorSessionProvider
            initialDocument={document}
            initialSelectedNodeId={initialSelectedNodeId ?? null}
        >
            <EditorInteractionProvider>
                <CanvasStage activeSidebarTab="layers" />
                <RightInspector />
                <SelectedNodeDebug />
                <DocumentDebug />
            </EditorInteractionProvider>
        </EditorSessionProvider>
    );

const readSelectedNode = () =>
    JSON.parse(screen.getByTestId('selected-node-json').textContent ?? 'null');

const readDocument = () =>
    JSON.parse(screen.getByTestId('document-json').textContent ?? 'null');

const expectInlineTextEditor = (editor: HTMLElement) => {
    expect(editor.tagName).toBe('DIV');
    expect(editor.getAttribute('contenteditable')).toBe('true');
};

const fireCanvasDoubleClick = ({
    clickTarget,
    pointerDownTarget,
    point
}: {
    pointerDownTarget: HTMLElement;
    clickTarget?: HTMLElement;
    point?: { x: number; y: number };
}) => {
    const target = clickTarget ?? pointerDownTarget;
    const eventInit = (detail?: number) => ({
        bubbles: true,
        button: 0,
        ...(point ? { clientX: point.x, clientY: point.y } : {}),
        ...(detail === undefined ? {} : { detail })
    });

    fireEvent.pointerDown(pointerDownTarget, eventInit(1));
    fireEvent.pointerUp(target, eventInit());
    fireEvent.click(target, eventInit(1));
    fireEvent.pointerDown(pointerDownTarget, eventInit(2));
    fireEvent.pointerUp(target, eventInit());
    fireEvent.click(target, eventInit(2));
    fireEvent.doubleClick(target, eventInit(2));
};

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

    it('uses the hand tool to pan the viewport and disables node selection until pointer is reselected', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'frame-1'
            });

            const viewport = screen.getByLabelText(
                'Canvas viewport'
            ) as HTMLDivElement;
            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );

            expect(textNode).not.toBeNull();

            await user.click(screen.getByRole('button', { name: 'Hand tool' }));

            const startScrollLeft = viewport.scrollLeft;
            const startScrollTop = viewport.scrollTop;

            fireEvent.pointerDown(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                clientX: 240,
                clientY: 180,
                pointerId: 1
            });
            fireEvent.pointerMove(viewport, {
                bubbles: true,
                button: 0,
                buttons: 1,
                clientX: 200,
                clientY: 140,
                pointerId: 1
            });
            fireEvent.pointerUp(viewport, {
                bubbles: true,
                button: 0,
                clientX: 200,
                clientY: 140,
                pointerId: 1
            });

            expect(viewport.scrollLeft).not.toBe(startScrollLeft);
            expect(viewport.scrollTop).not.toBe(startScrollTop);
            expect(readSelectedNode().id).toBe('frame-1');

            await user.click(
                screen.getByRole('button', { name: 'Pointer tool' })
            );
            await user.click(textNode as HTMLElement);

            expect(readSelectedNode().id).toBe('text-1');
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('temporarily pans the viewport while the space key is held and restores pointer selection on release', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'frame-1'
            });

            const viewport = screen.getByLabelText(
                'Canvas viewport'
            ) as HTMLDivElement;
            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );

            expect(textNode).not.toBeNull();

            const spaceHandled = fireEvent.keyDown(viewport, {
                bubbles: true,
                code: 'Space',
                key: ' '
            });
            const startScrollLeft = viewport.scrollLeft;
            const startScrollTop = viewport.scrollTop;

            fireEvent.pointerDown(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                clientX: 240,
                clientY: 180,
                pointerId: 2
            });
            fireEvent.pointerMove(viewport, {
                bubbles: true,
                button: 0,
                buttons: 1,
                clientX: 210,
                clientY: 150,
                pointerId: 2
            });
            fireEvent.pointerUp(viewport, {
                bubbles: true,
                button: 0,
                clientX: 210,
                clientY: 150,
                pointerId: 2
            });

            expect(spaceHandled).toBe(false);
            expect(viewport.scrollLeft).not.toBe(startScrollLeft);
            expect(viewport.scrollTop).not.toBe(startScrollTop);
            expect(readSelectedNode().id).toBe('frame-1');

            fireEvent.keyUp(viewport, {
                bubbles: true,
                code: 'Space',
                key: ' '
            });
            await user.click(textNode as HTMLElement);

            expect(readSelectedNode().id).toBe('text-1');
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
                button: 0,
                pointerId: 1
            });
            fireEvent.pointerUp(screen.getByLabelText('Canvas viewport'), {
                bubbles: true,
                button: 0,
                pointerId: 1
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
                button: 0,
                pointerId: 2
            });
            fireEvent.pointerUp(screen.getByText('MIAOMAEDU'), {
                bubbles: true,
                button: 0,
                pointerId: 2
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

    it('switches directly to a sibling node after drilling into a child', async () => {
        const user = userEvent.setup();

        renderSiblingNestedCanvasHarness();

        await user.click(screen.getByText('Nested A'));
        expect(readSelectedNode().id).toBe('group-1');

        await user.click(screen.getByText('Nested A'));
        expect(readSelectedNode().id).toBe('nested-frame-a');

        await user.click(screen.getByText('Nested B'));
        expect(readSelectedNode().id).toBe('nested-frame-b');
    });

    it('does not open inline editing when double clicking a text node before it is selected', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'frame-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );

            expect(textNode).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                detail: 0,
                pointerId: 1
            });
            fireEvent.pointerUp(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                pointerId: 1
            });
            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    id: 'text-1',
                    type: 'text'
                });
            });
            fireEvent.mouseDown(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                detail: 1
            });
            fireEvent.pointerUp(textNode as HTMLElement, {
                bubbles: true,
                button: 0
            });
            fireEvent.click(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                detail: 1
            });
            fireEvent.pointerDown(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                detail: 0
            });
            fireEvent.pointerUp(textNode as HTMLElement, {
                bubbles: true,
                button: 0
            });
            fireEvent.click(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                detail: 2
            });
            fireEvent.doubleClick(textNode as HTMLElement, {
                bubbles: true,
                button: 0,
                detail: 2
            });

            expect(
                screen.queryByRole('textbox', {
                    name: 'Canvas inline text editor'
                })
            ).toBeNull();
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('opens inline editing when the viewport owns a selected text double click after pointer capture', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: CANVAS_SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'fX4RY'
            });

            const viewport = screen.getByLabelText('Canvas viewport');
            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="fX4RY"]'
            );

            expect(textNode).not.toBeNull();

            fireCanvasDoubleClick({
                clickTarget: viewport,
                pointerDownTarget: textNode as HTMLElement,
                point: { x: 2800, y: 420 }
            });

            const editor = await screen.findByRole('textbox', {
                name: 'Canvas inline text editor'
            });

            expect(readSelectedNode()).toMatchObject({
                id: 'fX4RY',
                type: 'text'
            });
            expectInlineTextEditor(editor);
            expect(editor.textContent).toBe('MIAOMAEDU');
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
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

    it('does not render a text content field in the inspector for text nodes', async () => {
        const user = userEvent.setup();

        renderInspector();

        await user.click(screen.getByRole('button', { name: 'Select text' }));

        expect(screen.getByLabelText('Font size')).not.toBeNull();
        expect(screen.queryByLabelText('Text content')).toBeNull();
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

    it('stores newly created rectangle coordinates relative to the selected frame when creation starts inside its active region', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            fireEvent.click(
                screen.getByRole('button', { name: 'Rectangle tool' })
            );

            const canvasStageFrame = document.querySelector<HTMLElement>(
                '[data-design-node-name="Canvas Stage"]'
            );

            expect(canvasStageFrame).not.toBeNull();

            fireEvent.pointerDown(canvasStageFrame as HTMLElement, {
                button: 0,
                clientX: 360,
                clientY: 220,
                pointerId: 1
            });
            fireEvent.pointerMove(screen.getByLabelText('Canvas viewport'), {
                button: 0,
                buttons: 1,
                clientX: 420,
                clientY: 280,
                pointerId: 1
            });
            fireEvent.pointerUp(screen.getByLabelText('Canvas viewport'), {
                button: 0,
                clientX: 420,
                clientY: 280,
                pointerId: 1
            });

            await waitFor(() => {
                expect(readSelectedNode()?.name).toBe('Rectangle');
            });

            expect(readSelectedNode()).toMatchObject({
                height: 60,
                width: 60,
                x: 360,
                y: 220
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('rounds newly created shape numeric bounds before storing it in the document', async () => {
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
                clientX: 360.2,
                clientY: 220.1
            });
            fireEvent.pointerMove(viewport, {
                button: 0,
                clientX: 420.8,
                clientY: 279.7
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                clientX: 420.8,
                clientY: 279.7
            });

            await waitFor(() => {
                expect(readSelectedNode()?.name).toBe('Rectangle');
            });

            const selectedNode = readSelectedNode();

            expect(selectedNode).toMatchObject({
                height: 60,
                width: 61
            });
            expect(Number.isInteger(selectedNode.x)).toBe(true);
            expect(Number.isInteger(selectedNode.y)).toBe(true);
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('moves the selected canvas node by dragging it with the pointer tool', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );

            expect(textNode).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 200,
                clientY: 220,
                pointerId: 1
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 230.4,
                clientY: 235.6,
                pointerId: 1
            });

            expect(readSelectedNode()).toMatchObject({
                id: 'text-1',
                x: 90,
                y: 12
            });
            expect((textNode as HTMLElement).style.transform).toContain(
                'translate('
            );

            const firstPreviewTransform = (textNode as HTMLElement).style
                .transform;

            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 260.9,
                clientY: 260.2,
                pointerId: 1
            });

            expect(readSelectedNode()).toMatchObject({
                id: 'text-1',
                x: 90,
                y: 12
            });
            expect((textNode as HTMLElement).style.transform).not.toBe(
                firstPreviewTransform
            );

            fireEvent.pointerUp(window, {
                button: 0,
                buttons: 0,
                clientX: 260.9,
                clientY: 260.2,
                pointerId: 1
            });

            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    id: 'text-1',
                    x: 151,
                    y: 52
                });
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('reparents a dragged node into the hovered flow container and appends it to the end', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: REPARENT_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'drag-text'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="drag-text"]'
            );
            const targetFrame = document.querySelector<HTMLElement>(
                '[data-design-node-id="frame-target-flow"]'
            );

            expect(textNode).not.toBeNull();
            expect(targetFrame).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 80,
                clientY: 60,
                pointerId: 21
            });
            fireEvent.pointerMove(targetFrame as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 320,
                clientY: 120,
                pointerId: 21
            });
            fireEvent.pointerUp(targetFrame as HTMLElement, {
                button: 0,
                buttons: 0,
                clientX: 320,
                clientY: 120,
                pointerId: 21
            });

            await waitFor(() => {
                const nextDocument = readDocument();
                const sourceFrame = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-source'
                );
                const targetFlowFrame = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-target-flow'
                );

                expect(sourceFrame?.children).toEqual([]);
                expect(targetFlowFrame?.children).toMatchObject([
                    { id: 'existing-target-child' },
                    { id: 'drag-text' }
                ]);
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('reparents a dragged node to the document root when dropped on blank canvas', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: REPARENT_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'drag-text'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="drag-text"]'
            );
            const viewport = screen.getByLabelText(
                'Canvas viewport'
            ) as HTMLElement;

            expect(textNode).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 80,
                clientY: 60,
                pointerId: 22
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 520,
                clientY: 320,
                pointerId: 22
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                buttons: 0,
                clientX: 520,
                clientY: 320,
                pointerId: 22
            });

            await waitFor(() => {
                const nextDocument = readDocument();
                const sourceFrame = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-source'
                );
                const movedNode = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'drag-text'
                );

                expect(sourceFrame?.children).toEqual([]);
                expect(movedNode).toMatchObject({
                    id: 'drag-text',
                    x: 460,
                    y: 280
                });
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('reparents a dragged node to the hovered ancestor container when dropped on its blank area', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: ANCESTOR_REPARENT_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'drag-text'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="drag-text"]'
            );
            const outerFrame = document.querySelector<HTMLElement>(
                '[data-design-node-id="frame-outer"]'
            );

            expect(textNode).not.toBeNull();
            expect(outerFrame).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 80,
                clientY: 60,
                pointerId: 23
            });
            fireEvent.pointerMove(outerFrame as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 280,
                clientY: 220,
                pointerId: 23
            });
            fireEvent.pointerUp(outerFrame as HTMLElement, {
                button: 0,
                buttons: 0,
                clientX: 280,
                clientY: 220,
                pointerId: 23
            });

            await waitFor(() => {
                const nextDocument = readDocument();
                const outerFrameNode = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-outer'
                );
                const sourceFrame = outerFrameNode?.children.find(
                    (node: { id: string }) => node.id === 'frame-source'
                );
                const movedNode = outerFrameNode?.children.find(
                    (node: { id: string }) => node.id === 'drag-text'
                );

                expect(sourceFrame?.children).toEqual([]);
                expect(movedNode).toMatchObject({
                    id: 'drag-text',
                    x: 240,
                    y: 200
                });
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('reparents a flex-layout child to the document root when dropped on blank canvas', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: FLEX_DRAG_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'source-b'
            });

            const draggedNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="source-b"]'
            );
            const viewport = screen.getByLabelText(
                'Canvas viewport'
            ) as HTMLElement;

            expect(draggedNode).not.toBeNull();

            fireEvent.pointerDown(draggedNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 40,
                clientY: 60,
                pointerId: 24
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 500,
                clientY: 300,
                pointerId: 24
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                buttons: 0,
                clientX: 500,
                clientY: 300,
                pointerId: 24
            });

            await waitFor(() => {
                const nextDocument = readDocument();
                const sourceFlow = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-source-flow'
                );
                const movedNode = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'source-b'
                );

                expect(sourceFlow?.children).toMatchObject([
                    { id: 'source-a' },
                    { id: 'source-c' }
                ]);
                expect(movedNode).toMatchObject({
                    id: 'source-b',
                    x: 470,
                    y: 290
                });
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('reorders a flex-layout child within the same flow container when dropped over a sibling', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: FLEX_DRAG_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'source-b'
            });

            const draggedNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="source-b"]'
            );
            const targetSibling = document.querySelector<HTMLElement>(
                '[data-design-node-id="source-c"]'
            );

            expect(draggedNode).not.toBeNull();
            expect(targetSibling).not.toBeNull();

            fireEvent.pointerDown(draggedNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 40,
                clientY: 60,
                pointerId: 25
            });
            fireEvent.pointerMove(targetSibling as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 40,
                clientY: 120,
                pointerId: 25
            });
            fireEvent.pointerUp(targetSibling as HTMLElement, {
                button: 0,
                buttons: 0,
                clientX: 40,
                clientY: 120,
                pointerId: 25
            });

            await waitFor(() => {
                const nextDocument = readDocument();
                const sourceFlow = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-source-flow'
                );

                expect(sourceFlow?.children).toMatchObject([
                    { id: 'source-a' },
                    { id: 'source-c' },
                    { id: 'source-b' }
                ]);
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('inserts a flex-layout child into the hovered target flow position instead of always appending', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: FLEX_DRAG_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'source-b'
            });

            const draggedNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="source-b"]'
            );
            const targetSibling = document.querySelector<HTMLElement>(
                '[data-design-node-id="target-a"]'
            );

            expect(draggedNode).not.toBeNull();
            expect(targetSibling).not.toBeNull();

            fireEvent.pointerDown(draggedNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 40,
                clientY: 60,
                pointerId: 26
            });
            fireEvent.pointerMove(targetSibling as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 260,
                clientY: 15,
                pointerId: 26
            });
            fireEvent.pointerUp(targetSibling as HTMLElement, {
                button: 0,
                buttons: 0,
                clientX: 260,
                clientY: 15,
                pointerId: 26
            });

            await waitFor(() => {
                const nextDocument = readDocument();
                const sourceFlow = nextDocument.children.find(
                    (node: { id: string }) => node.id === 'frame-source-flow'
                );
                const targetFlow = nextDocument.children.find(
                    (node: { id: string }) =>
                        node.id === 'frame-target-flow-reorder'
                );

                expect(sourceFlow?.children).toMatchObject([
                    { id: 'source-a' },
                    { id: 'source-c' }
                ]);
                expect(targetFlow?.children).toMatchObject([
                    { id: 'source-b' },
                    { id: 'target-a' },
                    { id: 'target-b' }
                ]);
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('moves the selected node even when it is covered by an overlapping sibling', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: OVERLAPPING_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'overlap-back'
            });

            const frontFrame = document.querySelector<HTMLElement>(
                '[data-design-node-id="overlap-front"]'
            );

            expect(frontFrame).not.toBeNull();
            expect(readSelectedNode()).toMatchObject({
                id: 'overlap-back',
                x: 120,
                y: 100
            });

            fireEvent.pointerDown(frontFrame as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 180,
                clientY: 160,
                pointerId: 5
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 240,
                clientY: 190,
                pointerId: 5
            });
            fireEvent.pointerUp(window, {
                button: 0,
                buttons: 0,
                clientX: 240,
                clientY: 190,
                pointerId: 5
            });

            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    id: 'overlap-back',
                    x: 180,
                    y: 130
                });
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('hides the active selection overlay while dragging and restores it after pointer up', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );
            const readSelectionOverlay = () =>
                document.querySelector<HTMLElement>(
                    '[data-viewport-selection-node-id="text-1"]'
                );

            expect(textNode).not.toBeNull();
            expect(readSelectionOverlay()).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 200,
                clientY: 220,
                pointerId: 3
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 230.4,
                clientY: 235.6,
                pointerId: 3
            });

            expect(readSelectionOverlay()).toBeNull();

            fireEvent.pointerUp(window, {
                button: 0,
                buttons: 0,
                clientX: 260.9,
                clientY: 260.2,
                pointerId: 3
            });

            await waitFor(() => {
                expect(readSelectionOverlay()).not.toBeNull();
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('recreates the selection overlay only after drag preview cleanup finishes', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const originalRequestAnimationFrame = window.requestAnimationFrame;
        const queuedAnimationFrameCallbacks: FrameRequestCallback[] = [];

        globalThis.ResizeObserver = TestResizeObserver;
        window.requestAnimationFrame = ((callback: FrameRequestCallback) => {
            queuedAnimationFrameCallbacks.push(callback);

            return queuedAnimationFrameCallbacks.length;
        }) as typeof window.requestAnimationFrame;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );
            const readSelectionOverlay = () =>
                document.querySelector<HTMLElement>(
                    '[data-viewport-selection-node-id="text-1"]'
                );

            expect(textNode).not.toBeNull();
            expect(readSelectionOverlay()).not.toBeNull();

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 200,
                clientY: 220,
                pointerId: 4
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 230.4,
                clientY: 235.6,
                pointerId: 4
            });

            expect(readSelectionOverlay()).toBeNull();

            fireEvent.pointerUp(window, {
                button: 0,
                buttons: 0,
                clientX: 260.9,
                clientY: 260.2,
                pointerId: 4
            });

            expect(readSelectionOverlay()).toBeNull();
            expect(queuedAnimationFrameCallbacks).toHaveLength(1);

            await act(async () => {
                queuedAnimationFrameCallbacks.shift()?.(0);
            });

            await waitFor(() => {
                expect(readSelectionOverlay()).not.toBeNull();
            });
        } finally {
            window.requestAnimationFrame = originalRequestAnimationFrame;
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps the selection overlay rotation in sync with inspector rotation edits', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageWithInspectorHarness({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );
            const readSelectionOverlay = () =>
                document.querySelector<HTMLElement>(
                    '[data-viewport-selection-node-id="text-1"]'
                );
            const rotationInput = screen.getByLabelText(
                'Rotation'
            ) as HTMLInputElement;

            expect(textNode).not.toBeNull();
            expect(readSelectionOverlay()).not.toBeNull();
            expect((textNode as HTMLElement).style.transformOrigin).toBe(
                'center center'
            );
            expect(readSelectionOverlay()?.style.transform).toBe(
                (textNode as HTMLElement).style.transform
            );
            expect(readSelectionOverlay()?.style.transformOrigin).toBe(
                'center center'
            );

            await user.clear(rotationInput);
            await user.type(rotationInput, '45');

            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    id: 'text-1',
                    rotation: 45
                });
                expect((textNode as HTMLElement).style.transform).toBe(
                    'rotate(-45deg)'
                );
                expect((textNode as HTMLElement).style.transformOrigin).toBe(
                    'center center'
                );
                expect(readSelectionOverlay()?.style.transform).toBe(
                    (textNode as HTMLElement).style.transform
                );
                expect(readSelectionOverlay()?.style.transformOrigin).toBe(
                    'center center'
                );
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('recomputes and materializes the rotated aabb when inspector rotation changes auto-size text', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageWithInspectorHarness({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            )!;
            Object.defineProperty(textNode, 'offsetWidth', {
                configurable: true,
                value: 120
            });
            Object.defineProperty(textNode, 'offsetHeight', {
                configurable: true,
                value: 24
            });

            const before = readSelectedNode();
            const rotationInput = screen.getByLabelText(
                'Rotation'
            ) as HTMLInputElement;

            await user.clear(rotationInput);
            await user.type(rotationInput, '45');

            await waitFor(() => {
                const after = readSelectedNode();

                expect(after).toMatchObject({
                    id: 'text-1',
                    rotation: 45,
                    width: 120,
                    height: 24
                });
                expect(after.x).not.toBe(before.x);
                expect(after.y).not.toBe(before.y);

                const beforeCenter = getCenterFromAabb({
                    x: before.x,
                    y: before.y,
                    width: 120,
                    height: 24,
                    rotation: before.rotation
                });
                const afterCenter = getCenterFromAabb({
                    x: after.x,
                    y: after.y,
                    width: after.width,
                    height: after.height,
                    rotation: after.rotation
                });

                expect(afterCenter.x).toBeCloseTo(beforeCenter.x, 2);
                expect(afterCenter.y).toBeCloseTo(beforeCenter.y, 2);
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps the dragged node position when the right inspector is mounted', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageWithInspectorHarness({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );
            const xInput = screen.getByLabelText(
                'X position'
            ) as HTMLInputElement;
            const yInput = screen.getByLabelText(
                'Y position'
            ) as HTMLInputElement;

            expect(textNode).not.toBeNull();
            expect(xInput.value).toBe('90');
            expect(yInput.value).toBe('12');

            fireEvent.pointerDown(textNode as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 200,
                clientY: 220,
                pointerId: 1
            });
            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 260.9,
                clientY: 260.2,
                pointerId: 1
            });
            fireEvent.pointerUp(window, {
                button: 0,
                buttons: 0,
                clientX: 260.9,
                clientY: 260.2,
                pointerId: 1
            });

            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    id: 'text-1',
                    x: 151,
                    y: 52
                });
                expect(xInput.value).toBe('151');
                expect(yInput.value).toBe('52');
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps the selected parent active when dragging from a child node area', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: NESTED_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'group-1'
            });

            const nestedText = document.querySelector<HTMLElement>(
                '[data-design-node-id="nested-text"]'
            );

            expect(nestedText).not.toBeNull();

            fireEvent.pointerDown(nestedText as HTMLElement, {
                button: 0,
                buttons: 1,
                clientX: 100,
                clientY: 100,
                pointerId: 2
            });

            expect(readSelectedNode()).toMatchObject({
                id: 'group-1',
                x: 0,
                y: 0
            });

            fireEvent.pointerMove(window, {
                button: 0,
                buttons: 1,
                clientX: 150,
                clientY: 130,
                pointerId: 2
            });
            fireEvent.pointerUp(window, {
                button: 0,
                buttons: 0,
                clientX: 150,
                clientY: 130,
                pointerId: 2
            });

            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    id: 'group-1',
                    x: 50,
                    y: 30
                });
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
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            await user.click(
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

    it('creates text on click, opens inline editing, and commits the content back into the node', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            const rootFrame = document.querySelector<HTMLElement>(
                '[data-design-node-name="Miaoma Editor Recreation Course"]'
            );

            expect(rootFrame).not.toBeNull();

            fireEvent.pointerDown(rootFrame as HTMLElement, {
                button: 0,
                clientX: 280,
                clientY: 240
            });
            fireEvent.pointerUp(rootFrame as HTMLElement, {
                button: 0,
                clientX: 280,
                clientY: 240
            });
            fireEvent.click(rootFrame as HTMLElement, {
                button: 0,
                clientX: 280,
                clientY: 240
            });

            const editor = await screen.findByRole('textbox', {
                name: 'Canvas inline text editor'
            });

            expectInlineTextEditor(editor);
            await user.type(editor, 'Text create smoke{enter}');

            await waitFor(() => {
                expect(
                    screen.queryByRole('textbox', {
                        name: 'Canvas inline text editor'
                    })
                ).toBeNull();
                const selectedNode = readSelectedNode();

                expect(selectedNode).toMatchObject({
                    type: 'text',
                    content: 'Text create smoke'
                });
                expect(selectedNode?.width).toBeUndefined();
                expect(selectedNode?.height).toBeUndefined();
            });

            expect(document.body.textContent).toContain('Text create smoke');
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('creates text with visible draft bounds before the first commit', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            const rootFrame = document.querySelector<HTMLElement>(
                '[data-design-node-name="Miaoma Editor Recreation Course"]'
            );

            expect(rootFrame).not.toBeNull();

            fireEvent.pointerDown(rootFrame as HTMLElement, {
                button: 0,
                clientX: 280,
                clientY: 240
            });

            await screen.findByRole('textbox', {
                name: 'Canvas inline text editor'
            });

            expect(readSelectedNode()).toMatchObject({
                type: 'text',
                width: 64,
                height: 24
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('creates text under the currently selected top-level frame instead of the deepest hit child frame', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            const selectedTopLevelFrame = readSelectedNode();

            expect(selectedTopLevelFrame).toMatchObject({
                type: 'frame',
                name: 'Miaoma Editor Recreation Course'
            });

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            const nestedChildFrame = document.querySelector<HTMLElement>(
                '[data-design-node-name="Right Inspector"]'
            );

            expect(nestedChildFrame).not.toBeNull();

            fireEvent.pointerDown(nestedChildFrame as HTMLElement, {
                button: 0,
                clientX: 980,
                clientY: 120
            });

            const createdTextNode = readSelectedNode();
            const createdTextElement = document.querySelector<HTMLElement>(
                `[data-design-node-id="${createdTextNode?.id}"]`
            );
            const parentNodeElement =
                createdTextElement?.parentElement?.closest<HTMLElement>(
                    '[data-design-node-id]'
                ) ?? null;

            expect(createdTextNode).toMatchObject({
                type: 'text'
            });
            expect(parentNodeElement?.getAttribute('data-design-node-id')).toBe(
                selectedTopLevelFrame?.id
            );
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('creates a rectangle under the currently selected top-level frame instead of the deepest hit child frame', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            const selectedTopLevelFrame = readSelectedNode();

            expect(selectedTopLevelFrame).toMatchObject({
                type: 'frame',
                name: 'Miaoma Editor Recreation Course'
            });

            await user.click(
                screen.getByRole('button', { name: 'Rectangle tool' })
            );

            const nestedChildFrame = document.querySelector<HTMLElement>(
                '[data-design-node-name="Right Inspector"]'
            );

            expect(nestedChildFrame).not.toBeNull();

            fireEvent.pointerDown(nestedChildFrame as HTMLElement, {
                button: 0,
                clientX: 980,
                clientY: 120,
                pointerId: 11
            });
            fireEvent.pointerMove(screen.getByLabelText('Canvas viewport'), {
                button: 0,
                buttons: 1,
                clientX: 1040,
                clientY: 180,
                pointerId: 11
            });
            fireEvent.pointerUp(screen.getByLabelText('Canvas viewport'), {
                button: 0,
                clientX: 1040,
                clientY: 180,
                pointerId: 11
            });

            await waitFor(() => {
                expect(readSelectedNode()).toMatchObject({
                    type: 'rectangle'
                });
            });

            const createdRectangle = readSelectedNode();
            const createdRectangleElement = document.querySelector<HTMLElement>(
                `[data-design-node-id="${createdRectangle?.id}"]`
            );
            const parentNodeElement =
                createdRectangleElement?.parentElement?.closest<HTMLElement>(
                    '[data-design-node-id]'
                ) ?? null;

            expect(parentNodeElement?.getAttribute('data-design-node-id')).toBe(
                selectedTopLevelFrame?.id
            );
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('creates a root-level text node when clicking the gap between top-level frames', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: GAP_EDITOR_DOCUMENT,
                initialSelectedNodeId: null
            });

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            fireEvent.pointerDown(screen.getByLabelText('Canvas viewport'), {
                button: 0,
                clientX: 180,
                clientY: 48
            });

            const editor = await screen.findByRole('textbox', {
                name: 'Canvas inline text editor'
            });

            const selectedNode = readSelectedNode();
            const nextDocument = readDocument();
            const topLevelTextNode = nextDocument.children.find(
                (node: { id: string }) => node.id === selectedNode?.id
            );

            expect(selectedNode).toMatchObject({
                type: 'text'
            });
            expect(topLevelTextNode).toBeDefined();
            expectInlineTextEditor(editor);
            expect(editor.getAttribute('style')).toContain('box-shadow');
            expect(editor.getAttribute('style')).toContain('caret-color');
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('keeps a root-level text node selected after the full click sequence in blank canvas space', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: GAP_EDITOR_DOCUMENT,
                initialSelectedNodeId: null
            });

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            const viewport = screen.getByLabelText('Canvas viewport');

            fireEvent.pointerDown(viewport, {
                button: 0,
                clientX: 180,
                clientY: 48
            });
            fireEvent.pointerUp(viewport, {
                button: 0,
                clientX: 180,
                clientY: 48
            });
            fireEvent.click(viewport, {
                button: 0,
                clientX: 180,
                clientY: 48
            });

            await waitFor(() => {
                const editor = screen.getByRole('textbox', {
                    name: 'Canvas inline text editor'
                });

                expect(editor).not.toBeNull();
                expect(readSelectedNode()).toMatchObject({
                    type: 'text'
                });
            });
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('opens inline editing when double clicking a text node that is already selected', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasStageHarnessForDocument({
                document: SAMPLE_EDITOR_DOCUMENT,
                initialSelectedNodeId: 'text-1'
            });

            const textNode = document.querySelector<HTMLElement>(
                '[data-design-node-id="text-1"]'
            );

            expect(textNode).not.toBeNull();
            expect(readSelectedNode()).toMatchObject({
                id: 'text-1',
                type: 'text'
            });

            fireCanvasDoubleClick({
                pointerDownTarget: textNode as HTMLElement
            });

            const editor = await screen.findByRole('textbox', {
                name: 'Canvas inline text editor'
            });

            expectInlineTextEditor(editor);
            expect(editor.textContent).toBe('Hello');
            expect(textNode?.style.visibility).toBe('hidden');
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });

    it('removes a newly created empty text node on escape', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const user = userEvent.setup();

        globalThis.ResizeObserver = TestResizeObserver;

        try {
            renderCanvasCreationStageHarness();

            await user.click(screen.getByRole('button', { name: 'Text tool' }));

            const rootFrame = document.querySelector<HTMLElement>(
                '[data-design-node-name="Miaoma Editor Recreation Course"]'
            );

            expect(rootFrame).not.toBeNull();

            fireEvent.pointerDown(rootFrame as HTMLElement, {
                button: 0,
                clientX: 300,
                clientY: 260
            });

            const editor = await screen.findByRole('textbox', {
                name: 'Canvas inline text editor'
            });

            expectInlineTextEditor(editor);
            const createdTextNodeId = readSelectedNode()?.id;

            fireEvent.keyDown(editor, { key: 'Escape' });

            await waitFor(() => {
                expect(
                    screen.queryByRole('textbox', {
                        name: 'Canvas inline text editor'
                    })
                ).toBeNull();

                const selectedNode = readSelectedNode();

                expect(selectedNode).toMatchObject({
                    type: 'frame'
                });
                expect(selectedNode?.id).not.toBe(createdTextNodeId);
                expect(
                    document.querySelector(
                        `[data-design-node-id="${createdTextNodeId}"]`
                    )
                ).toBeNull();
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
