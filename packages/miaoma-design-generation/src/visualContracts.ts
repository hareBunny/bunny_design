/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    type MiaomaDesignNode,
    type MiaomaDesignVariables,
    strictValidateDesignDocument
} from '@miaoma-design-ai/miaoma-design-schema';

import { normalizeMiaomaGeneratedNodes } from './normalizeGeneratedNodes';
import {
    MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
    MiaomaDesignGenerationError,
    type MiaomaDesignRepair,
    type MiaomaDesignRepairBatch,
    type MiaomaDesignVisualCheck,
    type MiaomaDesignVisualIssue
} from './types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonBlankString = (value: unknown): value is string =>
    typeof value === 'string' && value.trim() !== '';

const invalid = (
    code: 'invalid-repair' | 'invalid-visual-check',
    message: string
): never => {
    throw new MiaomaDesignGenerationError({ code, message });
};

const parseIssue = (value: unknown): MiaomaDesignVisualIssue | null => {
    if (
        !isRecord(value) ||
        !isNonBlankString(value.issueId) ||
        (value.severity !== 'error' && value.severity !== 'warning') ||
        !isNonBlankString(value.message)
    ) {
        return null;
    }

    return {
        issueId: value.issueId,
        severity: value.severity,
        message: value.message,
        nodeId: isNonBlankString(value.nodeId) ? value.nodeId : undefined,
        assignmentId: isNonBlankString(value.assignmentId)
            ? value.assignmentId
            : undefined,
        regionId: isNonBlankString(value.regionId) ? value.regionId : undefined,
        suggestedFix: isNonBlankString(value.suggestedFix)
            ? value.suggestedFix
            : undefined
    };
};

export const parseMiaomaDesignVisualCheck = (
    input: unknown
): MiaomaDesignVisualCheck => {
    if (
        !isRecord(input) ||
        input.formatVersion !== MIAOMA_DESIGN_GENERATION_FORMAT_VERSION ||
        typeof input.passed !== 'boolean' ||
        !isNonBlankString(input.summary) ||
        !Array.isArray(input.issues)
    ) {
        return invalid(
            'invalid-visual-check',
            'Visual check output is invalid.'
        );
    }

    const issues = input.issues.map(parseIssue);
    if (issues.some((issue) => issue === null)) {
        return invalid(
            'invalid-visual-check',
            'Visual check contains an invalid issue.'
        );
    }

    return {
        formatVersion: MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
        passed: input.passed,
        summary: input.summary,
        issues: issues as MiaomaDesignVisualIssue[]
    };
};

const collectNodeIds = (
    nodes: readonly MiaomaDesignNode[],
    ids = new Set<string>()
) => {
    for (const node of nodes) {
        if (ids.has(node.id)) {
            invalid(
                'invalid-repair',
                `Duplicate repaired node id: ${node.id}.`
            );
        }
        ids.add(node.id);
        if (node.type === 'frame' && node.children) {
            collectNodeIds(node.children, ids);
        }
    }
    return ids;
};

const parseRepair = ({
    input,
    variables
}: {
    input: unknown;
    variables?: MiaomaDesignVariables;
}): MiaomaDesignRepair | null => {
    if (
        !isRecord(input) ||
        !isNonBlankString(input.repairId) ||
        !Array.isArray(input.nodeIds) ||
        input.nodeIds.length === 0 ||
        !input.nodeIds.every(isNonBlankString) ||
        !Array.isArray(input.nodes) ||
        input.nodes.length === 0
    ) {
        return null;
    }

    const validation = strictValidateDesignDocument({
        version: '2.14',
        variables,
        children: normalizeMiaomaGeneratedNodes(input.nodes, variables)
    });
    if (!validation.success) {
        return null;
    }

    collectNodeIds(validation.document.children);
    const nodeIds = new Set(validation.document.children.map(({ id }) => id));
    const targetIds = new Set(input.nodeIds);
    if (
        nodeIds.size !== targetIds.size ||
        [...nodeIds].some((nodeId) => !targetIds.has(nodeId))
    ) {
        return null;
    }

    return {
        repairId: input.repairId,
        assignmentId: isNonBlankString(input.assignmentId)
            ? input.assignmentId
            : undefined,
        nodeIds: input.nodeIds,
        nodes: validation.document.children
    };
};

export const parseMiaomaDesignRepairBatch = ({
    input,
    variables
}: {
    input: unknown;
    variables?: MiaomaDesignVariables;
}): MiaomaDesignRepairBatch => {
    if (
        !isRecord(input) ||
        input.formatVersion !== MIAOMA_DESIGN_GENERATION_FORMAT_VERSION ||
        !Array.isArray(input.repairs) ||
        input.repairs.length === 0
    ) {
        return invalid('invalid-repair', 'Repair output is invalid.');
    }

    const repairs = input.repairs.map((repair) =>
        parseRepair({ input: repair, variables })
    );
    if (repairs.some((repair) => repair === null)) {
        return invalid('invalid-repair', 'Repair contains invalid nodes.');
    }

    const targetIds = repairs.flatMap((repair) => repair?.nodeIds ?? []);
    if (new Set(targetIds).size !== targetIds.length) {
        return invalid(
            'invalid-repair',
            'Repair targets must not overlap in one batch.'
        );
    }

    return {
        formatVersion: MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
        repairs: repairs as MiaomaDesignRepair[]
    };
};
