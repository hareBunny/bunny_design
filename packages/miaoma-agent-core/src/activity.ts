/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaAgentId } from './agents';
import type { MiaomaAgentJsonObject } from './json';

export const MIAOMA_AGENT_ACTIVITY_LABELS = {
    bash: 'Bash',
    'read-variables': 'Read variables',
    'set-variables': 'Set variables',
    'read-objects': 'Read objects',
    'check-guidelines': 'Checked guidelines',
    'plan-visual': 'Planned visual',
    design: 'Designed',
    'visual-check': 'Visual check',
    repair: 'Repair'
} as const;

export type MiaomaAgentActivityKind = keyof typeof MIAOMA_AGENT_ACTIVITY_LABELS;

export type MiaomaAgentActivityOutput = {
    summary: string;
};

type MiaomaAgentActivityBase = {
    activityId: string;
    runId: string;
    agentId: MiaomaAgentId;
    assignmentId?: string;
    kind: MiaomaAgentActivityKind;
    input: MiaomaAgentJsonObject;
    createdAt: string;
};

export type MiaomaAgentActivity =
    | (MiaomaAgentActivityBase & {
          status: 'running';
          startedAt: string;
      })
    | (MiaomaAgentActivityBase & {
          status: 'completed';
          startedAt: string;
          completedAt: string;
          output: MiaomaAgentActivityOutput;
      })
    | (MiaomaAgentActivityBase & {
          status: 'failed';
          startedAt: string;
          completedAt: string;
          output: MiaomaAgentActivityOutput;
          error: {
              code: string;
              message: string;
          };
      });
