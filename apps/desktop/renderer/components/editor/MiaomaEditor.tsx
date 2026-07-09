/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Bot, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
    type EditorDocument,
    editorDocumentToRenderable
} from '@miaoma-design-ai/miaoma-editor-core';

import type {
    MiaomaProjectResult,
    MiaomaProjectSummary,
    MiaomaProjectUpdateInput
} from '../../../shared/projects';
import { EDITOR_DESIGN_METRICS } from '../../constants/editor';
import { CANVAS_SAMPLE_EDITOR_DOCUMENT } from '../../fixtures/canvasSampleDocument';
import type { SidebarTab } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import { EditorInteractionProvider } from './state/EditorInteractionProvider';
import { EditorSessionProvider } from './state/EditorSessionProvider';
import { useEditorSession } from './state/useEditorSession';
import { CanvasStage } from './CanvasStage';
import { LeftSidebar } from './LeftSidebar';
import { RightInspector } from './RightInspector';

const DEFAULT_PROJECT_TITLE = 'miaoma-magicut';
const DEFAULT_AUTOSAVE_INTERVAL_MS = 2000;

type MainHeaderProps = {
    projectTitle: string;
    onProjectTitleChange: (title: string) => void;
};

const MainHeader = ({
    projectTitle,
    onProjectTitleChange
}: MainHeaderProps) => (
    <header className="editor-main-header col-start-1 row-start-1 flex h-[var(--editor-header-height)] min-w-0 items-center justify-between border-b border-[#ededed] bg-[#f6f6f6] px-6 [-webkit-app-region:drag]">
        <div className="editor-document-title flex min-w-0 items-center text-[13px] leading-none font-medium text-[#1a1a1a] [-webkit-app-region:no-drag]">
            <input
                aria-label="Project name"
                className="min-w-[88px] max-w-[360px] rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[13px] leading-none font-medium text-[#1a1a1a] outline-none hover:bg-white/80 focus:border-[#d4d4d8] focus:bg-white"
                onBlur={() => {
                    if (!projectTitle.trim()) {
                        onProjectTitleChange(DEFAULT_PROJECT_TITLE);
                    }
                }}
                onChange={(event) => {
                    onProjectTitleChange(event.target.value);
                }}
                value={projectTitle}
            />
            <span className="shrink-0 text-[#52525b]">.miaomadesign</span>
            <span className="ml-1 shrink-0 text-[#71717a]">— Edited</span>
        </div>
        <button
            className="editor-agent-control flex h-7 cursor-default items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[12px] leading-none font-medium text-[#4b5563] [-webkit-app-region:no-drag]"
            type="button"
        >
            <Bot aria-hidden="true" size={14} strokeWidth={1.7} />
            <span>Agents</span>
            <ChevronDown aria-hidden="true" size={12} strokeWidth={1.8} />
        </button>
    </header>
);

const getAutosaveFingerprint = ({
    document,
    title
}: {
    document: EditorDocument;
    title: string;
}) =>
    JSON.stringify({
        title,
        document: editorDocumentToRenderable(document)
    });

type ProjectAutosaveBridgeProps = {
    intervalMs: number;
    projectId?: string;
    projectTitle: string;
};

type ProjectUpdateWindow = Window & {
    miaomaAPI: {
        projects: {
            update: (
                projectId: string,
                input: MiaomaProjectUpdateInput
            ) => Promise<MiaomaProjectResult<MiaomaProjectSummary>>;
        };
    };
};

