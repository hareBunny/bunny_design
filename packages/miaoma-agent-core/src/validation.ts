/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    MIAOMA_AGENT_ACTIVITY_LABELS,
    type MiaomaAgentActivity
} from './activity';
import {
    isMiaomaAgentId,
    isMiaomaCollaboratorAgentId,
    MIAOMA_COORDINATOR_AGENT_ID
} from './agents';
import type { MiaomaAgentJsonValue } from './json';
import {
    MIAOMA_GENERATION_RUN_FORMAT_VERSION,
    type MiaomaDesignRegion,
    type MiaomaGenerationAssignment,
    type MiaomaGenerationRun,
    type MiaomaGenerationRunStatus,
    validateMiaomaGenerationAssignments
} from './run';

type UnknownRecord = Record<string, unknown>;

const RUN_STATUSES = new Set<MiaomaGenerationRunStatus>([
    'queued',
    'preparing',
    'designing',
    'validating',
    'repairing',
    'completed',
    'cancelled',
    'failed'
]);

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNonBlankString = (value: unknown): value is string =>
    isString(value) && value.trim() !== '';

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const isJsonValue = (
    value: unknown,
    ancestors = new Set<object>()
): value is MiaomaAgentJsonValue => {
    if (
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'string' ||
        isFiniteNumber(value)
    ) {
        return true;
    }

    if (typeof value !== 'object' || ancestors.has(value)) {
        return false;
    }

    ancestors.add(value);
    const valid = Array.isArray(value)
        ? value.every((item) => isJsonValue(item, ancestors))
        : Object.values(value).every((item) => isJsonValue(item, ancestors));
    ancestors.delete(value);

    return valid;
};

const isRegion = (value: unknown): value is MiaomaDesignRegion => {
    if (
        !isRecord(value) ||
        !isNonBlankString(value.regionId) ||
        !isNonBlankString(value.label)
    ) {
        return false;
    }

    if (value.bounds !== undefined) {
        if (
            !isRecord(value.bounds) ||
            !['x', 'y', 'width', 'height'].every((key) =>
                isFiniteNumber(value.bounds?.[key])
            ) ||
            (value.bounds.width as number) < 0 ||
            (value.bounds.height as number) < 0
        ) {
            return false;
        }
    }

    return (
        value.targetNodeIds === undefined ||
        (Array.isArray(value.targetNodeIds) &&
            value.targetNodeIds.every(isString))
    );
};

const parseAssignment = (value: unknown): MiaomaGenerationAssignment | null => {
    if (
        !isRecord(value) ||
        !isNonBlankString(value.assignmentId) ||
        !isString(value.agentId) ||
        !isMiaomaCollaboratorAgentId(value.agentId) ||
        !Number.isInteger(value.order) ||
        !isNonBlankString(value.objective) ||
        !isRegion(value.region)
    ) {
        return null;
    }

    const base = {
        assignmentId: value.assignmentId,
        agentId: value.agentId,
        order: value.order as number,
        objective: value.objective,
        region: value.region
    };

    if (value.status === 'pending') {
        return value.startedAt === undefined &&
            value.completedAt === undefined &&
            value.fragmentId === undefined &&
            value.placeholderNodeId === undefined &&
            value.reason === undefined
            ? { ...base, status: value.status }
            : null;
    }

    if (!isString(value.startedAt)) {
        return null;
    }

    if (value.status === 'running') {
        return value.completedAt === undefined &&
            value.fragmentId === undefined &&
            value.placeholderNodeId === undefined &&
            value.reason === undefined
            ? { ...base, status: value.status, startedAt: value.startedAt }
            : null;
    }

    if (!isString(value.completedAt)) {
        return null;
    }

    if (value.status === 'completed' && isString(value.fragmentId)) {
        return {
            ...base,
            status: value.status,
            startedAt: value.startedAt,
            completedAt: value.completedAt,
            fragmentId: value.fragmentId
        };
    }

    if (
        value.status === 'placeholder' &&
        isString(value.placeholderNodeId) &&
        isString(value.reason)
    ) {
        return {
            ...base,
            status: value.status,
            startedAt: value.startedAt,
            completedAt: value.completedAt,
            placeholderNodeId: value.placeholderNodeId,
            reason: value.reason
        };
    }

    return null;
};

