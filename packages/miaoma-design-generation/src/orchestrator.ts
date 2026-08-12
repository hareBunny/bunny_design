/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { randomUUID } from 'node:crypto';

import {
    type MiaomaCodexEvent,
    MiaomaCodexExecError,
    type MiaomaCodexExecResult
} from '@miaoma-design-ai/miaoma-agent-codex';
import {
    createMiaomaGenerationRun,
    isMiaomaGenerationRunTransitionAllowed,
    MIAOMA_COORDINATOR_AGENT_ID,
    type MiaomaAgentActivity,
    type MiaomaAgentActivityKind,
    type MiaomaAgentId,
    type MiaomaAgentJsonObject,
    type MiaomaAgentSession,
    type MiaomaGenerationAssignment,
    type MiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';
import { strictValidateDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import {
    parseMiaomaDesignFragment,
    parseMiaomaDesignGenerationPlan,
    parseMiaomaDesignVariablesDraft
} from './contracts';
import {
    applyMiaomaDesignVariables,
    placeMiaomaDesignRegionScaffolds,
    replaceMiaomaDesignRegionFragment
} from './documentAssembly';
import {
    type MiaomaDesignGenerationExecution,
    type MiaomaDesignGenerationOrchestrator,
    type MiaomaDesignGenerationOrchestratorOptions,
    type MiaomaDesignGenerationResult,
    type MiaomaDesignGenerationStartInput
} from './orchestratorTypes';
import { MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS } from './schemaPaths';
import {
    type MiaomaDesignDocumentState,
    type MiaomaDesignFragment
} from './types';

const DEFAULT_SANDBOX = 'workspace-write' as const;

const isRecord = (value: unknown): value is MiaomaAgentJsonObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const toJsonResponse = (
    result: MiaomaCodexExecResult
): MiaomaAgentJsonObject => {
    if (result.response.format !== 'json' || !isRecord(result.response.value)) {
        throw new Error('Codex returned an object-shaped JSON response.');
    }

    return result.response.value;
};

const errorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unknown generation error.';

const isCancellation = (error: unknown, signal: AbortSignal) =>
    signal.aborted ||
    (error instanceof MiaomaCodexExecError && error.code === 'cancelled');

const placeholderFragment = ({
    assignment,
    reason
}: {
    assignment: MiaomaGenerationAssignment;
    reason: string;
}): MiaomaDesignFragment => {
    const bounds = assignment.region.bounds;
    const height = Math.max(bounds?.height ?? 160, 160);

    return {
        formatVersion: 1,
        fragmentId: `placeholder-${assignment.assignmentId}`,
        assignmentId: assignment.assignmentId,
        nodes: [
            {
                id: assignment.region.regionId,
                type: 'frame',
                name: `Placeholder / ${assignment.region.label}`,
                width: bounds?.width || 'fill_container',
                height,
                fill: {
                    type: 'color',
                    color: '#f3f4f6ff'
                },
                stroke: {
                    type: 'color',
                    color: '#d1d5dbff',
                    width: 1,
                    align: 'inner'
                },
                layout: 'vertical',
                padding: 16,
                gap: 8,
                children: [
                    {
                        id: `${assignment.region.regionId}-placeholder-title`,
                        type: 'text',
                        content: `Unable to design ${assignment.region.label}`,
                        fontSize: 14,
                        fontWeight: '600'
                    },
                    {
                        id: `${assignment.region.regionId}-placeholder-reason`,
                        type: 'text',
                        content: reason,
                        fontSize: 12
                    }
                ]
            }
        ]
    };
};

const buildVariablePrompt = ({ prompt }: { prompt: string }) =>
    `
Create the global design variable system for this design request.
Return only the JSON object required by the provided schema.
Use reusable color, typography, spacing, and sizing variables where useful.
Do not create design nodes yet.

Design request:
${prompt}
`.trim();

const buildPlanPrompt = ({
    prompt,
    rootNodeId,
    variableNames
}: {
    prompt: string;
    rootNodeId: string;
    variableNames: string[];
}) =>
    `
Plan the visual regions for this design request.
Return only the JSON object required by the provided schema.
Create no more than five assignments, use each collaborator at most once, and
assign every region to the root frame ${rootNodeId}.
Use contiguous order values beginning at zero. Define non-overlapping bounds
for every region so the complete page scaffold is fixed before workers start.
When the subject benefits from photography, mention the intended image role in
the relevant assignment objective so workers can plan backgrounds or supporting
imagery. Do not force photography into purely operational interfaces.

Available variables: ${variableNames.join(', ')}
Design request:
${prompt}
`.trim();

const buildWorkerPrompt = ({
    prompt,
    assignment,
    variableNames
}: {
    prompt: string;
    assignment: MiaomaGenerationAssignment;
    variableNames: string[];
}) =>
    `
Design only the assigned region and return only the JSON object required by the
provided schema. Return exactly one top-level region frame in nodes. Do not
edit other regions, choose another target, or return a complete document.
The region frame already exists as a scaffold. Replace that fixed node and set
the top-level frame id to exactly "${assignment.region.regionId}".

Region: ${assignment.region.label}
Region id: ${assignment.region.regionId}
Assignment id: ${assignment.assignmentId}
Objective: ${assignment.objective}
Target frame: ${assignment.region.targetNodeIds?.[0] ?? 'root'}
Available variables: ${variableNames.join(', ')}
Design request:
${prompt}

Set assignmentId to exactly "${assignment.assignmentId}" and fragmentId to
"fragment-${assignment.assignmentId}" in the returned JSON.
Prefix color, font-family, and corner-radius variable references with "$".
Use literal values for all other node properties; never return a bare variable
name as a fill, stroke, effect color, fontFamily, or cornerRadius value.
Do not emit lineHeight, textGrowth, whiteSpace, or CSS-only properties.
When photography materially improves the region, use a real direct
images.unsplash.com photo URL on a frame or rectangle using
fill: {"type":"image","url":"...","mode":"fill"} (or "fit" when the full
image must remain visible). Choose imagery that clearly matches the subject, and
do not use placeholder URL tokens or add decorative photos where they do not
serve the design.
`.trim();

export const createMiaomaDesignGenerationOrchestrator = ({
    codex,
    history,
    visualHarness,
    now = () => new Date(),
    createRunId = randomUUID
}: MiaomaDesignGenerationOrchestratorOptions): MiaomaDesignGenerationOrchestrator => ({
    start(input) {
        const controller = new AbortController();
        const runId = createRunId();
        const result = executeGeneration({
            codex,
            history,
            now,
            input,
            runId,
            signal: controller.signal,
            visualHarness
        });

        return {
            runId,
            cancel: () => controller.abort(),
            result
        } satisfies MiaomaDesignGenerationExecution;
    }
});

const executeGeneration = async ({
    codex,
    history,
    now,
    input,
    runId,
    signal,
    visualHarness
}: Omit<MiaomaDesignGenerationOrchestratorOptions, 'now'> & {
    now: () => Date;
    input: MiaomaDesignGenerationStartInput;
    runId: string;
    signal: AbortSignal;
}): Promise<MiaomaDesignGenerationResult> => {
    let state = input.documentState;
    let run: MiaomaGenerationRun = {
        ...createMiaomaGenerationRun({
            runId,
            projectId: input.projectId,
            prompt: input.prompt,
            createdAt: now().toISOString()
        }),
        agentSessions: input.agentSessions ?? [],
        documentRevision: state.revision
    };
    let activitySequence = 0;

    const persist = async () => {
        run = {
            ...run,
            documentRevision: state.revision,
            updatedAt: now().toISOString()
        } as MiaomaGenerationRun;
        await history.saveRun({ run });
    };

    const transition = async (status: MiaomaGenerationRun['status']) => {
        if (!isMiaomaGenerationRunTransitionAllowed(run.status, status)) {
            throw new Error(`Cannot transition generation run to ${status}.`);
        }

        run = { ...run, status } as MiaomaGenerationRun;
        await persist();
    };

    const addActivity = async ({
        agentId,
        assignmentId,
        kind,
        input: activityInput
    }: {
        agentId: MiaomaAgentActivity['agentId'];
        assignmentId?: string;
        kind: MiaomaAgentActivityKind;
        input: MiaomaAgentJsonObject;
    }) => {
        const timestamp = now().toISOString();
        const activity: MiaomaAgentActivity = {
            activityId: `${agentId}-${kind}-${activitySequence++}`,
            runId,
            agentId,
            assignmentId,
            kind,
            input: activityInput,
            createdAt: timestamp,
            startedAt: timestamp,
            status: 'running'
        };
        run = { ...run, activities: [...run.activities, activity] };
        await persist();
        return activity.activityId;
    };

    const completeActivity = async (activityId: string, summary: string) => {
        const completedAt = now().toISOString();
        run = {
            ...run,
            activities: run.activities.map((activity) =>
                activity.activityId === activityId &&
                activity.status === 'running'
                    ? {
                          ...activity,
                          status: 'completed',
                          completedAt,
                          output: { summary }
                      }
                    : activity
            )
        } as MiaomaGenerationRun;
        await persist();
    };

    const failActivity = async (activityId: string, error: unknown) => {
        const completedAt = now().toISOString();
        run = {
            ...run,
            activities: run.activities.map((activity) =>
                activity.activityId === activityId &&
                activity.status === 'running'
                    ? {
                          ...activity,
                          status: 'failed',
                          completedAt,
                          output: { summary: errorMessage(error) },
                          error: {
                              code:
                                  error instanceof MiaomaCodexExecError
                                      ? error.code
                                      : 'GENERATION_ACTIVITY_FAILED',
                              message: errorMessage(error)
                          }
                      }
                    : activity
            )
        } as MiaomaGenerationRun;
        await persist();
    };

    const recordCodexEvent = async ({
        event,
        agentId,
        assignmentId,
        trackSession = true
    }: {
        event: MiaomaCodexEvent;
        agentId: MiaomaAgentActivity['agentId'];
        assignmentId?: string;
        trackSession?: boolean;
    }) => {
        if (
            trackSession &&
            (event.type === 'process-started' ||
                event.type === 'thread-started')
        ) {
            const timestamp = now().toISOString();
            const existing = run.agentSessions.find(
                (session) => session.agentId === agentId
            );
            const session: MiaomaAgentSession = {
                ...existing,
                agentId,
                ...(event.type === 'process-started'
                    ? { processId: event.processId }
                    : { threadId: event.threadId }),
                updatedAt: timestamp
            };

            run = {
                ...run,
                agentSessions: existing
                    ? run.agentSessions.map((candidate) =>
                          candidate.agentId === agentId ? session : candidate
                      )
                    : [...run.agentSessions, session]
            } as MiaomaGenerationRun;
            await persist();
            return;
        }

        if (event.type !== 'activity') {
            return;
        }

        const activityId = `${agentId}-bash-${event.activity.sourceItemId}`;
        const existing = run.activities.find(
            (activity) => activity.activityId === activityId
        );
        const timestamp = now().toISOString();

        if (event.activity.status === 'running' && !existing) {
            run = {
                ...run,
                activities: [
                    ...run.activities,
                    {
                        activityId,
                        runId,
                        agentId,
                        assignmentId,
                        kind: 'bash',
                        input: event.activity.input,
                        createdAt: timestamp,
                        startedAt: timestamp,
                        status: 'running'
                    }
                ]
            };
        } else if (event.activity.status !== 'running') {
            const nextActivity: MiaomaAgentActivity =
                event.activity.status === 'completed'
                    ? {
                          activityId,
                          runId,
                          agentId,
                          assignmentId,
                          kind: 'bash',
                          input: event.activity.input,
                          createdAt: existing?.createdAt ?? timestamp,
                          startedAt: existing?.startedAt ?? timestamp,
                          completedAt: timestamp,
                          status: 'completed',
                          output: event.activity.output
                      }
                    : {
                          activityId,
                          runId,
                          agentId,
                          assignmentId,
                          kind: 'bash',
                          input: event.activity.input,
                          createdAt: existing?.createdAt ?? timestamp,
                          startedAt: existing?.startedAt ?? timestamp,
                          completedAt: timestamp,
                          status: 'failed',
                          output: event.activity.output,
                          error: event.activity.error
                      };

            run = {
                ...run,
                activities: existing
                    ? run.activities.map((activity) =>
                          activity.activityId === activityId
                              ? nextActivity
                              : activity
                      )
                    : [...run.activities, nextActivity]
            };
        }

        await persist();
    };

    const runActivity = async <T>({
        agentId,
        assignmentId,
        kind,
        activityInput,
        work,
        outputSummary
    }: {
        agentId: MiaomaAgentActivity['agentId'];
        assignmentId?: string;
        kind: MiaomaAgentActivityKind;
        activityInput: MiaomaAgentJsonObject;
        work: () => Promise<T>;
        outputSummary?: (result: T) => string;
    }) => {
        const activityId = await addActivity({
            agentId,
            assignmentId,
            kind,
            input: activityInput
        });

        try {
            const result = await work();
            await completeActivity(activityId, outputSummary?.(result) ?? 'OK');
            return result;
        } catch (error) {
            await failActivity(activityId, error);
            throw error;
        }
    };

    const executeCodex = ({
        agentId,
        assignmentId,
        prompt,
        response,
        conversation,
        model,
        sandbox
    }: {
        agentId: MiaomaAgentActivity['agentId'];
        assignmentId?: string;
        prompt: string;
        response: { format: 'json'; schemaPath: string };
        conversation: { type: 'new' } | { type: 'resume'; threadId: string };
        model?: string;
        referenceImagePath?: string;
        sandbox: NonNullable<MiaomaDesignGenerationStartInput['sandbox']>;
    }) =>
        codex.execute({
            prompt,
            workingDirectory: input.workingDirectory ?? process.cwd(),
            sandbox,
            conversation,
            model,
            images: input.referenceImagePath
                ? [input.referenceImagePath]
                : undefined,
            response,
            signal,
            onEvent: (event) =>
                recordCodexEvent({ event, agentId, assignmentId })
        });

    const markAssignmentRunning = async (assignmentId: string) => {
        const startedAt = now().toISOString();
        run = {
            ...run,
            assignments: run.assignments.map((assignment) =>
                assignment.assignmentId === assignmentId
                    ? { ...assignment, status: 'running', startedAt }
                    : assignment
            )
        } as MiaomaGenerationRun;
        await persist();
        return startedAt;
    };

    const markAssignmentCompleted = async (
        assignmentId: string,
        fragmentId: string
    ) => {
        const completedAt = now().toISOString();
        run = {
            ...run,
            assignments: run.assignments.map((assignment) =>
                assignment.assignmentId === assignmentId &&
                assignment.status === 'running'
                    ? {
                          ...assignment,
                          status: 'completed',
                          completedAt,
                          fragmentId
                      }
                    : assignment
            )
        } as MiaomaGenerationRun;
        await persist();
    };

    const markAssignmentPlaceholder = async ({
        assignmentId,
        placeholderNodeId,
        reason
    }: {
        assignmentId: string;
        placeholderNodeId: string;
        reason: string;
    }) => {
        const completedAt = now().toISOString();
        run = {
            ...run,
            assignments: run.assignments.map((assignment) =>
                assignment.assignmentId === assignmentId &&
                assignment.status === 'running'
                    ? {
                          ...assignment,
                          status: 'placeholder',
                          completedAt,
                          placeholderNodeId,
                          reason
                      }
                    : assignment
            )
        } as MiaomaGenerationRun;
        await persist();
    };

    const sandbox = input.sandbox ?? DEFAULT_SANDBOX;
    const documentRoot = state.document.children[0];
    let coordinatorThreadId = run.agentSessions.find(
        ({ agentId }) => agentId === MIAOMA_COORDINATOR_AGENT_ID
    )?.threadId;
    const conversationFor = (agentId: MiaomaAgentId) => {
        const threadId = run.agentSessions.find(
            (session) => session.agentId === agentId
        )?.threadId;

        return threadId
            ? ({ type: 'resume', threadId } as const)
            : ({ type: 'new' } as const);
    };

    try {
        await persist();

        if (!Number.isInteger(state.revision) || state.revision < 0) {
            throw new Error('Initial design document state is invalid.');
        }
        const initialValidation = strictValidateDesignDocument(state.document);
        if (!initialValidation.success) {
            throw new Error('Initial design document is invalid.');
        }
        state = { ...state, document: initialValidation.document };

        await transition('preparing');

        const variableDraft = await runActivity({
            agentId: MIAOMA_COORDINATOR_AGENT_ID,
            kind: 'read-variables',
            activityInput: {
                prompt: input.prompt,
                schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.variables
            },
            work: async () => {
                const result = await executeCodex({
                    agentId: MIAOMA_COORDINATOR_AGENT_ID,
                    prompt: buildVariablePrompt({ prompt: input.prompt }),
                    response: {
                        format: 'json',
                        schemaPath:
                            MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.variables
                    },
                    conversation: conversationFor(MIAOMA_COORDINATOR_AGENT_ID),
                    model: input.model,
                    sandbox
                });
                coordinatorThreadId = result.threadId;
                return parseMiaomaDesignVariablesDraft(toJsonResponse(result));
            }
        });

        state = applyMiaomaDesignVariables({
            state,
            expectedRevision: state.revision,
            draft: variableDraft
        });
        await input.onDocumentUpdated?.(state);
        await runActivity({
            agentId: MIAOMA_COORDINATOR_AGENT_ID,
            kind: 'set-variables',
            activityInput: { names: Object.keys(variableDraft.variables) },
            work: async () => undefined
        });

        const planActivityInput = {
            prompt: input.prompt,
            rootNodeId: documentRoot?.id ?? 'root',
            schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.plan
        };
        const plan = await runActivity({
            agentId: MIAOMA_COORDINATOR_AGENT_ID,
            kind: 'plan-visual',
            activityInput: planActivityInput,
            work: async () => {
                const variableNames = Object.keys(variableDraft.variables);
                const result = await executeCodex({
                    agentId: MIAOMA_COORDINATOR_AGENT_ID,
                    prompt: buildPlanPrompt({
                        prompt: input.prompt,
                        rootNodeId: documentRoot?.id ?? 'root',
                        variableNames
                    }),
                    response: {
                        format: 'json',
                        schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.plan
                    },
                    conversation: {
                        type: 'resume',
                        threadId:
                            coordinatorThreadId ??
                            (() => {
                                throw new Error(
                                    'Coordinator session id is missing.'
                                );
                            })()
                    },
                    model: input.model,
                    sandbox
                });
                return parseMiaomaDesignGenerationPlan(toJsonResponse(result));
            }
        });

        run = { ...run, assignments: plan.assignments };
        await persist();
        state = placeMiaomaDesignRegionScaffolds({
            state,
            expectedRevision: state.revision,
            assignments: plan.assignments
        });
        await input.onDocumentUpdated?.(state);
        await transition('designing');

        const workerOutcomes = plan.assignments.map((assignment) =>
            designAssignment({
                assignment,
                variableNames: Object.keys(variableDraft.variables),
                prompt: input.prompt,
                sandbox,
                input,
                runActivity,
                executeCodex,
                markAssignmentRunning,
                markAssignmentPlaceholder,
                signal,
                conversation: conversationFor(assignment.agentId),
                variables: state.document.variables
            })
        );

        let mergeQueue = Promise.resolve();

        await Promise.all(
            workerOutcomes.map((worker) =>
                worker.then((outcome) => {
                    mergeQueue = mergeQueue.then(async () => {
                        state = replaceMiaomaDesignRegionFragment({
                            state,
                            expectedRevision: state.revision,
                            assignment: outcome.assignment,
                            fragment: outcome.fragment
                        });
                        await input.onDocumentUpdated?.(state);
                        if (!outcome.placeholder) {
                            await markAssignmentCompleted(
                                outcome.assignment.assignmentId,
                                outcome.fragment.fragmentId
                            );
                        }
                        await persist();
                    });
                    return mergeQueue;
                })
            )
        );
        await mergeQueue;

        await transition('validating');

        if (visualHarness) {
            const maxRepairAttempts = input.maxRepairAttempts ?? 2;
            if (!Number.isInteger(maxRepairAttempts) || maxRepairAttempts < 0) {
                throw new Error(
                    'Max repair attempts must be a non-negative integer.'
                );
            }

            for (let attempt = 0; ; attempt += 1) {
                const visualInput = {
                    projectId: input.projectId,
                    runId,
                    prompt: input.prompt,
                    state,
                    attempt,
                    workingDirectory: input.workingDirectory ?? process.cwd(),
                    model: input.model,
                    sandbox,
                    signal,
                    maxRepairAttempts,
                    onEvent: (event: MiaomaCodexEvent) =>
                        recordCodexEvent({
                            event,
                            agentId: MIAOMA_COORDINATOR_AGENT_ID,
                            trackSession: false
                        })
                };
                const check = await runActivity({
                    agentId: MIAOMA_COORDINATOR_AGENT_ID,
                    kind: 'visual-check',
                    activityInput: {
                        attempt,
                        schemaPath:
                            MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.visualCheck
                    },
                    work: () => visualHarness.validate(visualInput),
                    outputSummary: (result) => result.check.summary
                });

                if (check.check.passed) {
                    break;
                }

                if (attempt >= maxRepairAttempts) {
                    throw new Error(
                        `Visual validation failed after ${maxRepairAttempts} repair attempt(s).`
                    );
                }

                await transition('repairing');
                await runActivity({
                    agentId: MIAOMA_COORDINATOR_AGENT_ID,
                    kind: 'repair',
                    activityInput: {
                        attempt: attempt + 1,
                        issueIds: check.check.issues.map(
                            ({ issueId }) => issueId
                        ),
                        schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.repair
                    },
                    work: async () => {
                        const nextState = await visualHarness.repair({
                            loop: visualInput,
                            state,
                            check
                        });
                        state = nextState;
                        await input.onDocumentUpdated?.(state);
                        return nextState;
                    },
                    outputSummary: () =>
                        `Applied visual repairs for ${check.check.issues.length} issue(s).`
                });
                await persist();
                await transition('validating');
            }
        }

        run = {
            ...run,
            status: 'completed',
            completedAt: now().toISOString()
        } as MiaomaGenerationRun;
        await persist();

        return { run, document: state.document };
    } catch (error) {
        const status = isCancellation(error, signal) ? 'cancelled' : 'failed';
        const completedAt = now().toISOString();
        run =
            status === 'failed'
                ? {
                      ...run,
                      status,
                      completedAt,
                      error: {
                          code:
                              error instanceof MiaomaCodexExecError
                                  ? error.code
                                  : 'GENERATION_FAILED',
                          message: errorMessage(error)
                      }
                  }
                : { ...run, status, completedAt };
        await history.saveRun({
            run: {
                ...run,
                documentRevision: state.revision,
                updatedAt: now().toISOString()
            } as MiaomaGenerationRun
        });

        return { run, document: state.document };
    }
};

const designAssignment = async ({
    assignment,
    variableNames,
    prompt,
    sandbox,
    input,
    variables,
    runActivity,
    executeCodex,
    markAssignmentRunning,
    markAssignmentPlaceholder,
    signal,
    conversation
}: {
    assignment: MiaomaGenerationAssignment;
    variableNames: string[];
    prompt: string;
    sandbox: NonNullable<MiaomaDesignGenerationStartInput['sandbox']>;
    input: MiaomaDesignGenerationStartInput;
    variables: MiaomaDesignDocumentState['document']['variables'];
    runActivity: <T>(input: {
        agentId: MiaomaAgentActivity['agentId'];
        assignmentId?: string;
        kind: MiaomaAgentActivityKind;
        activityInput: MiaomaAgentJsonObject;
        work: () => Promise<T>;
        outputSummary?: (result: T) => string;
    }) => Promise<T>;
    executeCodex: (input: {
        agentId: MiaomaAgentActivity['agentId'];
        assignmentId?: string;
        prompt: string;
        response: { format: 'json'; schemaPath: string };
        conversation: { type: 'new' } | { type: 'resume'; threadId: string };
        model?: string;
        sandbox: NonNullable<MiaomaDesignGenerationStartInput['sandbox']>;
    }) => Promise<MiaomaCodexExecResult>;
    markAssignmentRunning: (assignmentId: string) => Promise<string>;
    markAssignmentPlaceholder: (input: {
        assignmentId: string;
        placeholderNodeId: string;
        reason: string;
    }) => Promise<void>;
    signal: AbortSignal;
    conversation: { type: 'new' } | { type: 'resume'; threadId: string };
}) => {
    await markAssignmentRunning(assignment.assignmentId);

    try {
        const fragment = await runActivity({
            agentId: assignment.agentId,
            assignmentId: assignment.assignmentId,
            kind: 'design',
            activityInput: {
                assignmentId: assignment.assignmentId,
                regionId: assignment.region.regionId,
                objective: assignment.objective,
                schemaPath: MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.fragment
            },
            work: async () => {
                const result = await executeCodex({
                    agentId: assignment.agentId,
                    assignmentId: assignment.assignmentId,
                    prompt: buildWorkerPrompt({
                        prompt,
                        assignment,
                        variableNames
                    }),
                    response: {
                        format: 'json',
                        schemaPath:
                            MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS.fragment
                    },
                    conversation,
                    model: input.model,
                    sandbox
                });
                return parseMiaomaDesignFragment({
                    input: toJsonResponse(result),
                    assignment,
                    variables
                });
            }
        });

        return { assignment, fragment, placeholder: false };
    } catch (error) {
        if (isCancellation(error, signal)) {
            throw error;
        }

        const reason = errorMessage(error);
        const placeholder = placeholderFragment({ assignment, reason });
        await markAssignmentPlaceholder({
            assignmentId: assignment.assignmentId,
            placeholderNodeId: assignment.region.regionId,
            reason
        });
        return { assignment, fragment: placeholder, placeholder: true };
    }
};

export type { MiaomaDesignGenerationExecution } from './orchestratorTypes';
