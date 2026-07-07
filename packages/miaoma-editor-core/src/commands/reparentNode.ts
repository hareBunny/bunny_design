/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';
import { getNodeById } from '../selectors/getNodeById';

import { appendChildNode } from './appendChildNode';
import { appendNode } from './appendNode';
import { insertChildNode } from './insertChildNode';

const nodeContainsId = (node: EditorNode, targetId: string): boolean => {
    if (node.id === targetId) {
        return true;
    }

    if (node.type !== 'frame') {
        return false;
    }

    return node.children.some((child) => nodeContainsId(child, targetId));
};

const detachNode = (
    nodes: EditorNode[],
    nodeId: string
): {
    detachedNode: EditorNode | null;
    nextNodes: EditorNode[];
} => {
    let detachedNode: EditorNode | null = null;

    const nextNodes = nodes.flatMap((node) => {
        if (node.id === nodeId) {
            detachedNode = node;
            return [];
        }

        if (node.type !== 'frame') {
            return [node];
        }

        const nested = detachNode(node.children, nodeId);

        if (!nested.detachedNode) {
            return [node];
        }

        detachedNode = nested.detachedNode;

        return [
            {
                ...node,
                children: nested.nextNodes
            }
        ];
    });

    return {
        detachedNode,
        nextNodes
    };
};

export const reparentNode = (
    document: EditorDocument,
    nodeId: string,
    parentId: string | null,
    nextNode?: EditorNode,
    index?: number
): EditorDocument => {
    const currentNode = getNodeById(document, nodeId);

    if (!currentNode) {
        return document;
    }

    if (parentId === nodeId) {
        return document;
    }

    if (parentId !== null) {
        const targetParent = getNodeById(document, parentId);

        if (!targetParent || targetParent.type !== 'frame') {
            return document;
        }

        if (nodeContainsId(currentNode, parentId)) {
            return document;
        }
    }

    const detached = detachNode(document.children, nodeId);

    if (!detached.detachedNode) {
        return document;
    }

    const nextDocument = {
        ...document,
        children: detached.nextNodes
    };
    const nodeToInsert = nextNode ?? detached.detachedNode;

    return parentId === null
        ? appendNode(nextDocument, nodeToInsert)
        : typeof index === 'number'
          ? insertChildNode(nextDocument, parentId, index, nodeToInsert)
          : appendChildNode(nextDocument, parentId, nodeToInsert);
};
