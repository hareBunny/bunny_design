/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useCallback, useEffect, useState } from 'react';

import type { MiaomaGenerationRun } from '@miaoma-design-ai/miaoma-agent-core';
import {
    editorDocumentToRenderable,
    schemaToEditorDocument
} from '@miaoma-design-ai/miaoma-editor-core';

import type {
    MiaomaGenerationEvent,
    MiaomaGenerationReferenceImage
} from '../../../../shared/generation';

import { useEditorSession } from './useEditorSession';

const hasGenerationApi = () =>
    typeof window !== 'undefined' && Boolean(window.miaomaAPI?.generation);

export type MiaomaGenerationController = {
    documentRevision: number;
    documentRunId: string | null;
    error: string | null;
    isRunning: boolean;
    run: MiaomaGenerationRun | null;
    start(prompt: string, referenceImagePath?: string): Promise<void>;
    selectReferenceImage(): Promise<MiaomaGenerationReferenceImage | null>;
    saveReferenceImage(
        input: { bytes: Uint8Array; extension: 'png' | 'jpg' | 'jpeg' | 'webp' }
    ): Promise<MiaomaGenerationReferenceImage | null>;
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
    const [documentRunId, setDocumentRunId] = useState<string | null>(null);
    const [documentRevision, setDocumentRevision] = useState(0);
    const [isStarting, setIsStarting] = useState(false);

    useEffect(() => {
        const generation = window.miaomaAPI?.generation;
        if (!generation) {
            return;
        }
        let disposed = false;

        const handleEvent = (event: MiaomaGenerationEvent) => {
            if (event.type === 'run-updated') {
                setRun(event.run);
                setActiveRunId(event.run.runId);
                setError(null);
                return;
            }

            session.replaceDocument(schemaToEditorDocument(event.document));

            setDocumentRunId(
                event.type === 'document-updated'
                    ? event.runId
                    : event.run.runId
            );
            setDocumentRevision(
                event.type === 'document-updated'
                    ? event.revision
                    : event.run.documentRevision
            );

            if (event.type === 'run-finished') {
                setRun(event.run);
                setActiveRunId(null);
            }
        };

        const unsubscribe = generation.subscribe(handleEvent);

        if (projectId) {
            void generation
                .getLatestRun(projectId)
                .then((result) => {
                    if (disposed) {
                        return;
                    }
                    if (result.success === false) {
                        setError(result.error);
                        return;
                    }

                    setRun((currentRun) => {
                        const restoredRun = result.run;
                        if (!restoredRun) {
                            return currentRun?.projectId === projectId
                                ? currentRun
                                : null;
                        }
                        if (
                            currentRun?.projectId === projectId &&
                            currentRun.updatedAt >= restoredRun.updatedAt
                        ) {
                            return currentRun;
                        }

                        return restoredRun;
                    });
                })
                .catch((historyError: unknown) => {
                    if (!disposed) {
                        setError(
                            historyError instanceof Error
                                ? historyError.message
                                : 'Failed to load generation history.'
                        );
                    }
                });
        }

        return () => {
            disposed = true;
            unsubscribe();
        };
    }, [projectId, session]);

    const start = useCallback(
        async (prompt: string, referenceImagePath?: string) => {
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
            setIsStarting(true);
            const generation = window.miaomaAPI.generation;
            if (!generation) {
                setError('Design generation is unavailable in this window.');
                setIsStarting(false);
                return;
            }

            try {
                const result = await generation.start({
                    projectId,
                    prompt: normalizedPrompt,
                    document: editorDocumentToRenderable(
                        session.getSnapshot().document
                    ),
                    referenceImagePath
                });

                if (result.success === false) {
                    setError(result.error);
                } else {
                    setActiveRunId(result.runId);
                }
            } catch (startError) {
                setError(
                    startError instanceof Error
                        ? startError.message
                        : 'Failed to start design generation.'
                );
            } finally {
                setIsStarting(false);
            }
        },
        [projectId, session]
    );

    const selectReferenceImage = useCallback(async () => {
        const generation = window.miaomaAPI?.generation;
        if (!generation) {
            setError('Design generation is unavailable in this window.');
            return null;
        }

        const result = await generation.selectReferenceImage();
        if (result.success === true) {
            setError(null);
            return result.image;
        }
        if (!result.canceled) {
            setError(result.error ?? 'Unable to select the screenshot.');
        }
        return null;
    }, []);

    const saveReferenceImage = useCallback(
        async (input: {
            bytes: Uint8Array;
            extension: 'png' | 'jpg' | 'jpeg' | 'webp';
        }) => {
            const generation = window.miaomaAPI?.generation;
            if (!generation) {
                setError('Design generation is unavailable in this window.');
                return null;
            }

            const result = await generation.saveReferenceImage(input);
            if (result.success === true) {
                setError(null);
                return result.image;
            }
            setError(result.error ?? 'Unable to save the screenshot.');
            return null;
        },
        []
    );

    const cancel = useCallback(async () => {
        if (!activeRunId || !hasGenerationApi()) {
            return;
        }

        const generation = window.miaomaAPI.generation;
        if (!generation) {
            return;
        }

        try {
            const result = await generation.cancel(activeRunId);
            if (result.success === false) {
                setError(result.error);
            }
        } catch (cancelError) {
            setError(
                cancelError instanceof Error
                    ? cancelError.message
                    : 'Failed to cancel design generation.'
            );
        }
    }, [activeRunId]);

    const isRunning = activeRunId !== null || isStarting;
    const visibleRun = run?.projectId === projectId ? run : null;

    return {
        cancel,
        documentRevision,
        documentRunId,
        error,
        isRunning,
        run: visibleRun,
        saveReferenceImage,
        selectReferenceImage,
        start
    };
};
