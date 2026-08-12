/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { WebContents } from 'electron';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
    createMiaomaCodexExecProvider,
    type MiaomaCodexExecProvider
} from '@miaoma-design-ai/miaoma-agent-codex';
import type { MiaomaAgentSession } from '@miaoma-design-ai/miaoma-agent-core';
import {
    createFileGenerationHistoryStore,
    type MiaomaGenerationHistoryStore
} from '@miaoma-design-ai/miaoma-agent-history';
import {
    createMiaomaDesignGenerationOrchestrator,
    createMiaomaDesignVisualHarness,
    type MiaomaDesignScreenshotCapture
} from '@miaoma-design-ai/miaoma-design-generation';

import {
    MIAOMA_GENERATION_IPC_CHANNELS,
    type MiaomaGenerationCancelResult,
    type MiaomaGenerationEvent,
    type MiaomaGenerationLatestRunResult,
    type MiaomaGenerationStartInput,
    type MiaomaGenerationStartResult
} from '../../shared/generation';
import type { MiaomaProjectUpdateInput } from '../../shared/projects';
import { getMiaomaCodexExecutable } from '../codexExecutable';
import type { ProjectStore } from '../projects/projectStore';

type ActiveGeneration = {
    execution: ReturnType<
        ReturnType<typeof createMiaomaDesignGenerationOrchestrator>['start']
    >;
    sender: WebContents;
};

type GenerationRuntimeOptions = {
    projectStore: ProjectStore;
    historyRoot: string;
    screenshotRoot: string;
    workingDirectory: string;
    codex?: MiaomaCodexExecProvider;
    history?: MiaomaGenerationHistoryStore;
};

const isAlive = (sender: WebContents) => !sender.isDestroyed();

const publish = (sender: WebContents, event: MiaomaGenerationEvent) => {
    if (isAlive(sender)) {
        sender.send(MIAOMA_GENERATION_IPC_CHANNELS.event, event);
    }
};

const waitForRendererDocument = async ({
    sender,
    runId,
    revision
}: {
    sender: WebContents;
    runId: string;
    revision: number;
}) => {
    if (!isAlive(sender)) {
        throw new Error('The editor window was closed during generation.');
    }

    const expected = JSON.stringify({ runId, revision: String(revision) });

    await sender.executeJavaScript(`new Promise((resolve, reject) => {
        const expected = ${expected};
        const deadline = performance.now() + 5000;
        const check = () => {
            const element = document.querySelector('[data-region="canvas-stage"]');
            const matches =
                element?.getAttribute('data-generation-run-id') === expected.runId &&
                element?.getAttribute('data-document-revision') === expected.revision;

            if (matches) {
                requestAnimationFrame(() => requestAnimationFrame(resolve));
                return;
            }

            if (performance.now() >= deadline) {
                reject(new Error(
                    'Timed out waiting for the renderer to display document revision ' +
                    expected.runId + ':' + expected.revision
                ));
                return;
            }

            requestAnimationFrame(check);
        };

        check();
    })`);
};

const createScreenshotCapture =
    ({
        sender,
        screenshotRoot
    }: {
        sender: WebContents;
        screenshotRoot: string;
    }): MiaomaDesignScreenshotCapture =>
    async ({ projectId, runId, attempt }) => {
        if (!isAlive(sender)) {
            throw new Error('The editor window was closed during generation.');
        }

        const rectangle = await sender.executeJavaScript(`(() => {
        const element = document.querySelector('[data-region="canvas-stage"]');
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
            x: Math.max(0, Math.round(rect.left)),
            y: Math.max(0, Math.round(rect.top)),
            width: Math.max(1, Math.round(rect.width)),
            height: Math.max(1, Math.round(rect.height))
        };
    })()`);
        const image = await sender.capturePage(rectangle ?? undefined);
        const directory = path.join(screenshotRoot, projectId, runId);
        const screenshotPath = path.join(directory, `attempt-${attempt}.png`);

        await mkdir(directory, { recursive: true });
        await writeFile(screenshotPath, image.toPNG());

        return { path: screenshotPath };
    };

export const createMiaomaDesktopGenerationRuntime = ({
    projectStore,
    historyRoot,
    screenshotRoot,
    workingDirectory,
    codex = createMiaomaCodexExecProvider({
        executable: getMiaomaCodexExecutable(),
        jsonSchemaMode: 'prompt',
        skipGitRepoCheck: true
    }),
    history = createFileGenerationHistoryStore({ historyRoot })
}: GenerationRuntimeOptions) => {
    const activeGenerations = new Map<string, ActiveGeneration>();

    const broadcastHistory: MiaomaGenerationHistoryStore = {
        async saveRun({ run }) {
            await history.saveRun({ run });
            const active = activeGenerations.get(run.runId);
            if (active) {
                publish(active.sender, { type: 'run-updated', run });
            }
        },
        loadRun: (input) => history.loadRun(input),
        listRuns: (input) => history.listRuns(input)
    };

    const start = async (
        sender: WebContents,
        input: MiaomaGenerationStartInput
    ): Promise<MiaomaGenerationStartResult> => {
        if (activeGenerations.size > 0) {
            return {
                success: false,
                error: 'Another design generation is already running.'
            };
        }

        const sessionByAgent = new Map<string, MiaomaAgentSession>();
        for (const previousRun of await history.listRuns({
            projectId: input.projectId
        })) {
            for (const session of previousRun.agentSessions) {
                if (session.threadId && !sessionByAgent.has(session.agentId)) {
                    sessionByAgent.set(session.agentId, session);
                }
            }
        }

        const visualHarness = createMiaomaDesignVisualHarness({
            codex,
            captureScreenshot: createScreenshotCapture({
                sender,
                screenshotRoot
            })
        });
        const orchestrator = createMiaomaDesignGenerationOrchestrator({
            codex,
            history: broadcastHistory,
            visualHarness
        });
        const execution = orchestrator.start({
            projectId: input.projectId,
            prompt: input.prompt,
            documentState: {
                revision: 0,
                document: input.document
            },
            agentSessions: [...sessionByAgent.values()],
            referenceImagePath: input.referenceImagePath,
            model: input.model,
            sandbox: 'workspace-write',
            workingDirectory,
            onDocumentUpdated: async (state) => {
                const update: MiaomaProjectUpdateInput = {
                    document: state.document
                };
                await projectStore.updateProject(input.projectId, update);
                publish(sender, {
                    type: 'document-updated',
                    runId: execution.runId,
                    revision: state.revision,
                    document: state.document
                });
                await waitForRendererDocument({
                    sender,
                    runId: execution.runId,
                    revision: state.revision
                });
            }
        });

        activeGenerations.set(execution.runId, { execution, sender });
        void execution.result
            .then((result) => {
                publish(sender, {
                    type: 'run-finished',
                    run: result.run,
                    document: result.document
                });
            })
            .finally(() => {
                activeGenerations.delete(execution.runId);
            });

        return { success: true, runId: execution.runId };
    };

    const cancel = (runId: string): MiaomaGenerationCancelResult => {
        const active = activeGenerations.get(runId);
        if (!active) {
            return {
                success: false,
                error: 'Generation run is not active.'
            };
        }

        active.execution.cancel();
        return { success: true };
    };

    const getLatestRun = async (
        projectId: string
    ): Promise<MiaomaGenerationLatestRunResult> => {
        try {
            const runs = await history.listRuns({ projectId });
            return { success: true, run: runs[0] ?? null };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to load generation history.'
            };
        }
    };

    return { start, cancel, getLatestRun };
};
