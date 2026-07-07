/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    EditorInteractionCommand,
    EditorInteractionEvent,
    EditorInteractionState,
    HitPathNode,
    InteractionSelectedNode
} from './types';

const DRAG_THRESHOLD = 4;

const roundPoint = (point: { x: number; y: number }) => ({
    x: Math.round(point.x),
    y: Math.round(point.y)
});

const getDistanceFromOrigin = ({
    currentScreen,
    originScreen
}: {
    currentScreen: { x: number; y: number };
    originScreen: { x: number; y: number };
}) =>
    Math.hypot(
        currentScreen.x - originScreen.x,
        currentScreen.y - originScreen.y
    );

const getMovePosition = ({
    currentWorld,
    initialPosition,
    originWorld
}: {
    currentWorld: { x: number; y: number };
    initialPosition: { x: number; y: number };
    originWorld: { x: number; y: number };
}) =>
    roundPoint({
        x: initialPosition.x + currentWorld.x - originWorld.x,
        y: initialPosition.y + currentWorld.y - originWorld.y
    });

const isNodeInPath = (nodePath: HitPathNode[], nodeId: string) =>
    nodePath.some((node) => node.id === nodeId);

const canMoveSelectedNode = (
    selectedNode: InteractionSelectedNode | null | undefined,
    nodePath: HitPathNode[]
) =>
    selectedNode?.parentLayout === 'absolute' &&
    isNodeInPath(nodePath, selectedNode.nodeId);

const resolveParent = (nodePath: HitPathNode[]) => {
    const frame = [...nodePath].reverse().find((node) => node.type === 'frame');

    if (!frame) {
        return { parentId: null, parentLayout: 'absolute' as const };
    }

    return {
        parentId: frame.id,
        parentLayout:
            frame.layout === 'horizontal' || frame.layout === 'vertical'
                ? frame.layout
                : ('absolute' as const)
    };
};

export const createInitialInteractionState = (): EditorInteractionState => ({
    activeTool: 'pointer',
    mode: 'idle',
    textEditingNodeId: null,
    pendingNewText: null,
    draft: null
});

