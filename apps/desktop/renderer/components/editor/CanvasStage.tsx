/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { editorDocumentToRenderable } from '@miaoma-design-ai/miaoma-editor-core';

import type { SidebarTab } from '../../types/editor';
import { classNames } from '../../utils/classNames';
import { resolveCanvasAsset } from '../document/canvasAssets';

import { useCanvasCreationBridge } from './bridges/useCanvasCreationBridge';
import { useEditorSession } from './state/useEditorSession';
import { useEditorSnapshot } from './state/useEditorSnapshot';
import { CanvasToolRail } from './CanvasToolRail';
import { CanvasViewportShell } from './CanvasViewportShell';
import { PromptDock } from './PromptDock';

type CanvasStageProps = {
    activeSidebarTab: SidebarTab;
    documentRevision?: number;
    documentRunId?: string | null;
    onCanvasBlankSelect?: () => void;
    onCanvasNodeSelect?: (nodeId: string) => void;
    spanInspectorColumn?: boolean;
};

export const CanvasStage = ({
    activeSidebarTab,
    documentRevision,
    documentRunId,
    onCanvasBlankSelect,
    onCanvasNodeSelect,
    spanInspectorColumn
}: CanvasStageProps) => (
    <CanvasStageInner
        activeSidebarTab={activeSidebarTab}
        documentRevision={documentRevision}
        documentRunId={documentRunId}
        onCanvasBlankSelect={onCanvasBlankSelect}
        onCanvasNodeSelect={onCanvasNodeSelect}
        spanInspectorColumn={spanInspectorColumn}
    />
);

const CanvasStageInner = ({
    activeSidebarTab,
    documentRevision = 0,
    documentRunId,
    onCanvasBlankSelect,
    onCanvasNodeSelect,
    spanInspectorColumn
}: CanvasStageProps) => {
    const session = useEditorSession();
    const snapshot = useEditorSnapshot();
    const creationBridge = useCanvasCreationBridge();
    const renderableDocument = editorDocumentToRenderable(snapshot.document);

    return (
        <main
            className={classNames(
                'editor-canvas-stage relative col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden bg-[#f6f6f6]',
                spanInspectorColumn && 'col-span-2'
            )}
            data-document-revision={documentRevision}
            data-generation-run-id={documentRunId ?? undefined}
            data-region="canvas-stage"
        >
            <CanvasViewportShell
                document={renderableDocument}
                onCanvasPointerDown={() => {
                    session.selectNode(null);
                    onCanvasBlankSelect?.();
                }}
                creationDraft={creationBridge.creationDraft}
                onViewportPointerDown={creationBridge.handleViewportPointerDown}
                onViewportPointerMove={creationBridge.handleViewportPointerMove}
                onViewportPointerUp={creationBridge.handleViewportPointerUp}
                onTextCancel={creationBridge.handleTextCancel}
                onTextCommit={creationBridge.handleTextCommit}
                activeTool={creationBridge.activeTool}
                selectionEnabled={creationBridge.activeTool === 'pointer'}
                onNodeDoubleClick={creationBridge.startTextEditing}
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
                textEditorState={creationBridge.textEditorState}
            />
            <CanvasToolRail
                activeTool={creationBridge.activeTool}
                onSelectTool={creationBridge.selectTool}
            />
        </main>
    );
};
