/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';

import { clampInsertIndex, updateNodes } from './treeUtils';

export const insertChildNode = (
    document: EditorDocument,
    parentId: string,
    index: number,
    node: EditorNode
): EditorDocument => ({
    ...document,
    children: updateNodes(document.children, parentId, (current) => {
        if (current.type !== 'frame') {
            return current;
        }

        const nextIndex = clampInsertIndex(index, current.children.length);

        return {
            ...current,
            children: [
                ...current.children.slice(0, nextIndex),
                node,
                ...current.children.slice(nextIndex)
            ]
        };
    })
});
