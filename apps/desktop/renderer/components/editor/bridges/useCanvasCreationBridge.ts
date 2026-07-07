/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useCallback, useMemo, useState } from 'react';

import {
    createDefaultEllipseNode,
    createDefaultFrameNode,
    createDefaultRectangleNode,
    createDefaultTextNode,
    editorDocumentToRenderable
} from '@miaoma-design-ai/miaoma-editor-core';
import type {
    CanvasToolId,
    EditorInteractionCommand,
    InteractionPointerPayload
} from '@miaoma-design-ai/miaoma-editor-interaction';

import { useEditorInteraction } from '../state/useEditorInteraction';
import { useEditorSession } from '../state/useEditorSession';
import { useEditorSnapshot } from '../state/useEditorSnapshot';
import { findFrameRectInRenderer } from '../viewport/extractDesignNodePath';

type CreationDraft = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type TextEditorState = {
    nodeId: string;
    initialValue: string;
    isNew: boolean;
};

const DEFAULT_TEXT_DRAFT_WIDTH = 64;
const DEFAULT_TEXT_DRAFT_HEIGHT = 24;

export const useCanvasCreationBridge = () => {
    const session = useEditorSession();
    const snapshot = useEditorSnapshot();
    const { interaction, state } = useEditorInteraction();
    const [creationDraft, setCreationDraft] = useState<CreationDraft | null>(
        null
    );
    const [textEditorState, setTextEditorState] =
        useState<TextEditorState | null>(null);
    const renderableDocument = useMemo(
        () => editorDocumentToRenderable(snapshot.document),
        [snapshot.document]
    );
    const selectedNodeId = snapshot.selection.selectedNodeId;

    const resolveAbsolutePosition = useCallback(
        (payload: { parentId: string | null; x: number; y: number }) => {
            if (!payload.parentId) {
                return {
                    x: payload.x,
                    y: payload.y
                };
            }

            const parentRect = findFrameRectInRenderer(
                renderableDocument,
                payload.parentId
            );

            if (!parentRect) {
                return {
                    x: payload.x,
                    y: payload.y
                };
            }

            return {
                x: payload.x - parentRect.x,
                y: payload.y - parentRect.y
            };
        },
        [renderableDocument]
    );

    const applyCreateNodeCommand = useCallback(
        (
            command: Extract<EditorInteractionCommand, { type: 'createNode' }>
        ) => {
            if (command.payload.nodeType === 'text') {
                const absolutePosition =
                    command.payload.parentLayout === 'absolute'
                        ? resolveAbsolutePosition({
                              parentId: command.payload.parentId,
                              x: command.payload.position.x,
                              y: command.payload.position.y
                          })
                        : null;
                const nextNode = createDefaultTextNode({
                    content: '',
                    height: DEFAULT_TEXT_DRAFT_HEIGHT,
                    width: DEFAULT_TEXT_DRAFT_WIDTH,
                    x: absolutePosition?.x,
                    y: absolutePosition?.y
                });

                if (command.payload.parentId) {
                    session.appendChildNode(command.payload.parentId, nextNode);
                } else {
                    session.appendNode(nextNode);
                }

                if (command.payload.selectAfterCreate) {
                    session.selectNode(nextNode.id);
                }

                if (command.payload.startTextEditAfterCreate) {
                    interaction.dispatch({
                        type: 'textEditingStarted',
                        nodeId: nextNode.id
                    });
                    setTextEditorState({
                        initialValue: nextNode.content,
                        isNew: true,
                        nodeId: nextNode.id
                    });
                }

                return;
            }

            const absolutePosition =
                command.payload.parentLayout === 'absolute'
                    ? resolveAbsolutePosition({
                          parentId: command.payload.parentId,
                          x: command.payload.bounds.x,
                          y: command.payload.bounds.y
                      })
                    : null;
            const nextNode =
                command.payload.nodeType === 'frame'
                    ? createDefaultFrameNode({
                          height: command.payload.bounds.height,
                          width: command.payload.bounds.width,
                          x: absolutePosition?.x,
                          y: absolutePosition?.y
                      })
                    : command.payload.nodeType === 'rectangle'
                      ? createDefaultRectangleNode({
                            height: command.payload.bounds.height,
                            width: command.payload.bounds.width,
                            x: absolutePosition?.x,
                            y: absolutePosition?.y
                        })
                      : createDefaultEllipseNode({
                            height: command.payload.bounds.height,
                            width: command.payload.bounds.width,
                            x: absolutePosition?.x,
                            y: absolutePosition?.y
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
        [interaction, resolveAbsolutePosition, session]
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

    const scopeTextCreationPayload = useCallback(
        (payload: InteractionPointerPayload) => {
            if (!selectedNodeId) {
                return payload;
            }

            const selectedNode = session.getNodeById(selectedNodeId);

            if (!selectedNode || selectedNode.type !== 'frame') {
                return payload;
            }

            const selectedFrameIndex = payload.nodePath.findIndex(
                (node) => node.id === selectedNodeId
            );

            if (selectedFrameIndex === -1) {
                return payload;
            }

            return {
                ...payload,
                nodePath: payload.nodePath.slice(0, selectedFrameIndex + 1)
            };
        },
        [selectedNodeId, session]
    );

    const dispatchPointerEvent = useCallback(
        (
            type: 'pointerDown' | 'pointerMove' | 'pointerUp',
            payload: InteractionPointerPayload
        ) => {
            const activeTool = interaction.getState().activeTool;
            const nextPayload =
                type === 'pointerDown' && activeTool === 'text'
                    ? scopeTextCreationPayload(payload)
                    : payload;
            const commands = interaction.dispatch({
                payload: nextPayload,
                type
            });

            applyInteractionCommands(commands);
        },
        [applyInteractionCommands, interaction, scopeTextCreationPayload]
    );

    const handleTextCommit = useCallback(
        (value: string) => {
            if (!textEditorState) {
                return;
            }

            if (textEditorState.isNew) {
                if (value.trim().length > 0) {
                    session.patchNode(textEditorState.nodeId, {
                        content: value,
                        height: undefined,
                        width: undefined
                    });
                }
            } else {
                session.patchNode(textEditorState.nodeId, {
                    content: value
                });
            }

            const commands = interaction.dispatch({
                type: 'textEditCommit',
                nodeId: textEditorState.nodeId,
                content: value
            });

            applyInteractionCommands(commands);
            setTextEditorState(null);
        },
        [applyInteractionCommands, interaction, session, textEditorState]
    );

    const handleTextCancel = useCallback(() => {
        if (!textEditorState) {
            return;
        }

        const commands = interaction.dispatch({
            type: 'textEditCancel',
            nodeId: textEditorState.nodeId
        });

        applyInteractionCommands(commands);
        setTextEditorState(null);
    }, [applyInteractionCommands, interaction, textEditorState]);

    const startTextEditing = useCallback(
        (nodeId: string) => {
            if (selectedNodeId !== nodeId) {
                return;
            }

            const node = session.getNodeById(nodeId);

            if (!node || node.type !== 'text') {
                return;
            }

            interaction.dispatch({
                type: 'textEditingStarted',
                nodeId
            });
            setTextEditorState({
                initialValue: node.content,
                isNew: false,
                nodeId
            });
        },
        [interaction, selectedNodeId, session]
    );

    return useMemo(
        () => ({
            activeTool: state.activeTool,
            creationDraft,
            textEditorState,
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
            startTextEditing,
            handleTextCommit,
            handleTextCancel
        }),
        [
            creationDraft,
            dispatchPointerEvent,
            handleTextCancel,
            handleTextCommit,
            interaction,
            startTextEditing,
            state.activeTool,
            textEditorState
        ]
    );
};
