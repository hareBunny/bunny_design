/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import { createEditorInteraction } from '../src';

const absoluteNodePath = [
    {
        id: 'frame-1',
        type: 'frame' as const,
        layout: 'none' as const
    },
    {
        id: 'rectangle-1',
        type: 'rectangle' as const
    }
];

const horizontalNodePath = [
    {
        id: 'frame-1',
        type: 'frame' as const,
        layout: 'horizontal' as const
    },
    {
        id: 'rectangle-1',
        type: 'rectangle' as const
    }
];

describe('editor interaction movement reducer', () => {
    it('moves the selected absolute-layout node after drag passes threshold', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 100,
                worldY: 120,
                screenX: 300,
                screenY: 320,
                button: 0,
                nodePath: absoluteNodePath,
                selectedNode: {
                    nodeId: 'rectangle-1',
                    parentLayout: 'absolute',
                    position: {
                        x: 20,
                        y: 30
                    }
                }
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerMove',
            payload: {
                worldX: 116.4,
                worldY: 129.6,
                screenX: 316,
                screenY: 330,
                button: 0,
                nodePath: absoluteNodePath
            }
        });

        expect(commands).toEqual([
            {
                type: 'moveNode',
                nodeId: 'rectangle-1',
                position: {
                    x: 36,
                    y: 40
                }
            }
        ]);

        const nextCommands = interaction.dispatch({
            type: 'pointerMove',
            payload: {
                worldX: 142.1,
                worldY: 151.2,
                screenX: 342,
                screenY: 351,
                button: 0,
                nodePath: absoluteNodePath
            }
        });

        expect(nextCommands).toEqual([
            {
                type: 'moveNode',
                nodeId: 'rectangle-1',
                position: {
                    x: 62,
                    y: 61
                }
            }
        ]);
    });

    it('does not move before the drag threshold is exceeded', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 100,
                worldY: 120,
                screenX: 300,
                screenY: 320,
                button: 0,
                nodePath: absoluteNodePath,
                selectedNode: {
                    nodeId: 'rectangle-1',
                    parentLayout: 'absolute',
                    position: {
                        x: 20,
                        y: 30
                    }
                }
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerUp',
            payload: {
                worldX: 101,
                worldY: 121,
                screenX: 301,
                screenY: 321,
                button: 0,
                nodePath: absoluteNodePath
            }
        });

        expect(commands).toEqual([]);
    });

    it('does not move selected children controlled by flex layout', () => {
        const interaction = createEditorInteraction();

        interaction.dispatch({
            type: 'pointerDown',
            payload: {
                worldX: 100,
                worldY: 120,
                screenX: 300,
                screenY: 320,
                button: 0,
                nodePath: horizontalNodePath,
                selectedNode: {
                    nodeId: 'rectangle-1',
                    parentLayout: 'horizontal',
                    position: {
                        x: 20,
                        y: 30
                    }
                }
            }
        });

        const commands = interaction.dispatch({
            type: 'pointerMove',
            payload: {
                worldX: 140,
                worldY: 160,
                screenX: 340,
                screenY: 360,
                button: 0,
                nodePath: horizontalNodePath
            }
        });

        expect(commands).toEqual([]);
    });
});
