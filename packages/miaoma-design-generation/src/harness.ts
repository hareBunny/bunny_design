/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { MiaomaCodexExecError } from '@miaoma-design-ai/miaoma-agent-codex';
import type { MiaomaAgentJsonObject } from '@miaoma-design-ai/miaoma-agent-core';

import { replaceMiaomaDesignRepairs } from './documentAssembly';
import type {
    MiaomaDesignVisualHarness,
    MiaomaDesignVisualHarnessOptions,
    MiaomaDesignVisualLoopInput,
    MiaomaDesignVisualValidationResult
} from './harnessTypes';
import { MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS } from './schemaPaths';
import type { MiaomaDesignDocumentState } from './types';
import {
    parseMiaomaDesignRepairBatch,
    parseMiaomaDesignVisualCheck
} from './visualContracts';

const isRecord = (value: unknown): value is MiaomaAgentJsonObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const toJsonResponse = (value: unknown): MiaomaAgentJsonObject => {
    if (!isRecord(value)) {
        throw new Error('Visual Codex response must be a JSON object.');
    }
    return value;
};

const assertImagePath = (path: string) => {
    if (path.trim() === '') {
        throw new Error('Screenshot path must not be blank.');
    }
};

const buildValidationPrompt = ({
    prompt,
    issuesOnly
}: {
    prompt: string;
    issuesOnly: boolean;
}) =>
    `
Inspect the attached screenshot of the generated design.
Return only the JSON object required by the provided schema.
Evaluate hierarchy, spacing, alignment, typography, contrast, overflow, and
whether the result satisfies the design request. ${issuesOnly ? 'Report only concrete issues that require repair.' : ''}

Design request:
${prompt}
`.trim();

const buildRepairPrompt = ({
    prompt,
    check,
    state
}: {
    prompt: string;
    check: MiaomaDesignVisualValidationResult;
    state: MiaomaDesignDocumentState;
}) =>
    `
Repair the concrete visual issues reported for the attached screenshot.
Return only the JSON object required by the provided repair schema.
Only replace the listed nodeIds. Keep every replacement node id identical to
its target id and do not modify unrelated regions.
Use the supplied module JSON directly; do not inspect the filesystem or run
commands. nodeIds must contain only the top-level ids returned in nodes. Child
ids belong inside those replacement nodes and must not be listed in nodeIds.

Available variables:
${Object.keys(state.document.variables ?? {}).join(', ')}

Current module JSON:
${JSON.stringify(
    state.document.children[0]?.type === 'frame'
        ? (state.document.children[0].children ?? [])
        : state.document.children
)}

Design request:
${prompt}

Visual check:
${JSON.stringify(check.check)}
`.trim();

export const createMiaomaDesignVisualHarness = ({
    codex,
    captureScreenshot
}: MiaomaDesignVisualHarnessOptions): MiaomaDesignVisualHarness => {
    const validate = async (
        input: MiaomaDesignVisualLoopInput
    ): Promise<MiaomaDesignVisualValidationResult> => {
        const screenshot = await captureScreenshot({
            projectId: input.projectId,
            runId: input.runId,
            document: input.state.document,
            revision: input.state.revision,
            attempt: input.attempt ?? 0
        });
        assertImagePath(screenshot.path);

        const result = await codex.execute({
            prompt: buildValidationPrompt({
                prompt: input.prompt,
                issuesOnly: false
            }),
            workingDirectory: input.workingDirectory,
            sandbox: input.sandbox,
            conversation: { type: 'new' },
            model: input.model,
            images: [screenshot.path],
            signal: input.signal,
            response: {
                format: 'json',
                schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.visualCheck
            },
            onEvent: input.onEvent
        });

        if (result.response.format !== 'json') {
            throw new MiaomaCodexExecError({
                code: 'invalid-structured-output',
                message: 'Visual check did not return structured JSON.'
            });
        }

        return {
            check: parseMiaomaDesignVisualCheck(
                toJsonResponse(result.response.value)
            ),
            screenshot,
            threadId: result.threadId
        };
    };

    const repair = async ({
        loop,
        state,
        check
    }: Parameters<MiaomaDesignVisualHarness['repair']>[0]) => {
        const result = await codex.execute({
            prompt: buildRepairPrompt({
                prompt: loop.prompt,
                check,
                state
            }),
            workingDirectory: loop.workingDirectory,
            sandbox: loop.sandbox,
            conversation: { type: 'resume', threadId: check.threadId },
            model: loop.model,
            images: [check.screenshot.path],
            signal: loop.signal,
            response: {
                format: 'json',
                schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.repair
            },
            onEvent: loop.onEvent
        });

        if (result.response.format !== 'json') {
            throw new MiaomaCodexExecError({
                code: 'invalid-structured-output',
                message: 'Repair did not return structured JSON.'
            });
        }

        return replaceMiaomaDesignRepairs({
            state,
            expectedRevision: state.revision,
            batch: parseMiaomaDesignRepairBatch({
                input: toJsonResponse(result.response.value),
                variables: state.document.variables
            })
        });
    };

    const run = async (input: MiaomaDesignVisualLoopInput) => {
        const maxRepairAttempts = input.maxRepairAttempts ?? 2;
        if (!Number.isInteger(maxRepairAttempts) || maxRepairAttempts < 0) {
            throw new Error(
                'Max repair attempts must be a non-negative integer.'
            );
        }

        let state = input.state;
        const checks: MiaomaDesignVisualValidationResult[] = [];

        for (let attempt = 0; ; attempt += 1) {
            const check = await validate({
                ...input,
                state,
                maxRepairAttempts: attempt
            });
            checks.push(check);
            if (check.check.passed || attempt >= maxRepairAttempts) {
                return {
                    passed: check.check.passed,
                    attempts: attempt,
                    state,
                    checks
                };
            }

            state = await repair({ loop: input, state, check });
        }
    };

    return { validate, repair, run };
};
