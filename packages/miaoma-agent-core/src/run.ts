/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaAgentActivity } from './activity';
import {
    isMiaomaCollaboratorAgentId,
    MIAOMA_COORDINATOR_AGENT_ID,
    type MiaomaCollaboratorAgentId
} from './agents';

export const MIAOMA_MAX_PARALLEL_COLLABORATORS = 5;
export const MIAOMA_GENERATION_RUN_FORMAT_VERSION = 1;

export type MiaomaGenerationRunStatus =
    | 'queued'
    | 'preparing'
    | 'designing'
    | 'validating'
    | 'repairing'
    | 'completed'
    | 'cancelled'
    | 'failed';

const RUN_STATUS_TRANSITIONS: Record<
    MiaomaGenerationRunStatus,
    ReadonlySet<MiaomaGenerationRunStatus>
> = {
    queued: new Set(['preparing', 'cancelled', 'failed']),
    preparing: new Set(['designing', 'cancelled', 'failed']),
    designing: new Set(['validating', 'cancelled', 'failed']),
    validating: new Set(['repairing', 'completed', 'cancelled', 'failed']),
    repairing: new Set(['validating', 'cancelled', 'failed']),
    completed: new Set(),
    cancelled: new Set(),
    failed: new Set()
};

export const isMiaomaGenerationRunTransitionAllowed = (
    from: MiaomaGenerationRunStatus,
    to: MiaomaGenerationRunStatus
) => RUN_STATUS_TRANSITIONS[from].has(to);

export type MiaomaDesignRegion = {
    regionId: string;
    label: string;
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    targetNodeIds?: string[];
};

type MiaomaGenerationAssignmentBase = {
    assignmentId: string;
    agentId: MiaomaCollaboratorAgentId;
    order: number;
    objective: string;
    region: MiaomaDesignRegion;
};

export type MiaomaGenerationAssignment =
    | (MiaomaGenerationAssignmentBase & {
          status: 'pending';
      })
    | (MiaomaGenerationAssignmentBase & {
          status: 'running';
          startedAt: string;
      })
    | (MiaomaGenerationAssignmentBase & {
          status: 'completed';
          startedAt: string;
          completedAt: string;
          fragmentId: string;
      })
    | (MiaomaGenerationAssignmentBase & {
          status: 'placeholder';
          startedAt: string;
          completedAt: string;
          placeholderNodeId: string;
          reason: string;
      });

type MiaomaGenerationRunBase = {
    formatVersion: typeof MIAOMA_GENERATION_RUN_FORMAT_VERSION;
    runId: string;
    projectId: string;
    prompt: string;
    coordinatorAgentId: typeof MIAOMA_COORDINATOR_AGENT_ID;
    assignments: MiaomaGenerationAssignment[];
    activities: MiaomaAgentActivity[];
    documentRevision: number;
    createdAt: string;
    updatedAt: string;
};

type MiaomaActiveGenerationRun = MiaomaGenerationRunBase & {
    status: 'queued' | 'preparing' | 'designing' | 'validating' | 'repairing';
};

type MiaomaCompletedGenerationRun = MiaomaGenerationRunBase & {
    status: 'completed';
    completedAt: string;
};

type MiaomaCancelledGenerationRun = MiaomaGenerationRunBase & {
    status: 'cancelled';
    completedAt: string;
};

type MiaomaFailedGenerationRun = MiaomaGenerationRunBase & {
    status: 'failed';
    completedAt: string;
    error: {
        code: string;
        message: string;
    };
};

export type MiaomaGenerationRun =
    | MiaomaActiveGenerationRun
    | MiaomaCancelledGenerationRun
    | MiaomaCompletedGenerationRun
    | MiaomaFailedGenerationRun;

const assertNotBlank = (value: string, label: string) => {
    if (value.trim() === '') {
        throw new Error(`${label} must not be blank.`);
    }
};

export const validateMiaomaGenerationAssignments = (
    assignments: readonly MiaomaGenerationAssignment[]
) => {
    if (assignments.length > MIAOMA_MAX_PARALLEL_COLLABORATORS) {
        throw new Error('A generation run supports at most five assignments.');
    }

    const assignmentIds = new Set<string>();
    const agentIds = new Set<MiaomaCollaboratorAgentId>();
    const regionIds = new Set<string>();
    const orders = new Set<number>();

    for (const assignment of assignments) {
        assertNotBlank(assignment.assignmentId, 'Assignment id');
        assertNotBlank(assignment.objective, 'Assignment objective');
        assertNotBlank(assignment.region.regionId, 'Region id');

        if (!isMiaomaCollaboratorAgentId(assignment.agentId)) {
            throw new Error('Assignments require a collaborator agent.');
        }

        if (!Number.isInteger(assignment.order) || assignment.order < 0) {
            throw new Error('Assignment order must be a non-negative integer.');
        }

        if (assignmentIds.has(assignment.assignmentId)) {
            throw new Error(
                `Duplicate assignment id: ${assignment.assignmentId}.`
            );
        }

        if (agentIds.has(assignment.agentId)) {
            throw new Error(
                `Duplicate collaborator agent: ${assignment.agentId}.`
            );
        }

        if (regionIds.has(assignment.region.regionId)) {
            throw new Error(
                `Duplicate region id: ${assignment.region.regionId}.`
            );
        }

        if (orders.has(assignment.order)) {
            throw new Error(`Duplicate assignment order: ${assignment.order}.`);
        }

        assignmentIds.add(assignment.assignmentId);
        agentIds.add(assignment.agentId);
        regionIds.add(assignment.region.regionId);
        orders.add(assignment.order);
    }

    return [...assignments].sort((left, right) => left.order - right.order);
};

export const createMiaomaGenerationRun = ({
    runId,
    projectId,
    prompt,
    createdAt
}: {
    runId: string;
    projectId: string;
    prompt: string;
    createdAt: string;
}): MiaomaGenerationRunBase & { status: 'queued' } => {
    assertNotBlank(runId, 'Run id');
    assertNotBlank(projectId, 'Project id');
    assertNotBlank(prompt, 'Prompt');

    return {
        formatVersion: MIAOMA_GENERATION_RUN_FORMAT_VERSION,
        runId,
        projectId,
        prompt,
        coordinatorAgentId: MIAOMA_COORDINATOR_AGENT_ID,
        status: 'queued',
        assignments: [],
        activities: [],
        documentRevision: 0,
        createdAt,
        updatedAt: createdAt
    };
};