const isActivity = (value: unknown): value is MiaomaAgentActivity => {
    if (
        !isRecord(value) ||
        !isNonBlankString(value.activityId) ||
        !isNonBlankString(value.runId) ||
        !isString(value.agentId) ||
        !isMiaomaAgentId(value.agentId) ||
        (value.assignmentId !== undefined && !isString(value.assignmentId)) ||
        !isString(value.kind) ||
        !(value.kind in MIAOMA_AGENT_ACTIVITY_LABELS) ||
        !isRecord(value.input) ||
        !isJsonValue(value.input) ||
        !isString(value.createdAt) ||
        !isString(value.startedAt)
    ) {
        return false;
    }

    if (value.status === 'running') {
        return (
            value.completedAt === undefined &&
            value.output === undefined &&
            value.error === undefined
        );
    }

    if (
        !isString(value.completedAt) ||
        !isRecord(value.output) ||
        !isString(value.output.summary)
    ) {
        return false;
    }

    if (value.status === 'completed') {
        return value.error === undefined;
    }

    return (
        value.status === 'failed' &&
        isRecord(value.error) &&
        isNonBlankString(value.error.code) &&
        isNonBlankString(value.error.message)
    );
};

const hasValidTerminalState = (
    run: UnknownRecord,
    status: MiaomaGenerationRunStatus
) => {
    if (
        status === 'queued' ||
        status === 'preparing' ||
        status === 'designing' ||
        status === 'validating' ||
        status === 'repairing'
    ) {
        return run.completedAt === undefined && run.error === undefined;
    }

    if (!isString(run.completedAt)) {
        return false;
    }

    return status !== 'failed'
        ? run.error === undefined
        : isRecord(run.error) &&
              isString(run.error.code) &&
              isString(run.error.message);
};

export const parseMiaomaGenerationRun = (
    input: unknown
): MiaomaGenerationRun | null => {
    if (
        !isRecord(input) ||
        input.formatVersion !== MIAOMA_GENERATION_RUN_FORMAT_VERSION ||
        !isNonBlankString(input.runId) ||
        !isNonBlankString(input.projectId) ||
        !isNonBlankString(input.prompt) ||
        input.coordinatorAgentId !== MIAOMA_COORDINATOR_AGENT_ID ||
        !isString(input.status) ||
        !RUN_STATUSES.has(input.status as MiaomaGenerationRunStatus) ||
        !Array.isArray(input.assignments) ||
        !Array.isArray(input.activities) ||
        !Number.isInteger(input.documentRevision) ||
        (input.documentRevision as number) < 0 ||
        !isString(input.createdAt) ||
        !isString(input.updatedAt)
    ) {
        return null;
    }

    const assignments = input.assignments.map(parseAssignment);
    if (assignments.some((assignment) => assignment === null)) {
        return null;
    }

    const parsedAssignments = assignments as MiaomaGenerationAssignment[];
    try {
        validateMiaomaGenerationAssignments(parsedAssignments);
    } catch {
        return null;
    }

    const assignmentById = new Map(
        parsedAssignments.map((assignment) => [
            assignment.assignmentId,
            assignment
        ])
    );
    const activities = input.activities.filter(isActivity);
    const activitiesMatchRun = activities.every((activity) => {
        if (activity.runId !== input.runId) {
            return false;
        }

        if (!activity.assignmentId) {
            return true;
        }

        return (
            assignmentById.get(activity.assignmentId)?.agentId ===
            activity.agentId
        );
    });
    const status = input.status as MiaomaGenerationRunStatus;
    if (
        activities.length !== input.activities.length ||
        !activitiesMatchRun ||
        !hasValidTerminalState(input, status)
    ) {
        return null;
    }

    return input as MiaomaGenerationRun;
};
