/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { appendChildNode } from '../commands/appendChildNode';
import { appendNode } from '../commands/appendNode';
import { insertChildNode } from '../commands/insertChildNode';
import { removeNode } from '../commands/removeNode';
import { reparentNode } from '../commands/reparentNode';
import type { EditorDocument } from '../model/document';
import type { EditorNode } from '../model/node';
import type { EditorStyleArrayField, EditorStyleItem } from '../model/style';
import { getNodeById as selectNodeById } from '../selectors/getNodeById';
import { getSelectedNode as selectSelectedNode } from '../selectors/getSelectedNode';

import type { EditorSession, EditorSnapshot } from './types';

const createInitialSnapshot = (document: EditorDocument): EditorSnapshot => ({
    document,
    selection: {
        selectedNodeId: null
    },
    inspectorUi: {
        activeFillId: null,
        activeStrokeId: null,
        activeEffectId: null
    }
});

const getNextActiveStyleId = (
    node: EditorNode | null,
    field: EditorStyleArrayField
) => {
    if (!node) {
        return null;
    }

    return node[field][0]?.id ?? null;
};

const updateNodeCollection = (
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
            children: updateNodeCollection(node.children, nodeId, updater)
        };
    });

const replaceNodeInDocument = (
    document: EditorDocument,
    nodeId: string,
    updater: (node: EditorNode) => EditorNode
): EditorDocument => ({
    ...document,
    children: updateNodeCollection(document.children, nodeId, updater)
});

const findParentFrameId = (
    nodes: EditorNode[],
    nodeId: string,
    parentFrameId: string | null = null
): string | null => {
    for (const node of nodes) {
        if (node.id === nodeId) {
            return parentFrameId;
        }

        if (node.type !== 'frame') {
            continue;
        }

        const nextParentFrameId = findParentFrameId(
            node.children,
            nodeId,
            node.id
        );

        if (nextParentFrameId !== null) {
            return nextParentFrameId;
        }
    }

    return null;
};

export const createEditorSession = (
    document: EditorDocument
): EditorSession => {
    let snapshot = createInitialSnapshot(document);
    const listeners = new Set<() => void>();

    const notify = () => {
        listeners.forEach((listener) => {
            listener();
        });
    };

    return {
        getSnapshot: () => snapshot,
        subscribe: (listener) => {
            listeners.add(listener);

            return () => {
                listeners.delete(listener);
            };
        },
        getNodeById: (nodeId) => selectNodeById(snapshot.document, nodeId),
        getSelectedNode: () => selectSelectedNode(snapshot),
        selectNode: (nodeId) => {
            if (snapshot.selection.selectedNodeId === nodeId) {
                return;
            }

            const nextSelectedNode =
                nodeId === null
                    ? null
                    : selectNodeById(snapshot.document, nodeId);

            snapshot = {
                ...snapshot,
                selection: {
                    ...snapshot.selection,
                    selectedNodeId: nodeId
                },
                inspectorUi: {
                    activeFillId: getNextActiveStyleId(
                        nextSelectedNode,
                        'fills'
                    ),
                    activeStrokeId: getNextActiveStyleId(
                        nextSelectedNode,
                        'strokes'
                    ),
                    activeEffectId: getNextActiveStyleId(
                        nextSelectedNode,
                        'effects'
                    )
                }
            };
            notify();
        },
        appendNode: (node) => {
            snapshot = {
                ...snapshot,
                document: appendNode(snapshot.document, node)
            };
            notify();
        },
        appendChildNode: (parentId, node) => {
            snapshot = {
                ...snapshot,
                document: appendChildNode(snapshot.document, parentId, node)
            };
            notify();
        },
        insertChildNode: (parentId, index, node) => {
            snapshot = {
                ...snapshot,
                document: insertChildNode(
                    snapshot.document,
                    parentId,
                    index,
                    node
                )
            };
            notify();
        },
        reparentNode: (nodeId, parentId, patch, index) => {
            const currentNode = selectNodeById(snapshot.document, nodeId);

            if (!currentNode) {
                return;
            }

            snapshot = {
                ...snapshot,
                document: reparentNode(
                    snapshot.document,
                    nodeId,
                    parentId,
                    {
                        ...currentNode,
                        ...patch
                    },
                    index
                )
            };
            notify();
        },
        removeNode: (nodeId) => {
            const fallbackNodeId = findParentFrameId(
                snapshot.document.children,
                nodeId
            );
            const nextDocument = removeNode(snapshot.document, nodeId);
            const nextSelectedNodeId = snapshot.selection.selectedNodeId;
            const hasSelectedNode =
                nextSelectedNodeId !== null &&
                selectNodeById(nextDocument, nextSelectedNodeId) !== null;
            const nextSelectedNode = hasSelectedNode
                ? nextSelectedNodeId === null
                    ? null
                    : selectNodeById(nextDocument, nextSelectedNodeId)
                : fallbackNodeId === null
                  ? null
                  : selectNodeById(nextDocument, fallbackNodeId);

            snapshot = {
                ...snapshot,
                document: nextDocument,
                selection: {
                    ...snapshot.selection,
                    selectedNodeId: hasSelectedNode
                        ? nextSelectedNodeId
                        : fallbackNodeId
                },
                inspectorUi: {
                    activeFillId: getNextActiveStyleId(
                        nextSelectedNode,
                        'fills'
                    ),
                    activeStrokeId: getNextActiveStyleId(
                        nextSelectedNode,
                        'strokes'
                    ),
                    activeEffectId: getNextActiveStyleId(
                        nextSelectedNode,
                        'effects'
                    )
                }
            };
            notify();
        },
        patchNode: (nodeId, patch) => {
            snapshot = {
                ...snapshot,
                document: replaceNodeInDocument(
                    snapshot.document,
                    nodeId,
                    (node) => ({
                        ...node,
                        ...patch
                    })
                )
            };
            notify();
        },
        replaceNode: (nodeId, nextNode) => {
            snapshot = {
                ...snapshot,
                document: replaceNodeInDocument(
                    snapshot.document,
                    nodeId,
                    () => nextNode
                )
            };
            notify();
        },
        appendStyleItem: (nodeId, field, item) => {
            snapshot = {
                ...snapshot,
                document: replaceNodeInDocument(
                    snapshot.document,
                    nodeId,
                    (node) => ({
                        ...node,
                        [field]: [...node[field], item]
                    })
                )
            };
            notify();
        },
        updateStyleItem: (nodeId, field, itemId, patch) => {
            snapshot = {
                ...snapshot,
                document: replaceNodeInDocument(
                    snapshot.document,
                    nodeId,
                    (node) => ({
                        ...node,
                        [field]: node[field].map((item) =>
                            item.id === itemId
                                ? ({
                                      ...item,
                                      ...patch
                                  } as EditorStyleItem)
                                : item
                        )
                    })
                )
            };
            notify();
        },
        removeStyleItem: (nodeId, field, itemId) => {
            snapshot = {
                ...snapshot,
                document: replaceNodeInDocument(
                    snapshot.document,
                    nodeId,
                    (node) => ({
                        ...node,
                        [field]: node[field].filter(
                            (item) => item.id !== itemId
                        )
                    })
                )
            };
            notify();
        },
        setActiveStyleItem: (field, itemId) => {
            snapshot = {
                ...snapshot,
                inspectorUi: {
                    ...snapshot.inspectorUi,
                    [field === 'fills'
                        ? 'activeFillId'
                        : field === 'strokes'
                          ? 'activeStrokeId'
                          : 'activeEffectId']: itemId
                }
            };
            notify();
        }
    };
};
