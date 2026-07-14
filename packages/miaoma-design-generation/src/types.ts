/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaGenerationAssignment } from '@miaoma-design-ai/miaoma-agent-core';
import type {
    MiaomaDesignDiagnostic,
    MiaomaDesignDocument,
    MiaomaDesignNode,
    MiaomaDesignVariables
} from '@miaoma-design-ai/miaoma-design-schema';

export const MIAOMA_DESIGN_GENERATION_FORMAT_VERSION = 1;

export type MiaomaDesignGenerationPlan = {
    formatVersion: typeof MIAOMA_DESIGN_GENERATION_FORMAT_VERSION;
    assignments: MiaomaGenerationAssignment[];
};

export type MiaomaDesignVariablesDraft = {
    formatVersion: typeof MIAOMA_DESIGN_GENERATION_FORMAT_VERSION;
    variables: MiaomaDesignVariables;
};

export type MiaomaDesignFragment = {
    formatVersion: typeof MIAOMA_DESIGN_GENERATION_FORMAT_VERSION;
    fragmentId: string;
    assignmentId: string;
    nodes: MiaomaDesignNode[];
};

export type MiaomaDesignVisualIssue = {
    issueId: string;
    severity: 'error' | 'warning';
    message: string;
    nodeId?: string;
    assignmentId?: string;
    regionId?: string;
    suggestedFix?: string;
};

export type MiaomaDesignVisualCheck = {
    formatVersion: typeof MIAOMA_DESIGN_GENERATION_FORMAT_VERSION;
    passed: boolean;
    summary: string;
    issues: MiaomaDesignVisualIssue[];
};

export type MiaomaDesignRepair = {
    repairId: string;
    assignmentId?: string;
    nodeIds: string[];
    nodes: MiaomaDesignNode[];
};

export type MiaomaDesignRepairBatch = {
    formatVersion: typeof MIAOMA_DESIGN_GENERATION_FORMAT_VERSION;
    repairs: MiaomaDesignRepair[];
};

export type MiaomaDesignDocumentState = {
    document: MiaomaDesignDocument;
    revision: number;
};

export type MiaomaDesignGenerationErrorCode =
    | 'assignment-mismatch'
    | 'duplicate-node-id'
    | 'invalid-document'
    | 'invalid-fragment'
    | 'invalid-plan'
    | 'invalid-repair'
    | 'invalid-variables'
    | 'invalid-visual-check'
    | 'revision-conflict'
    | 'target-not-found'
    | 'target-not-frame';

export class MiaomaDesignGenerationError extends Error {
    readonly code: MiaomaDesignGenerationErrorCode;
    readonly diagnostics?: MiaomaDesignDiagnostic[];

    constructor({
        code,
        message,
        diagnostics
    }: {
        code: MiaomaDesignGenerationErrorCode;
        message: string;
        diagnostics?: MiaomaDesignDiagnostic[];
    }) {
        super(message);
        this.name = 'MiaomaDesignGenerationError';
        this.code = code;
        this.diagnostics = diagnostics;
    }
}
