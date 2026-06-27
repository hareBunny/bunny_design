/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorDocument } from '@miaoma-design-ai/miaoma-editor-core';

import { SIDEBAR_ACTIONS, SIDEBAR_TABS } from '../../constants/editor';
import { CANVAS_SAMPLE_EDITOR_DOCUMENT } from '../../fixtures/canvasSampleDocument';
import type { SidebarTab } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import { useEditorSession } from './state/useEditorSession';
import { useEditorSnapshot } from './state/useEditorSnapshot';
import { EditorIconButton } from './EditorIconButton';
import { SidebarAgentPanel } from './SidebarAgentPanel';
import { SidebarLayersPanel } from './SidebarLayersPanel';

const SidebarTabs = ({
    activeTab,
    onSelectTab
}: {
    activeTab: SidebarTab;
    onSelectTab: (tab: SidebarTab) => void;
}) => (
    <div
        aria-label="Sidebar tabs"
        className="editor-tabs-row flex h-[30px] items-center gap-3 px-2"
        role="tablist"
    >
        {SIDEBAR_TABS.map((tab) => {
            const selected = activeTab === tab.id;

            return (
                <button
                    aria-selected={selected ? 'true' : 'false'}
                    className={classNames(
                        'editor-tab cursor-default border-0 px-2 py-1 leading-none text-xs font-semibold rounded-md',
                        selected
                            ? 'editor-tab--active bg-[#CED3D3] text-[#111827]'
                            : 'bg-transparent text-[#6b7280]'
                    )}
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    role="tab"
                    type="button"
                >
                    {tab.label}
                </button>
            );
        })}
    </div>
);

type SidebarContentProps = {
    activeTab: SidebarTab;
    document?: EditorDocument;
    selectedNodeId?: string | null;
    onSelectNode?: (nodeId: string) => void;
};

export const SidebarContent = ({
    activeTab,
    document = CANVAS_SAMPLE_EDITOR_DOCUMENT,
    selectedNodeId,
    onSelectNode
}: SidebarContentProps) =>
    activeTab === 'agent' ? (
        <SidebarAgentPanel />
    ) : (
        <SidebarLayersPanel
            document={document}
            onSelectNode={onSelectNode}
            selectedNodeId={selectedNodeId}
        />
    );

type LeftSidebarProps = {
    activeTab: SidebarTab;
    onLayerSelect?: () => void;
    onSelectTab: (tab: SidebarTab) => void;
};

export const LeftSidebar = ({
    activeTab,
    onLayerSelect,
    onSelectTab
}: LeftSidebarProps) => (
    <LeftSidebarContent
        activeTab={activeTab}
        onLayerSelect={onLayerSelect}
        onSelectTab={onSelectTab}
    />
);

const LeftSidebarContent = ({
    activeTab,
    onLayerSelect,
    onSelectTab
}: LeftSidebarProps) => {
    const session = useEditorSession();
    const snapshot = useEditorSnapshot();

    return (
        <aside
            className="editor-sidebar h-full min-w-0 overflow-hidden"
            data-region="left-sidebar"
        >
            <header className="editor-sidebar-toolbar flex h-[var(--editor-header-height)] w-[var(--editor-sidebar-width)] min-w-0 items-center pr-5 [padding-left:calc(var(--editor-system-traffic-light-space)+20px)] [-webkit-app-region:drag]">
                <div className="editor-toolbar-actions flex items-center gap-2 [-webkit-app-region:no-drag]">
                    {SIDEBAR_ACTIONS.map((action) => (
                        <EditorIconButton key={action.label} {...action} />
                    ))}
                </div>
            </header>

            <section
                aria-label="Sidebar surface"
                className="editor-sidebar-surface grid h-[calc(100%-var(--editor-header-height))] min-h-0 w-[var(--editor-sidebar-width)] grid-rows-[30px_minmax(0,1fr)] overflow-hidden rounded-3xl"
            >
                <SidebarTabs activeTab={activeTab} onSelectTab={onSelectTab} />
                <SidebarContent
                    activeTab={activeTab}
                    document={snapshot.document}
                    onSelectNode={(nodeId) => {
                        session.selectNode(nodeId);
                        onLayerSelect?.();
                    }}
                    selectedNodeId={snapshot.selection.selectedNodeId}
                />
            </section>
        </aside>
    );
};