const ProjectAutosaveBridge = ({
    intervalMs,
    projectId,
    projectTitle
}: ProjectAutosaveBridgeProps): null => {
    const session = useEditorSession();
    const latestDocumentRef = useRef(session.getSnapshot().document);
    const latestTitleRef = useRef(projectTitle);
    const lastSavedFingerprintRef = useRef<string | null>(null);
    const isSavingRef = useRef(false);
    const needsFollowUpSaveRef = useRef(false);

    useEffect(() => {
        latestTitleRef.current = projectTitle;
    }, [projectTitle]);

    useEffect(() => {
        latestDocumentRef.current = session.getSnapshot().document;

        return session.subscribe(() => {
            latestDocumentRef.current = session.getSnapshot().document;
        });
    }, [session]);

    useEffect(() => {
        if (!projectId) {
            return;
        }

        const getCurrentInput = () => ({
            title: latestTitleRef.current,
            document: editorDocumentToRenderable(latestDocumentRef.current)
        });
        const saveProject = () => {
            const fingerprint = getAutosaveFingerprint({
                document: latestDocumentRef.current,
                title: latestTitleRef.current
            });

            if (fingerprint === lastSavedFingerprintRef.current) {
                return;
            }

            if (isSavingRef.current) {
                needsFollowUpSaveRef.current = true;
                return;
            }

            isSavingRef.current = true;

            void (window as unknown as ProjectUpdateWindow).miaomaAPI.projects
                .update(projectId, getCurrentInput())
                .then((result: MiaomaProjectResult<MiaomaProjectSummary>) => {
                    if (result.success) {
                        lastSavedFingerprintRef.current = fingerprint;
                    }
                })
                .finally(() => {
                    isSavingRef.current = false;

                    if (needsFollowUpSaveRef.current) {
                        needsFollowUpSaveRef.current = false;
                        saveProject();
                    }
                });
        };

        lastSavedFingerprintRef.current = getAutosaveFingerprint({
            document: latestDocumentRef.current,
            title: latestTitleRef.current
        });

        const intervalId = window.setInterval(saveProject, intervalMs);

        return () => {
            window.clearInterval(intervalId);
            saveProject();
        };
    }, [intervalMs, projectId, session]);

    return null;
};

type MiaomaEditorProps = {
    autoSaveIntervalMs?: number;
    initialDocument?: EditorDocument;
    initialProjectTitle?: string;
    projectId?: string;
};

export const MiaomaEditor = ({
    autoSaveIntervalMs = DEFAULT_AUTOSAVE_INTERVAL_MS,
    initialDocument = CANVAS_SAMPLE_EDITOR_DOCUMENT,
    initialProjectTitle = DEFAULT_PROJECT_TITLE,
    projectId
}: MiaomaEditorProps) => {
    const [activeSidebarTab, setActiveSidebarTab] =
        useState<SidebarTab>('agent');
    const [isInspectorBodyVisible, setIsInspectorBodyVisible] = useState(true);
    const [projectTitle, setProjectTitle] = useState(initialProjectTitle);

    return (
        <EditorSessionProvider
            initialDocument={initialDocument}
            initialSelectedNodeId={initialDocument.children[0]?.id}
        >
            <EditorInteractionProvider>
                <ProjectAutosaveBridge
                    intervalMs={autoSaveIntervalMs}
                    projectId={projectId}
                    projectTitle={projectTitle}
                />
                <div
                    className="miaoma-editor-screen grid h-screen min-h-[700px] w-screen grid-cols-[var(--editor-sidebar-width)_minmax(0,1fr)] overflow-hidden"
                    data-canvas-width={EDITOR_DESIGN_METRICS.canvasWidth}
                    data-content-width={EDITOR_DESIGN_METRICS.contentWidth}
                    data-design-frame={EDITOR_DESIGN_METRICS.frameId}
                    data-inspector-width={EDITOR_DESIGN_METRICS.inspectorWidth}
                    data-sidebar-width={EDITOR_DESIGN_METRICS.sidebarWidth}
                >
                    <LeftSidebar
                        activeTab={activeSidebarTab}
                        onLayerSelect={() => {
                            setIsInspectorBodyVisible(true);
                        }}
                        onSelectTab={setActiveSidebarTab}
                    />
                    <section
                        className={classNames(
                            'editor-content grid h-full min-w-0 grid-rows-[var(--editor-header-height)_minmax(0,1fr)] overflow-hidden rounded-l-3xl border-l border-[#e6e6e6] bg-[#f6f6f6] shadow-[-4px_0_20px_#0000001a]',
                            'grid-cols-[minmax(0,1fr)_var(--editor-inspector-width)] max-[980px]:grid-cols-[minmax(520px,1fr)]'
                        )}
                        data-inspector-body-visible={
                            isInspectorBodyVisible ? 'true' : 'false'
                        }
                    >
                        <MainHeader
                            onProjectTitleChange={setProjectTitle}
                            projectTitle={projectTitle}
                        />
                        <CanvasStage
                            activeSidebarTab={activeSidebarTab}
                            onCanvasBlankSelect={() => {
                                setIsInspectorBodyVisible(false);
                            }}
                            onCanvasNodeSelect={() => {
                                setIsInspectorBodyVisible(true);
                            }}
                            spanInspectorColumn={!isInspectorBodyVisible}
                        />
                        <RightInspector bodyVisible={isInspectorBodyVisible} />
                    </section>
                </div>
            </EditorInteractionProvider>
        </EditorSessionProvider>
    );
};
