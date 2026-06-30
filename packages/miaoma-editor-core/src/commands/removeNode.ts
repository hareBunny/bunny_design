/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';

export const removeNode = (
    document: EditorDocument,
    nodeId: string
): EditorDocument => ({
    ...document,
    children: removeNodes(document.children, nodeId)
});

const removeNodes = (nodes: EditorNode[], nodeId: string): EditorNode[] =>
    nodes.flatMap((node) => {
        if (node.id === nodeId) {
            return [];
        }

        if (node.type !== 'frame') {
            return [node];
        }

        return [
            {
                ...node,
                children: removeNodes(node.children, nodeId)
            }
        ];
    });
