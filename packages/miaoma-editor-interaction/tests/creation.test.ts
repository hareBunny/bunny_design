/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import { createEditorInteraction } from '../src';

const absoluteFramePath = [
    {
        id: 'frame-1',
        type: 'frame' as const,
        layout: 'none' as const
    }
];

const nestedFramePath = [
    {
        id: 'frame-outer',
        type: 'frame' as const,
        layout: 'vertical' as const
    },
    {
        id: 'rectangle-1',
        type: 'rectangle' as const
    },
    {
        id: 'frame-inner',
        type: 'frame' as const,
        layout: 'horizontal' as const
    }
];

describe('editor interaction creation reducer', () => {
    it('does not create a shape when drag distance stays below threshold', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'rectangle' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 12,
                worldY: 18,
                screenX: 100,
                screenY: 120,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 13,
                worldY: 19,
                screenX: 102,
                screenY: 122,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        expect(commands).toEqual([{ type: 'clearCreationOverlay' }]);
        expect(interaction.getState().activeTool).toBe('rectangle');
    });

    it('emits shape creation commands after drag passes threshold', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'rectangle' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 12,
                worldY: 18,
                screenX: 100,
                screenY: 120,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 62,
                worldY: 58,
                screenX: 150,
                screenY: 160,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        expect(commands).toEqual([
            {
                type: 'createNode',
                payload: {
                    nodeType: 'rectangle',
                    parentId: 'frame-1',
                    parentLayout: 'absolute',
                    bounds: {
                        x: 12,
                        y: 18,
                        width: 50,
                        height: 40
                    },
                    selectAfterCreate: true,
                    startTextEditAfterCreate: false
                }
            },
            { type: 'clearCreationOverlay' },
            { type: 'setActiveTool', tool: 'pointer' }
        ]);
    });

    it('rounds created shape bounds to integers', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'frame' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 12.25,
                worldY: 18.5,
                screenX: 100,
                screenY: 120,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 62.85,
                worldY: 58.1,
                screenX: 150,
                screenY: 160,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        expect(commands[0]).toEqual({
            type: 'createNode',
            payload: {
                nodeType: 'frame',
                parentId: 'frame-1',
                parentLayout: 'absolute',
                bounds: {
                    x: 12,
                    y: 19,
                    width: 51,
                    height: 40
                },
                selectAfterCreate: true,
                startTextEditAfterCreate: false
            }
        });
    });

    it('does not create a shape when drag distance equals the threshold', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'rectangle' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 12,
                worldY: 18,
                screenX: 100,
                screenY: 120,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 16,
                worldY: 18,
                screenX: 104,
                screenY: 120,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        expect(commands).toEqual([{ type: 'clearCreationOverlay' }]);
        expect(interaction.getState().activeTool).toBe('rectangle');
    });

    it('emits text creation command immediately on click', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'text' });

        const commands = interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 24,
                worldY: 40,
                screenX: 220,
                screenY: 180,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        expect(commands).toEqual([
            {
                type: 'createNode',
                payload: {
                    nodeType: 'text',
                    parentId: 'frame-1',
                    parentLayout: 'absolute',
                    position: {
                        x: 24,
                        y: 40
                    },
                    selectAfterCreate: true,
                    startTextEditAfterCreate: true
                }
            },
            { type: 'setActiveTool', tool: 'pointer' }
        ]);
    });

    it('rounds created text position to integers', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'text' });

        const commands = interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 24.4,
                worldY: 40.5,
                screenX: 220,
                screenY: 180,
                button: 0,
                nodePath: absoluteFramePath
            }
        });

        expect(commands[0]).toEqual({
            type: 'createNode',
            payload: {
                nodeType: 'text',
                parentId: 'frame-1',
                parentLayout: 'absolute',
                position: {
                    x: 24,
                    y: 41
                },
                selectAfterCreate: true,
                startTextEditAfterCreate: true
            }
        });
    });

    it('targets the innermost frame and preserves layout in create commands', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'ellipse' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 10,
                worldY: 20,
                screenX: 100,
                screenY: 200,
                button: 0,
                nodePath: nestedFramePath
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 50,
                worldY: 60,
                screenX: 140,
                screenY: 240,
                button: 0,
                nodePath: nestedFramePath
            }
        });

        expect(commands[0]).toEqual({
            type: 'createNode',
            payload: {
                nodeType: 'ellipse',
                parentId: 'frame-inner',
                parentLayout: 'horizontal',
                bounds: {
                    x: 10,
                    y: 20,
                    width: 40,
                    height: 40
                },
                selectAfterCreate: true,
                startTextEditAfterCreate: false
            }
        });
    });

    it('creates at the root when no frame exists in the hit path', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'frame' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 8,
                worldY: 12,
                screenX: 80,
                screenY: 120,
                button: 0,
                nodePath: []
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 28,
                worldY: 42,
                screenX: 100,
                screenY: 150,
                button: 0,
                nodePath: []
            }
        });

        expect(commands[0]).toEqual({
            type: 'createNode',
            payload: {
                nodeType: 'frame',
                parentId: null,
                parentLayout: 'absolute',
                bounds: {
                    x: 8,
                    y: 12,
                    width: 20,
                    height: 30
                },
                selectAfterCreate: true,
                startTextEditAfterCreate: false
            }
        });
    });

    it('removes a brand-new text node on cancel and reselects its parent frame', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'text' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 24,
                worldY: 40,
                screenX: 220,
                screenY: 180,
                button: 0,
                nodePath: absoluteFramePath
            }
        });
        interaction.dispatch({
            type: 'textEditingStarted',
            nodeId: 'text-1'
        });

        const commands = interaction.dispatch({
            type: 'textEditCancel',
            nodeId: 'text-1'
        });

        expect(commands).toEqual([
            {
                type: 'removeNode',
                nodeId: 'text-1'
            },
            {
                type: 'selectNode',
                nodeId: 'frame-1'
            }
        ]);
        expect(interaction.getState().textEditingNodeId).toBeNull();
    });

    it('removes a brand-new text node on empty commit and clears selection at root', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({ type: 'selectTool', tool: 'text' });
        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 4,
                worldY: 8,
                screenX: 40,
                screenY: 80,
                button: 0,
                nodePath: []
            }
        });
        interaction.dispatch({
            type: 'textEditingStarted',
            nodeId: 'text-root'
        });

        const commands = interaction.dispatch({
            type: 'textEditCommit',
            nodeId: 'text-root',
            content: '   '
        });

        expect(commands).toEqual([
            {
                type: 'removeNode',
                nodeId: 'text-root'
            },
            {
                type: 'selectNode',
                nodeId: null
            }
        ]);
        expect(interaction.getState().textEditingNodeId).toBeNull();
    });
});
