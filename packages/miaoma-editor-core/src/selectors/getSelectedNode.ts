/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorNode } from '../model/node';
import type { EditorSnapshot } from '../session/types';

import { getNodeById } from './getNodeById';

export const getSelectedNode = (
    snapshot: EditorSnapshot
): EditorNode | null => {
    if (!snapshot.selection.selectedNodeId) {
        return null;
    }

    return getNodeById(snapshot.document, snapshot.selection.selectedNodeId);
};
