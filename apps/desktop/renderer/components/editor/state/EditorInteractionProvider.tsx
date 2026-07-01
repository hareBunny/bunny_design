/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    createContext,
    type PropsWithChildren,
    useContext,
    useState
} from 'react';

import {
    createEditorInteraction,
    type EditorInteraction
} from '@miaoma-design-ai/miaoma-editor-interaction';

const EditorInteractionContext = createContext<EditorInteraction | null>(null);

export const EditorInteractionProvider = ({ children }: PropsWithChildren) => {
    const [interaction] = useState(() => createEditorInteraction());

    return (
        <EditorInteractionContext.Provider value={interaction}>
            {children}
        </EditorInteractionContext.Provider>
    );
};

export const useEditorInteractionContext = () => {
    const interaction = useContext(EditorInteractionContext);

    if (!interaction) {
        throw new Error('EditorInteractionProvider is required');
    }

    return interaction;
};

export const useOptionalEditorInteractionContext = () =>
    useContext(EditorInteractionContext);
