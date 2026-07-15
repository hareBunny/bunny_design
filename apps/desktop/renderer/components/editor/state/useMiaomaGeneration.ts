/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { MiaomaGenerationRun } from '@miaoma-design-ai/miaoma-agent-core';
import {
    editorDocumentToRenderable,
    schemaToEditorDocument
} from '@miaoma-design-ai/miaoma-editor-core';

import type { MiaomaGenerationEvent } from '../../../../shared/generation';

import { useEditorSession } from './useEditorSession';

const ACTIVE_RUN_STATUSES = new Set<MiaomaGenerationRun['status']>([
    'queued',
    'preparing',
    'designing',
    'validating',
    'repairing'
]);

const hasGenerationApi = () =>
    typeof window !== 'undefined' && Boolean(window.miaomaAPI?.generation);

export type MiaomaGenerationController = {
    error: string | null;
    isRunning: boolean;
    run: MiaomaGenerationRun | null;
    start(prompt: string): Promise<void>;
    cancel(): Promise<void>;
};

export const useMiaomaGeneration = ({
    projectId
}: {
    projectId?: string;
}): MiaomaGenerationController => {
    const session = useEditorSession();
    const [run, setRun] = useState<MiaomaGenerationRun | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeRunId, setActiveRunId] = useState<string | null>(null);

    useEffect(() => {
        if (!hasGenerationApi()) {
            return;
        }

        const handleEvent = (event: MiaomaGenerationEvent) => {
            if (event.type === 'run-updated') {
                setRun(event.run);
                setActiveRunId(event.run.runId);
                return;
            }

            session.replaceDocument(schemaToEditorDocument(event.document));

            if (event.type === 'run-finished') {
                setRun(event.run);
                setActiveRunId(null);
            }
        };

        return window.miaomaAPI.generation?.subscribe(handleEvent);
    }, [session]);

    const start = useCallback(
        async (prompt: string) => {
            const normalizedPrompt = prompt.trim();
            if (!normalizedPrompt) {
                return;
            }
            if (!projectId) {
                setError('Open a project before starting design generation.');
                return;
            }
            if (!hasGenerationApi()) {
                setError('Design generation is unavailable in this window.');
                return;
            }

            setError(null);
            const generation = window.miaomaAPI.generation;
            if (!generation) {
                setError('Design generation is unavailable in this window.');
                return;
            }

            const result = await generation.start({
                projectId,
                prompt: normalizedPrompt,
                document: editorDocumentToRenderable(
                    session.getSnapshot().document
                )
            });

            if (result.success === false) {
                setError(result.error);
            } else {
                setActiveRunId(result.runId);
            }
        },
        [projectId, session]
    );

    const cancel = useCallback(async () => {
        if (!activeRunId || !hasGenerationApi()) {
            return;
        }

        const generation = window.miaomaAPI.generation;
        if (!generation) {
            return;
        }

        const result = await generation.cancel(activeRunId);
        if (result.success === false) {
            setError(result.error);
        }
    }, [activeRunId]);

    const isRunning = useMemo(
        () =>
            (run !== null && ACTIVE_RUN_STATUSES.has(run.status)) ||
            activeRunId !== null,
        [activeRunId, run]
    );

    return { cancel, error, isRunning, run, start };
};
