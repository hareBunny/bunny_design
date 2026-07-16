/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    isMiaomaCollaboratorAgentId,
    type MiaomaDesignRegion,
    type MiaomaGenerationAssignment,
    validateMiaomaGenerationAssignments
} from '@miaoma-design-ai/miaoma-agent-core';
import {
    type MiaomaDesignNode,
    type MiaomaDesignVariables,
    strictValidateDesignDocument
} from '@miaoma-design-ai/miaoma-design-schema';

import {
    MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
    type MiaomaDesignFragment,
    MiaomaDesignGenerationError,
    type MiaomaDesignGenerationPlan,
    type MiaomaDesignVariablesDraft
} from './types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonBlankString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim() !== '';

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const assertFormatVersion = (
    input: UnknownRecord,
    code: 'invalid-fragment' | 'invalid-plan' | 'invalid-variables'
) => {
    if (input.formatVersion !== MIAOMA_DESIGN_GENERATION_FORMAT_VERSION) {
        throw new MiaomaDesignGenerationError({
            code,
            message: 'Generation output format version is not supported.'
        });
    }
};

const parseRegion = (input: unknown): MiaomaDesignRegion | null => {
    if (
        !isRecord(input) ||
        !isNonBlankString(input.regionId) ||
        !isNonBlankString(input.label) ||
        !Array.isArray(input.targetNodeIds) ||
        input.targetNodeIds.length !== 1 ||
        !input.targetNodeIds.every(isNonBlankString)
    ) {
        return null;
    }

    const bounds = input.bounds;
    if (
        !isRecord(bounds) ||
        !['x', 'y', 'width', 'height'].every((key) =>
            isFiniteNumber(bounds[key])
        ) ||
        (bounds.width as number) < 0 ||
        (bounds.height as number) < 0
    ) {
        return null;
    }

    return {
        regionId: input.regionId,
        label: input.label,
        bounds: bounds as MiaomaDesignRegion['bounds'],
        targetNodeIds: input.targetNodeIds
    };
};

const parseAssignment = (input: unknown): MiaomaGenerationAssignment | null => {
    if (
        !isRecord(input) ||
        !isNonBlankString(input.assignmentId) ||
        !isNonBlankString(input.agentId) ||
        !isMiaomaCollaboratorAgentId(input.agentId) ||
        !Number.isInteger(input.order) ||
        (input.order as number) < 0 ||
        !isNonBlankString(input.objective)
    ) {
        return null;
    }

    const region = parseRegion(input.region);
    return region
        ? {
              assignmentId: input.assignmentId,
              agentId: input.agentId,
              order: input.order as number,
              objective: input.objective,
              region,
              status: 'pending'
          }
        : null;
};

export const parseMiaomaDesignGenerationPlan = (
    input: unknown
): MiaomaDesignGenerationPlan => {
    if (!isRecord(input)) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-plan',
            message: 'Generation plan must be an object.'
        });
    }
    assertFormatVersion(input, 'invalid-plan');

    if (!Array.isArray(input.assignments) || input.assignments.length === 0) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-plan',
            message: 'Generation plan requires at least one assignment.'
        });
    }

    const assignments = input.assignments.map(parseAssignment);
    if (assignments.some((assignment) => assignment === null)) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-plan',
            message: 'Generation plan contains an invalid assignment.'
        });
    }

    let sorted: MiaomaGenerationAssignment[];
    try {
        sorted = validateMiaomaGenerationAssignments(
            assignments as MiaomaGenerationAssignment[]
        );
    } catch (error) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-plan',
            message:
                error instanceof Error
                    ? error.message
                    : 'Generation plan is invalid.'
        });
    }

    if (sorted.some((assignment, index) => assignment.order !== index)) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-plan',
            message: 'Assignment order must be contiguous and start at zero.'
        });
    }

    return {
        formatVersion: MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
        assignments: sorted
    };
};

export const parseMiaomaDesignVariablesDraft = (
    input: unknown
): MiaomaDesignVariablesDraft => {
    if (!isRecord(input)) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-variables',
            message: 'Design variables output must be an object.'
        });
    }
    assertFormatVersion(input, 'invalid-variables');

    const validation = strictValidateDesignDocument({
        version: '2.14',
        variables: input.variables,
        children: []
    });
    if (!validation.success || !validation.document.variables) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-variables',
            message: 'Design variables output is invalid.',
            diagnostics: validation.success ? undefined : validation.diagnostics
        });
    }

    const variables = validation.document.variables;
    if (
        Object.keys(variables).length === 0 ||
        Object.keys(variables).some((name) => name.trim() === '')
    ) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-variables',
            message: 'Design variables output must define named variables.'
        });
    }

    return {
        formatVersion: MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
        variables
    };
};

const collectNodeIds = (
    nodes: readonly MiaomaDesignNode[],
    ids = new Set<string>()
) => {
    for (const node of nodes) {
        if (ids.has(node.id)) {
            throw new MiaomaDesignGenerationError({
                code: 'duplicate-node-id',
                message: `Duplicate generated node id: ${node.id}.`
            });
        }
        ids.add(node.id);
        if (node.type === 'frame' && node.children) {
            collectNodeIds(node.children, ids);
        }
    }

    return ids;
};

export const parseMiaomaDesignFragment = ({
    input,
    assignment,
    variables
}: {
    input: unknown;
    assignment: MiaomaGenerationAssignment;
    variables?: MiaomaDesignVariables;
}): MiaomaDesignFragment => {
    if (!isRecord(input)) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-fragment',
            message: 'Design fragment must be an object.'
        });
    }
    assertFormatVersion(input, 'invalid-fragment');

    if (
        !isNonBlankString(input.fragmentId) ||
        !isNonBlankString(input.assignmentId) ||
        !Array.isArray(input.nodes) ||
        input.nodes.length !== 1
    ) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-fragment',
            message: 'Design fragment metadata or nodes are invalid.'
        });
    }
    if (input.assignmentId !== assignment.assignmentId) {
        throw new MiaomaDesignGenerationError({
            code: 'assignment-mismatch',
            message: 'Design fragment does not match its assignment.'
        });
    }

    const validation = strictValidateDesignDocument({
        version: '2.14',
        variables,
        children: input.nodes
    });
    if (!validation.success) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-fragment',
            message: 'Design fragment nodes are invalid.',
            diagnostics: validation.diagnostics
        });
    }

    if (validation.document.children[0]?.id !== assignment.region.regionId) {
        throw new MiaomaDesignGenerationError({
            code: 'assignment-mismatch',
            message: `Design fragment must use the fixed region id ${assignment.region.regionId}.`
        });
    }

    collectNodeIds(validation.document.children);

    return {
        formatVersion: MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
        fragmentId: input.fragmentId,
        assignmentId: input.assignmentId,
        nodes: validation.document.children
    };
};
