/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignNode
} from '@miaoma-design-ai/miaoma-design-schema';
import type { MiaomaMcpEditorSnapshot } from '@miaoma-design-ai/miaoma-mcp';

export const MIAOMA_MCP_IPC_CHANNELS = {
    rendererRequest: 'miaoma:mcp:renderer-request',
    rendererResponse: 'miaoma:mcp:renderer-response',
    capturePayload: 'miaoma:mcp:capture-payload',
    captureReady: 'miaoma:mcp:capture-ready'
} as const;

export type MiaomaMcpRendererRequest = {
    requestId: string;
    measuredNodeId?: string;
};

export type MiaomaMcpMeasuredNodeSize = {
    width: number;
    height: number;
};

export type MiaomaMcpRendererSnapshot = MiaomaMcpEditorSnapshot & {
    measuredNodeSize?: MiaomaMcpMeasuredNodeSize;
};

export type MiaomaMcpRendererResponse =
    | {
          requestId: string;
          success: true;
          snapshot: MiaomaMcpRendererSnapshot;
      }
    | {
          requestId: string;
          success: false;
          error: string;
      };

export type MiaomaMcpCapturePayload = {
    captureId: string;
    document: MiaomaDesignDocument;
    node: Extract<MiaomaDesignNode, { type: 'frame' }>;
};

export type MiaomaMcpCaptureReadyInput = {
    captureId: string;
    width: number;
    height: number;
};
