/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaDesignVariables
} from '@miaoma-design-ai/miaoma-design-schema';

export const MIAOMA_MCP_CONFIG_NAME = 'miaomadesign';
export const MIAOMA_MCP_SERVER_VERSION = '1.0.0';

export type MiaomaMcpErrorCode =
    | 'APP_NOT_RUNNING'
    | 'ASSET_NOT_FOUND'
    | 'INTERNAL_ERROR'
    | 'INVALID_NODE_TYPE'
    | 'NO_ACTIVE_EDITOR'
    | 'NO_SELECTION'
    | 'NODE_NOT_FOUND'
    | 'RENDERER_UNAVAILABLE'
    | 'SCREENSHOT_FAILED';

export class MiaomaMcpError extends Error {
    readonly code: MiaomaMcpErrorCode;

    constructor(code: MiaomaMcpErrorCode, message: string) {
        super(message);
        this.name = 'MiaomaMcpError';
        this.code = code;
    }
}

export type MiaomaMcpActiveProject = {
    id: string | null;
    title: string;
};

export type MiaomaMcpAppState = {
    isRunning: boolean;
    activeProject: MiaomaMcpActiveProject | null;
    selectedNodeId: string | null;
    documentVersion: string | null;
    revision: number | null;
};

export type MiaomaMcpNodeContext = {
    project: MiaomaMcpActiveProject;
    documentVersion: string;
    revision: number;
    variables?: MiaomaDesignVariables;
    selectedNodeId: string | null;
    nodes: MiaomaDesignNode[];
};

export type MiaomaMcpImage = {
    data: string;
    mimeType: string;
};

export type MiaomaMcpAsset = MiaomaMcpImage & {
    assetId: string;
};

export type MiaomaMcpScreenshot = MiaomaMcpImage & {
    nodeId: string;
    width: number;
    height: number;
};

export type MiaomaMcpEditorSnapshot = {
    project: MiaomaMcpActiveProject;
    revision: number;
    selectedNodeId: string | null;
    document: MiaomaDesignDocument;
};

export type MiaomaMcpAppRequest =
    | { method: 'get_app_state' }
    | { method: 'get_selected_node' }
    | { method: 'get_nodes'; nodeIds: string[] }
    | { method: 'get_screenshot'; nodeId?: string }
    | { method: 'get_assets'; assetIds: string[] };

export type MiaomaMcpAppResult =
    | MiaomaMcpAppState
    | MiaomaMcpAsset[]
    | MiaomaMcpNodeContext
    | MiaomaMcpScreenshot;

export type MiaomaMcpAppClient = {
    getAppState(): Promise<MiaomaMcpAppState>;
    getSelectedNode(): Promise<MiaomaMcpNodeContext>;
    getNodes(input: { nodeIds: string[] }): Promise<MiaomaMcpNodeContext>;
    getScreenshot(input: { nodeId?: string }): Promise<MiaomaMcpScreenshot>;
    getAssets(input: { assetIds: string[] }): Promise<MiaomaMcpAsset[]>;
};

export type MiaomaMcpBridgeRequest = {
    id: string;
    request: MiaomaMcpAppRequest;
};

export type MiaomaMcpBridgeResponse =
    | {
          id: string;
          success: true;
          result: MiaomaMcpAppResult;
      }
    | {
          id: string;
          success: false;
          error: {
              code: MiaomaMcpErrorCode;
              message: string;
          };
      };
