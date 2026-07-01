/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useMemo, useState } from 'react';

import type {
    CanvasToolId,
    InteractionPointerPayload
} from '@miaoma-design-ai/miaoma-editor-interaction';

import { useEditorInteraction } from '../state/useEditorInteraction';

type CreationDraft = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const useCanvasCreationBridge = () => {
    const { interaction, state } = useEditorInteraction();
    const [creationDraft] = useState<CreationDraft | null>(null);

    return useMemo(
        () => ({
            activeTool: state.activeTool,
            creationDraft,
            textEditorState: null,
            selectTool: (tool: CanvasToolId) => {
                interaction.dispatch({ type: 'selectTool', tool });
            },
            handleViewportPointerDown: (payload: InteractionPointerPayload) => {
                void payload;
            },
            handleViewportPointerMove: (payload: InteractionPointerPayload) => {
                void payload;
            },
            handleViewportPointerUp: (payload: InteractionPointerPayload) => {
                void payload;
            },
            handleTextCommit: () => undefined,
            handleTextCancel: () => undefined
        }),
        [creationDraft, interaction, state.activeTool]
    );
};
