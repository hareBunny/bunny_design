/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export { editorDocumentToRenderable } from './adapters/editorDocumentToRenderable';
export { schemaToEditorDocument } from './adapters/schemaToEditorDocument';
export { appendChildNode } from './commands/appendChildNode';
export { appendNode } from './commands/appendNode';
export { insertChildNode } from './commands/insertChildNode';
export { removeNode } from './commands/removeNode';
export { reparentNode } from './commands/reparentNode';
export { createDefaultEllipseNode } from './factories/createDefaultEllipseNode';
export { createDefaultFrameNode } from './factories/createDefaultFrameNode';
export { createDefaultRectangleNode } from './factories/createDefaultRectangleNode';
export { createDefaultTextNode } from './factories/createDefaultTextNode';
export type { EditorDocument } from './model/document';
export type {
    EditorEllipseNode,
    EditorFrameNode,
    EditorIconNode,
    EditorNode,
    EditorRectangleNode,
    EditorTextNode
} from './model/node';
export type {
    EditorAlignItems,
    EditorCornerRadius,
    EditorDimension,
    EditorJustifyContent,
    EditorLayoutDirection,
    EditorSpacing
} from './model/primitives';
export type { EditorSelectionState, InspectorUiState } from './model/selection';
export type {
    EditorStyleArrayField,
    EditorStyleItem,
    EditorStyleItemPatch,
    EffectItem,
    FillItem,
    StrokeItem
} from './model/style';
export { getNodeById } from './selectors/getNodeById';
export { getSelectedNode } from './selectors/getSelectedNode';
export { createEditorSession } from './session/createEditorSession';
export type {
    EditorNodePatch,
    EditorSession,
    EditorSnapshot
} from './session/types';
