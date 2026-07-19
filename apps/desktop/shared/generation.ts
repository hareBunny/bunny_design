/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaGenerationRun } from '@miaoma-design-ai/miaoma-agent-core';
import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

export const MIAOMA_GENERATION_IPC_CHANNELS = {
    start: 'miaoma:generation:start',
    cancel: 'miaoma:generation:cancel',
    latestRun: 'miaoma:generation:latest-run',
    event: 'miaoma:generation:event'
} as const;

export type MiaomaGenerationStartInput = {
    projectId: string;
    prompt: string;
    document: MiaomaDesignDocument;
    model?: string;
};

export type MiaomaGenerationStartResult =
    | {
          success: true;
          runId: string;
      }
    | {
          success: false;
          error: string;
      };

export type MiaomaGenerationCancelResult =
    | {
          success: true;
      }
    | {
          success: false;
          error: string;
      };

export type MiaomaGenerationLatestRunResult =
    | {
          success: true;
          run: MiaomaGenerationRun | null;
      }
    | {
          success: false;
          error: string;
      };

export type MiaomaGenerationEvent =
    | {
          type: 'run-updated';
          run: MiaomaGenerationRun;
      }
    | {
          type: 'document-updated';
          runId: string;
          revision: number;
          document: MiaomaDesignDocument;
      }
    | {
          type: 'run-finished';
          run: MiaomaGenerationRun;
          document: MiaomaDesignDocument;
      };