export const reduceInteraction = (
    state: EditorInteractionState,
    event: EditorInteractionEvent
): {
    state: EditorInteractionState;
    commands: EditorInteractionCommand[];
} => {
    if (event.type === 'selectTool') {
        return {
            state: {
                ...state,
                activeTool: event.tool
            },
            commands: [{ type: 'setActiveTool', tool: event.tool }]
        };
    }

    if (event.type === 'pressEscape') {
        return {
            state: {
                ...state,
                mode: 'idle',
                draft: null,
                textEditingNodeId: null,
                pendingNewText: null
            },
            commands: [{ type: 'clearCreationOverlay' }]
        };
    }

    if (event.type === 'textEditingStarted') {
        return {
            state: {
                ...state,
                textEditingNodeId: event.nodeId,
                pendingNewText: state.pendingNewText
                    ? {
                          ...state.pendingNewText,
                          nodeId: event.nodeId
                      }
                    : null
            },
            commands: []
        };
    }

    if (event.type === 'textEditCommit' || event.type === 'textEditCancel') {
        const isNewTextNode = state.pendingNewText?.nodeId === event.nodeId;
        const shouldRemoveNewText =
            isNewTextNode &&
            (event.type === 'textEditCancel' ||
                event.content.trim().length === 0);

        return {
            state: {
                ...state,
                textEditingNodeId: null,
                pendingNewText: null
            },
            commands: shouldRemoveNewText
                ? [
                      {
                          type: 'removeNode',
                          nodeId: event.nodeId
                      },
                      {
                          type: 'selectNode',
                          nodeId: state.pendingNewText.parentId
                      }
                  ]
                : []
        };
    }

    if (event.type === 'pointerDown') {
        if (event.payload.button !== 0) {
            return { state, commands: [] };
        }

        if (state.activeTool === 'text') {
            const parent = resolveParent(event.payload.nodePath);

            return {
                state: {
                    ...state,
                    activeTool: 'pointer',
                    pendingNewText: {
                        nodeId: null,
                        parentId: parent.parentId
                    }
                },
                commands: [
                    {
                        type: 'createNode',
                        payload: {
                            nodeType: 'text',
                            parentId: parent.parentId,
                            parentLayout: parent.parentLayout,
                            position: roundPoint({
                                x: event.payload.worldX,
                                y: event.payload.worldY
                            }),
                            selectAfterCreate: true,
                            startTextEditAfterCreate: true
                        }
                    },
                    { type: 'setActiveTool', tool: 'pointer' }
                ]
            };
        }

        if (
            state.activeTool === 'frame' ||
            state.activeTool === 'rectangle' ||
            state.activeTool === 'ellipse'
        ) {
            const parent = resolveParent(event.payload.nodePath);

            return {
                state: {
                    ...state,
                    mode: 'creatingShape',
                    draft: {
                        kind: 'shapeCreation',
                        tool: state.activeTool,
                        originWorld: {
                            x: event.payload.worldX,
                            y: event.payload.worldY
                        },
                        originScreen: {
                            x: event.payload.screenX,
                            y: event.payload.screenY
                        },
                        currentWorld: {
                            x: event.payload.worldX,
                            y: event.payload.worldY
                        },
                        targetParentId: parent.parentId,
                        targetParentLayout: parent.parentLayout
                    }
                },
                commands: []
            };
        }

        if (
            state.activeTool === 'pointer' &&
            canMoveSelectedNode(
                event.payload.selectedNode,
                event.payload.nodePath
            )
        ) {
            const selectedNode = event.payload.selectedNode;

            return {
                state: {
                    ...state,
                    mode: 'movingNode',
                    draft: {
                        kind: 'nodeMovement',
                        nodeId: selectedNode.nodeId,
                        originWorld: {
                            x: event.payload.worldX,
                            y: event.payload.worldY
                        },
                        originScreen: {
                            x: event.payload.screenX,
                            y: event.payload.screenY
                        },
                        initialPosition: selectedNode.position
                    }
                },
                commands: []
            };
        }

        return { state, commands: [] };
    }

    if (
        event.type === 'pointerMove' &&
        state.mode === 'creatingShape' &&
        state.draft?.kind === 'shapeCreation'
    ) {
        const x = Math.min(state.draft.originWorld.x, event.payload.worldX);
        const y = Math.min(state.draft.originWorld.y, event.payload.worldY);
        const width = Math.abs(
            event.payload.worldX - state.draft.originWorld.x
        );
        const height = Math.abs(
            event.payload.worldY - state.draft.originWorld.y
        );

        return {
            state: {
                ...state,
                draft: {
                    ...state.draft,
                    currentWorld: {
                        x: event.payload.worldX,
                        y: event.payload.worldY
                    }
                }
            },
            commands: [
                {
                    type: 'showCreationOverlay',
                    bounds: { x, y, width, height }
                }
            ]
        };
    }

    if (
        event.type === 'pointerUp' &&
        state.mode === 'creatingShape' &&
        state.draft?.kind === 'shapeCreation'
    ) {
        const deltaX = event.payload.screenX - state.draft.originScreen.x;
        const deltaY = event.payload.screenY - state.draft.originScreen.y;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance <= DRAG_THRESHOLD) {
            return {
                state: {
                    ...state,
                    mode: 'idle',
                    draft: null
                },
                commands: [{ type: 'clearCreationOverlay' }]
            };
        }

        const x = Math.min(state.draft.originWorld.x, event.payload.worldX);
        const y = Math.min(state.draft.originWorld.y, event.payload.worldY);
        const width = Math.abs(
            event.payload.worldX - state.draft.originWorld.x
        );
        const height = Math.abs(
            event.payload.worldY - state.draft.originWorld.y
        );

        return {
            state: {
                ...state,
                activeTool: 'pointer',
                mode: 'idle',
                draft: null
            },
            commands: [
                {
                    type: 'createNode',
                    payload: {
                        nodeType: state.draft.tool,
                        parentId: state.draft.targetParentId,
                        parentLayout: state.draft.targetParentLayout,
                        bounds: {
                            ...roundPoint({ x, y }),
                            width: Math.round(width),
                            height: Math.round(height)
                        },
                        selectAfterCreate: true,
                        startTextEditAfterCreate: false
                    }
                },
                { type: 'clearCreationOverlay' },
                { type: 'setActiveTool', tool: 'pointer' }
            ]
        };
    }

    if (
        (event.type === 'pointerMove' || event.type === 'pointerUp') &&
        state.mode === 'movingNode' &&
        state.draft?.kind === 'nodeMovement'
    ) {
        const distance = getDistanceFromOrigin({
            currentScreen: {
                x: event.payload.screenX,
                y: event.payload.screenY
            },
            originScreen: state.draft.originScreen
        });
        const nextState =
            event.type === 'pointerUp'
                ? {
                      ...state,
                      mode: 'idle' as const,
                      draft: null
                  }
                : state;

        if (distance <= DRAG_THRESHOLD) {
            return {
                state: nextState,
                commands: []
            };
        }

        return {
            state: nextState,
            commands: [
                {
                    type: 'moveNode',
                    nodeId: state.draft.nodeId,
                    position: getMovePosition({
                        currentWorld: {
                            x: event.payload.worldX,
                            y: event.payload.worldY
                        },
                        initialPosition: state.draft.initialPosition,
                        originWorld: state.draft.originWorld
                    })
                }
            ]
        };
    }

    return { state, commands: [] };
};
