/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { WebContents } from 'electron';
import { existsSync } from 'node:fs';
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
    type MiaomaGenerationStartInput,
    type MiaomaGenerationStartResult
} from '../../shared/generation';
import type { MiaomaProjectUpdateInput } from '../../shared/projects';
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

const getCodexExecutable = () => {
    const configured = process.env.MIAOMA_CODEX_EXECUTABLE;
    const candidates = [
        configured,
        path.join(process.resourcesPath, 'codex'),
        '/Applications/ChatGPT.app/Contents/Resources/codex',
        'codex'
    ].filter((candidate): candidate is string => Boolean(candidate));

    return (
        candidates.find(
            (candidate) => candidate === 'codex' || existsSync(candidate)
        ) ?? 'codex'
    );
};

const isAlive = (sender: WebContents) => !sender.isDestroyed();

const publish = (sender: WebContents, event: MiaomaGenerationEvent) => {
    if (isAlive(sender)) {
        sender.send(MIAOMA_GENERATION_IPC_CHANNELS.event, event);
    }
};

const waitForRendererPaint = async (sender: WebContents) => {
    if (!isAlive(sender)) {
        return;
    }

    await sender.executeJavaScript(
        `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))`
    );
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
        executable: getCodexExecutable(),
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
                    document: state.document
                });
                await waitForRendererPaint(sender);
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

    return { start, cancel };
};
