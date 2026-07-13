/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaAgentJsonObject,
    MiaomaAgentJsonValue
} from '@miaoma-design-ai/miaoma-agent-core';

export type MiaomaCodexSandbox =
    | 'danger-full-access'
    | 'read-only'
    | 'workspace-write';

export type MiaomaCodexConversation =
    | { type: 'new' }
    | { type: 'resume'; threadId: string };

export type MiaomaCodexResponseRequest =
    | { format: 'json'; schemaPath: string }
    | { format: 'text' };

export type MiaomaCodexActivityDraft =
    | {
          sourceItemId: string;
          kind: 'bash';
          status: 'running';
          input: MiaomaAgentJsonObject;
      }
    | {
          sourceItemId: string;
          kind: 'bash';
          status: 'completed';
          input: MiaomaAgentJsonObject;
          output: { summary: string };
      }
    | {
          sourceItemId: string;
          kind: 'bash';
          status: 'failed';
          input: MiaomaAgentJsonObject;
          output: { summary: string };
          error: { code: string; message: string };
      };

export type MiaomaCodexEvent =
    | { type: 'thread-started'; threadId: string }
    | { type: 'turn-started' }
    | { type: 'activity'; activity: MiaomaCodexActivityDraft }
    | { type: 'message'; text: string }
    | { type: 'turn-completed'; usage?: MiaomaAgentJsonObject }
    | {
          type: 'turn-failed';
          error: { code: string; message: string };
      };

type MiaomaCodexExecRequestBase = {
    prompt: string;
    workingDirectory: string;
    sandbox: MiaomaCodexSandbox;
    conversation: MiaomaCodexConversation;
    model?: string;
    signal?: AbortSignal;
    onEvent?: (event: MiaomaCodexEvent) => Promise<void> | void;
};

export type MiaomaCodexExecRequest = MiaomaCodexExecRequestBase & {
    response: MiaomaCodexResponseRequest;
};

export type MiaomaCodexExecResult = {
    threadId: string;
    response:
        | { format: 'json'; value: MiaomaAgentJsonValue }
        | { format: 'text'; value: string };
    usage?: MiaomaAgentJsonObject;
};

export type MiaomaCodexExecErrorCode =
    | 'cancelled'
    | 'invalid-jsonl'
    | 'invalid-structured-output'
    | 'missing-output'
    | 'process-failed'
    | 'turn-failed';

export class MiaomaCodexExecError extends Error {
    readonly code: MiaomaCodexExecErrorCode;
    readonly exitCode?: number | null;

    constructor({
        code,
        message,
        exitCode
    }: {
        code: MiaomaCodexExecErrorCode;
        message: string;
        exitCode?: number | null;
    }) {
        super(message);
        this.name = 'MiaomaCodexExecError';
        this.code = code;
        this.exitCode = exitCode;
    }
}

export type MiaomaCodexExecProvider = {
    execute(request: MiaomaCodexExecRequest): Promise<MiaomaCodexExecResult>;
};
