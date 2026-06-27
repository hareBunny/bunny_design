/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';

const walkNodes = (nodes: EditorNode[], nodeId: string): EditorNode | null => {
    for (const node of nodes) {
        if (node.id === nodeId) {
            return node;
        }

        if (node.type === 'frame') {
            const nestedMatch = walkNodes(node.children, nodeId);

            if (nestedMatch) {
                return nestedMatch;
            }
        }
    }

    return null;
};

export const getNodeById = (
    document: EditorDocument,
    nodeId: string
): EditorNode | null => walkNodes(document.children, nodeId);
