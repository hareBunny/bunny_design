/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaGenerationCancelResult,
    MiaomaGenerationEvent,
    MiaomaGenerationLatestRunResult,
    MiaomaGenerationStartInput,
    MiaomaGenerationStartResult
} from './shared/generation';
import type {
    MiaomaProjectCreateInput,
    MiaomaProjectDeleteResult,
    MiaomaProjectImportKind,
    MiaomaProjectImportResult,
    MiaomaProjectListResult,
    MiaomaProjectResult,
    MiaomaProjectSummary,
    MiaomaProjectUpdateInput
} from './shared/projects';
import type {
    MiaomaMcpCapturePayload,
    MiaomaMcpCaptureReadyInput,
    MiaomaMcpRendererRequest,
    MiaomaMcpRendererResponse
} from './shared/mcp';

declare global {
    interface Window {
        miaomaAPI: {
            ping: () => Promise<{ success: boolean }>;
            projects: {
                list: () => Promise<MiaomaProjectListResult>;
                create: (
                    input?: MiaomaProjectCreateInput
                ) => Promise<MiaomaProjectResult<MiaomaProjectSummary>>;
                importFromFile: (
                    kind: MiaomaProjectImportKind
                ) => Promise<MiaomaProjectImportResult>;
                get: (
                    projectId: string
                ) => Promise<MiaomaProjectResult<MiaomaProjectSummary>>;
                open: (
                    projectId: string
                ) => Promise<MiaomaProjectResult<MiaomaProjectSummary>>;
                update: (
                    projectId: string,
                    input: MiaomaProjectUpdateInput
                ) => Promise<MiaomaProjectResult<MiaomaProjectSummary>>;
                delete: (
                    projectId: string
                ) => Promise<MiaomaProjectDeleteResult>;
            };
            generation?: {
                start: (
                    input: MiaomaGenerationStartInput
                ) => Promise<MiaomaGenerationStartResult>;
                cancel: (
                    runId: string
                ) => Promise<MiaomaGenerationCancelResult>;
                getLatestRun: (
                    projectId: string
                ) => Promise<MiaomaGenerationLatestRunResult>;
                subscribe: (
                    listener: (event: MiaomaGenerationEvent) => void
                ) => () => void;
            };
            mcp?: {
                subscribeRendererRequests: (
                    listener: (request: MiaomaMcpRendererRequest) => void
                ) => () => void;
                respondToRendererRequest: (
                    response: MiaomaMcpRendererResponse
                ) => void;
                getCapturePayload: (
                    captureId: string
                ) => Promise<MiaomaMcpCapturePayload | null>;
                notifyCaptureReady: (
                    input: MiaomaMcpCaptureReadyInput
                ) => Promise<boolean>;
            };
        };
    }
}

declare module '*.png' {
    const src: string;
    export default src;
}

export {};
