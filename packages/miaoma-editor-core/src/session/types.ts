/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorDocument } from '../model/document';
import type {
    EditorFrameNode,
    EditorIconNode,
    EditorNode,
    EditorRectangleNode,
    EditorTextNode
} from '../model/node';
import type {
    EditorSelectionState,
    InspectorUiState
} from '../model/selection';
import type {
    EditorStyleArrayField,
    EditorStyleItem,
    EditorStyleItemPatch
} from '../model/style';

export type EditorNodePatch = {
    name?: EditorNode['name'];
    opacity?: EditorNode['opacity'];
    x?: EditorNode['x'];
    y?: EditorNode['y'];
    rotation?: EditorNode['rotation'];
    fills?: EditorNode['fills'];
    strokes?: EditorNode['strokes'];
    effects?: EditorNode['effects'];
    width?: EditorFrameNode['width'];
    height?: EditorFrameNode['height'];
    clip?: EditorFrameNode['clip'];
    layout?: EditorFrameNode['layout'];
    gap?: EditorFrameNode['gap'];
    padding?: EditorFrameNode['padding'];
    justifyContent?: EditorFrameNode['justifyContent'];
    alignItems?: EditorFrameNode['alignItems'];
    cornerRadius?:
        | EditorFrameNode['cornerRadius']
        | EditorRectangleNode['cornerRadius'];
    children?: EditorFrameNode['children'];
    icon?: EditorIconNode['icon'];
    library?: EditorIconNode['library'];
    content?: EditorTextNode['content'];
    textGrowth?: EditorTextNode['textGrowth'];
    textAlign?: EditorTextNode['textAlign'];
    fontFamily?: EditorTextNode['fontFamily'];
    fontSize?: EditorTextNode['fontSize'];
    fontWeight?: EditorTextNode['fontWeight'];
    lineHeight?: EditorTextNode['lineHeight'];
};

export type EditorSnapshot = {
    document: EditorDocument;
    selection: EditorSelectionState;
    inspectorUi: InspectorUiState;
};

export type EditorSession = {
    getSnapshot(): EditorSnapshot;
    subscribe(listener: () => void): () => void;
    getNodeById(nodeId: string): EditorNode | null;
    getSelectedNode(): EditorNode | null;
    selectNode(nodeId: string | null): void;
    appendNode(node: EditorNode): void;
    appendChildNode(parentId: string, node: EditorNode): void;
    insertChildNode(parentId: string, index: number, node: EditorNode): void;
    reparentNode(
        nodeId: string,
        parentId: string | null,
        patch?: EditorNodePatch,
        index?: number
    ): void;
    removeNode(nodeId: string): void;
    patchNode(nodeId: string, patch: EditorNodePatch): void;
    replaceNode(nodeId: string, nextNode: EditorNode): void;
    appendStyleItem(
        nodeId: string,
        field: EditorStyleArrayField,
        item: EditorStyleItem
    ): void;
    updateStyleItem(
        nodeId: string,
        field: EditorStyleArrayField,
        itemId: string,
        patch: EditorStyleItemPatch
    ): void;
    removeStyleItem(
        nodeId: string,
        field: EditorStyleArrayField,
        itemId: string
    ): void;
    setActiveStyleItem(
        field: EditorStyleArrayField,
        itemId: string | null
    ): void;
};
