/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

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
        };
    }
}

declare module '*.png' {
    const src: string;
    export default src;
}

export {};
