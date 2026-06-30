/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorNode } from '../model/node';

export const mapNodes = (
    nodes: EditorNode[],
    mapper: (node: EditorNode) => EditorNode
): EditorNode[] =>
    nodes.map((node) => {
        const nextNode =
            node.type === 'frame'
                ? {
                      ...node,
                      children: mapNodes(node.children, mapper)
                  }
                : node;

        return mapper(nextNode);
    });

export const updateNodes = (
    nodes: EditorNode[],
    nodeId: string,
    updater: (node: EditorNode) => EditorNode
): EditorNode[] =>
    nodes.map((node) => {
        if (node.id === nodeId) {
            return updater(node);
        }

        if (node.type !== 'frame') {
            return node;
        }

        return {
            ...node,
            children: updateNodes(node.children, nodeId, updater)
        };
    });

export const clampInsertIndex = (index: number, length: number) => {
    if (index <= 0) {
        return 0;
    }

    if (index >= length) {
        return length;
    }

    return index;
};
