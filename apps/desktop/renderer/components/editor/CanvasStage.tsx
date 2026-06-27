/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { editorDocumentToRenderable } from '@miaoma-design-ai/miaoma-editor-core';

import faviconUrl from '../../assets/brand/favicon@152.png';
import coverImageUrl from '../../assets/dSqyy.png';
import { TOOL_BUTTONS } from '../../constants/editor';
import type { SidebarTab } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import { useEditorSession } from './state/useEditorSession';
import { useEditorSnapshot } from './state/useEditorSnapshot';
import { CanvasViewportShell } from './CanvasViewportShell';
import { EditorIconButton } from './EditorIconButton';
import { PromptDock } from './PromptDock';

const canvasAssets: Record<string, string> = {
    'favicon%40167.png': faviconUrl,
    'image-import.png': coverImageUrl
};
const resolveCanvasAsset = (url: string) => canvasAssets[url] ?? url;

const ToolRail = () => (
    <nav
        aria-label="Canvas tools"
        className="editor-tool-rail absolute top-1 left-3 z-20 grid w-11 gap-1.5 rounded-2xl bg-white px-2 py-1.5 shadow-[0_3px_18px_#00000014]"
    >
        {TOOL_BUTTONS.map((tool) => (
            <EditorIconButton key={tool.label} {...tool} />
        ))}
    </nav>
);

type CanvasStageProps = {
    activeSidebarTab: SidebarTab;
    onCanvasBlankSelect?: () => void;
    onCanvasNodeSelect?: (nodeId: string) => void;
    spanInspectorColumn?: boolean;
};

export const CanvasStage = ({
    activeSidebarTab,
    onCanvasBlankSelect,
    onCanvasNodeSelect,
    spanInspectorColumn
}: CanvasStageProps) => (
    <CanvasStageInner
        activeSidebarTab={activeSidebarTab}
        onCanvasBlankSelect={onCanvasBlankSelect}
        onCanvasNodeSelect={onCanvasNodeSelect}
        spanInspectorColumn={spanInspectorColumn}
    />
);

const CanvasStageInner = ({
    activeSidebarTab,
    onCanvasBlankSelect,
    onCanvasNodeSelect,
    spanInspectorColumn
}: CanvasStageProps) => {
    const session = useEditorSession();
    const snapshot = useEditorSnapshot();
    const renderableDocument = editorDocumentToRenderable(snapshot.document);

    return (
        <main
            className={classNames(
                'editor-canvas-stage relative col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden bg-[#f6f6f6]',
                spanInspectorColumn && 'col-span-2'
            )}
            data-region="canvas-stage"
        >
            <CanvasViewportShell
                document={renderableDocument}
                onCanvasPointerDown={() => {
                    session.selectNode(null);
                    onCanvasBlankSelect?.();
                }}
                onNodePointerDown={(nodeId) => {
                    session.selectNode(nodeId);
                    onCanvasNodeSelect?.(nodeId);
                }}
                overlay={
                    activeSidebarTab === 'layers' ? (
                        <PromptDock variant="canvas" />
                    ) : null
                }
                resolveAsset={resolveCanvasAsset}
                selectedNodeId={snapshot.selection.selectedNodeId}
            />
            <ToolRail />
            <div
                aria-hidden="true"
                className="editor-canvas-scrollbar absolute bottom-1.5 left-[min(49.85%,calc(100%_-_300px))] z-20 h-1.5 w-[276px] rounded-[3px] bg-[#bdbec3]"
            />
        </main>
    );
};
