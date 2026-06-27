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

import type {
    EditorDocument,
    EditorSession
} from '@miaoma-design-ai/miaoma-editor-core';
import { createEditorSession } from '@miaoma-design-ai/miaoma-editor-core';

type EditorSessionProviderProps = PropsWithChildren<{
    initialDocument: EditorDocument;
    initialSelectedNodeId?: string | null;
}>;

const EditorSessionContext = createContext<EditorSession | null>(null);

export const EditorSessionProvider = ({
    children,
    initialDocument,
    initialSelectedNodeId
}: EditorSessionProviderProps) => {
    const [session] = useState(() => {
        const nextSession = createEditorSession(initialDocument);

        if (initialSelectedNodeId) {
            nextSession.selectNode(initialSelectedNodeId);
        }

        return nextSession;
    });

    return (
        <EditorSessionContext.Provider value={session}>
            {children}
        </EditorSessionContext.Provider>
    );
};

export const useEditorSessionContext = () => {
    const session = useContext(EditorSessionContext);

    if (!session) {
        throw new Error('EditorSessionProvider is required');
    }

    return session;
};
