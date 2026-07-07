/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type CanvasToolId =
    | 'pointer'
    | 'frame'
    | 'rectangle'
    | 'ellipse'
    | 'text'
    | 'hand';

export type HitPathNode = {
    id: string;
    type: 'frame' | 'rectangle' | 'ellipse' | 'icon' | 'text';
    layout?: 'none' | 'horizontal' | 'vertical';
};

export type InteractionParentLayout = 'absolute' | 'horizontal' | 'vertical';

export type InteractionSelectedNode = {
    nodeId: string;
    parentId: string | null;
    parentLayout: InteractionParentLayout;
    position: { x: number; y: number };
    worldPosition: { x: number; y: number };
};

export type InteractionPointerPayload = {
    worldX: number;
    worldY: number;
    screenX: number;
    screenY: number;
    button: number;
    nodePath: HitPathNode[];
    selectedNode?: InteractionSelectedNode | null;
};

export type EditorInteractionEvent =
    | { type: 'selectTool'; tool: CanvasToolId }
    | { type: 'pointerDown'; payload: InteractionPointerPayload }
    | { type: 'pointerMove'; payload: InteractionPointerPayload }
    | { type: 'pointerUp'; payload: InteractionPointerPayload }
    | { type: 'pressEscape' }
    | { type: 'textEditingStarted'; nodeId: string }
    | { type: 'textEditCommit'; nodeId: string; content: string }
    | { type: 'textEditCancel'; nodeId: string };

export type EditorInteractionCommand =
    | { type: 'setActiveTool'; tool: CanvasToolId }
    | { type: 'selectNode'; nodeId: string | null }
    | { type: 'removeNode'; nodeId: string }
    | { type: 'moveNode'; nodeId: string; position: { x: number; y: number } }
    | {
          type: 'reparentNode';
          nodeId: string;
          parentId: string | null;
          parentLayout: InteractionParentLayout;
          dropPath?: HitPathNode[];
          worldPosition: { x: number; y: number };
      }
    | { type: 'clearCreationOverlay' }
    | {
          type: 'showCreationOverlay';
          bounds: { x: number; y: number; width: number; height: number };
      }
    | {
          type: 'createNode';
          payload:
              | {
                    nodeType: 'frame' | 'rectangle' | 'ellipse';
                    parentId: string | null;
                    parentLayout: InteractionParentLayout;
                    bounds: {
                        x: number;
                        y: number;
                        width: number;
                        height: number;
                    };
                    selectAfterCreate: boolean;
                    startTextEditAfterCreate: false;
                }
              | {
                    nodeType: 'text';
                    parentId: string | null;
                    parentLayout: InteractionParentLayout;
                    position: { x: number; y: number };
                    selectAfterCreate: boolean;
                    startTextEditAfterCreate: true;
                };
      };

export type EditorInteractionState = {
    activeTool: CanvasToolId;
    mode: 'idle' | 'creatingShape' | 'movingNode';
    textEditingNodeId: string | null;
    pendingNewText: null | {
        nodeId: string | null;
        parentId: string | null;
    };
    draft:
        | null
        | {
              kind: 'shapeCreation';
              tool: 'frame' | 'rectangle' | 'ellipse';
              originWorld: { x: number; y: number };
              originScreen: { x: number; y: number };
              currentWorld: { x: number; y: number };
              targetParentId: string | null;
              targetParentLayout: InteractionParentLayout;
          }
        | {
              kind: 'nodeMovement';
              nodeId: string;
              initialParentId: string | null;
              initialParentLayout: InteractionParentLayout;
              originWorld: { x: number; y: number };
              originScreen: { x: number; y: number };
              initialPosition: { x: number; y: number };
              initialWorldPosition: { x: number; y: number };
          };
};
