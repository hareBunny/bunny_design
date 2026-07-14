/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaCodexEvent,
    MiaomaCodexExecProvider,
    MiaomaCodexSandbox
} from '@miaoma-design-ai/miaoma-agent-codex';

import type {
    MiaomaDesignDocumentState,
    MiaomaDesignVisualCheck
} from './types';

export type MiaomaDesignScreenshot = {
    path: string;
};

export type MiaomaDesignScreenshotCapture = (input: {
    projectId: string;
    runId: string;
    document: MiaomaDesignDocumentState['document'];
    revision: number;
    attempt: number;
}) => Promise<MiaomaDesignScreenshot>;

export type MiaomaDesignVisualValidationResult = {
    check: MiaomaDesignVisualCheck;
    screenshot: MiaomaDesignScreenshot;
    threadId: string;
};

export type MiaomaDesignVisualLoopInput = {
    projectId: string;
    runId: string;
    prompt: string;
    state: MiaomaDesignDocumentState;
    attempt?: number;
    workingDirectory: string;
    model?: string;
    sandbox: MiaomaCodexSandbox;
    signal?: AbortSignal;
    maxRepairAttempts?: number;
    onEvent?: (event: MiaomaCodexEvent) => Promise<void> | void;
};

export type MiaomaDesignVisualLoopResult = {
    passed: boolean;
    attempts: number;
    state: MiaomaDesignDocumentState;
    checks: MiaomaDesignVisualValidationResult[];
};

export type MiaomaDesignVisualHarness = {
    validate(
        input: MiaomaDesignVisualLoopInput
    ): Promise<MiaomaDesignVisualValidationResult>;
    repair(input: {
        loop: MiaomaDesignVisualLoopInput;
        state: MiaomaDesignDocumentState;
        check: MiaomaDesignVisualValidationResult;
    }): Promise<MiaomaDesignDocumentState>;
    run(
        input: MiaomaDesignVisualLoopInput
    ): Promise<MiaomaDesignVisualLoopResult>;
};

export type MiaomaDesignVisualHarnessOptions = {
    codex: MiaomaCodexExecProvider;
    captureScreenshot: MiaomaDesignScreenshotCapture;
};
