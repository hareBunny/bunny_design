/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaCodexExecProvider,
    MiaomaCodexSandbox
} from '@miaoma-design-ai/miaoma-agent-codex';
import type { MiaomaGenerationHistoryStore } from '@miaoma-design-ai/miaoma-agent-history';
import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import type { MiaomaDesignVisualHarness } from './harnessTypes';
import type { MiaomaDesignDocumentState } from './types';

export type MiaomaDesignGenerationStartInput = {
    projectId: string;
    prompt: string;
    documentState: MiaomaDesignDocumentState;
    workingDirectory?: string;
    maxRepairAttempts?: number;
    model?: string;
    sandbox?: MiaomaCodexSandbox;
    onDocumentUpdated?: (
        state: MiaomaDesignDocumentState
    ) => Promise<void> | void;
};

export type MiaomaDesignGenerationResult = {
    run: import('@miaoma-design-ai/miaoma-agent-core').MiaomaGenerationRun;
    document: MiaomaDesignDocument;
};

export type MiaomaDesignGenerationExecution = {
    runId: string;
    cancel(): void;
    result: Promise<MiaomaDesignGenerationResult>;
};

export type MiaomaDesignGenerationOrchestrator = {
    start(
        input: MiaomaDesignGenerationStartInput
    ): MiaomaDesignGenerationExecution;
};

export type MiaomaDesignGenerationOrchestratorOptions = {
    codex: MiaomaCodexExecProvider;
    history: MiaomaGenerationHistoryStore;
    visualHarness?: MiaomaDesignVisualHarness;
    now?: () => Date;
    createRunId?: () => string;
};
