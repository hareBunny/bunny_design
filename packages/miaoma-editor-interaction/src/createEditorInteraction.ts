/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createInitialInteractionState, reduceInteraction } from './reducer';
import type { EditorInteractionEvent, EditorInteractionState } from './types';

export type EditorInteraction = {
    getState(): EditorInteractionState;
    subscribe(listener: () => void): () => void;
    dispatch(
        event: EditorInteractionEvent
    ): ReturnType<typeof reduceInteraction>['commands'];
};

export const createEditorInteraction = (): EditorInteraction => {
    let state = createInitialInteractionState();
    const listeners = new Set<() => void>();

    return {
        getState: () => state,
        subscribe: (listener) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        dispatch: (event) => {
            const next = reduceInteraction(state, event);
            state = next.state;
            listeners.forEach((listener) => listener());
            return next.commands;
        }
    };
};
