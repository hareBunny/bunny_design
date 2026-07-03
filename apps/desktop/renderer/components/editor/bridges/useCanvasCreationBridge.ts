/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useCallback, useMemo, useState } from 'react';

import {
    createDefaultEllipseNode,
    createDefaultFrameNode,
    createDefaultRectangleNode
} from '@miaoma-design-ai/miaoma-editor-core';
import type {
    CanvasToolId,
    EditorInteractionCommand,
    InteractionPointerPayload
} from '@miaoma-design-ai/miaoma-editor-interaction';

import { useEditorInteraction } from '../state/useEditorInteraction';
import { useEditorSession } from '../state/useEditorSession';

type CreationDraft = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const isShapeCreationTool = (
    tool: CanvasToolId
): tool is 'ellipse' | 'frame' | 'rectangle' =>
    tool === 'frame' || tool === 'rectangle' || tool === 'ellipse';

export const useCanvasCreationBridge = () => {
    const session = useEditorSession();
    const { interaction, state } = useEditorInteraction();
    const [creationDraft, setCreationDraft] = useState<CreationDraft | null>(
        null
    );

    const applyCreateNodeCommand = useCallback(
        (
            command: Extract<EditorInteractionCommand, { type: 'createNode' }>
        ) => {
            if (
                command.payload.nodeType !== 'frame' &&
                command.payload.nodeType !== 'rectangle' &&
                command.payload.nodeType !== 'ellipse'
            ) {
                return;
            }

            const nextNode =
                command.payload.nodeType === 'frame'
                    ? createDefaultFrameNode({
                          height: command.payload.bounds.height,
                          width: command.payload.bounds.width,
                          x:
                              command.payload.parentLayout === 'absolute'
                                  ? command.payload.bounds.x
                                  : undefined,
                          y:
                              command.payload.parentLayout === 'absolute'
                                  ? command.payload.bounds.y
                                  : undefined
                      })
                    : command.payload.nodeType === 'rectangle'
                      ? createDefaultRectangleNode({
                            height: command.payload.bounds.height,
                            width: command.payload.bounds.width,
                            x:
                                command.payload.parentLayout === 'absolute'
                                    ? command.payload.bounds.x
                                    : undefined,
                            y:
                                command.payload.parentLayout === 'absolute'
                                    ? command.payload.bounds.y
                                    : undefined
                        })
                      : createDefaultEllipseNode({
                            height: command.payload.bounds.height,
                            width: command.payload.bounds.width,
                            x:
                                command.payload.parentLayout === 'absolute'
                                    ? command.payload.bounds.x
                                    : undefined,
                            y:
                                command.payload.parentLayout === 'absolute'
                                    ? command.payload.bounds.y
                                    : undefined
                        });

            if (command.payload.parentId) {
                session.appendChildNode(command.payload.parentId, nextNode);
            } else {
                session.appendNode(nextNode);
            }

            if (command.payload.selectAfterCreate) {
                session.selectNode(nextNode.id);
            }
        },
        [session]
    );

    const applyInteractionCommands = useCallback(
        (commands: EditorInteractionCommand[]) => {
            commands.forEach((command) => {
                switch (command.type) {
                    case 'showCreationOverlay':
                        setCreationDraft(command.bounds);
                        break;
                    case 'clearCreationOverlay':
                        setCreationDraft(null);
                        break;
                    case 'createNode':
                        applyCreateNodeCommand(command);
                        break;
                    case 'selectNode':
                        session.selectNode(command.nodeId);
                        break;
                    case 'removeNode':
                        session.removeNode(command.nodeId);
                        break;
                    case 'setActiveTool':
                        break;
                }
            });
        },
        [applyCreateNodeCommand, session]
    );

    const dispatchPointerEvent = useCallback(
        (
            type: 'pointerDown' | 'pointerMove' | 'pointerUp',
            payload: InteractionPointerPayload
        ) => {
            if (!isShapeCreationTool(interaction.getState().activeTool)) {
                return;
            }

            const commands = interaction.dispatch({
                payload,
                type
            });

            applyInteractionCommands(commands);
        },
        [applyInteractionCommands, interaction]
    );

    return useMemo(
        () => ({
            activeTool: state.activeTool,
            creationDraft,
            textEditorState: null,
            selectTool: (tool: CanvasToolId) => {
                interaction.dispatch({ type: 'selectTool', tool });
            },
            handleViewportPointerDown: (payload: InteractionPointerPayload) => {
                dispatchPointerEvent('pointerDown', payload);
            },
            handleViewportPointerMove: (payload: InteractionPointerPayload) => {
                dispatchPointerEvent('pointerMove', payload);
            },
            handleViewportPointerUp: (payload: InteractionPointerPayload) => {
                dispatchPointerEvent('pointerUp', payload);
            },
            handleTextCommit: () => undefined,
            handleTextCancel: () => undefined
        }),
        [creationDraft, dispatchPointerEvent, interaction, state.activeTool]
    );
};
