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

export type InteractionPointerPayload = {
    worldX: number;
    worldY: number;
    screenX: number;
    screenY: number;
    button: number;
    nodePath: HitPathNode[];
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
                    parentLayout: 'absolute' | 'horizontal' | 'vertical';
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
                    parentLayout: 'absolute' | 'horizontal' | 'vertical';
                    position: { x: number; y: number };
                    selectAfterCreate: boolean;
                    startTextEditAfterCreate: true;
                };
      };

export type EditorInteractionState = {
    activeTool: CanvasToolId;
    mode: 'idle' | 'creatingShape';
    textEditingNodeId: string | null;
    draft:
        | null
        | {
              tool: 'frame' | 'rectangle' | 'ellipse';
              originWorld: { x: number; y: number };
              originScreen: { x: number; y: number };
              currentWorld: { x: number; y: number };
              targetParentId: string | null;
              targetParentLayout: 'absolute' | 'horizontal' | 'vertical';
          };
};
