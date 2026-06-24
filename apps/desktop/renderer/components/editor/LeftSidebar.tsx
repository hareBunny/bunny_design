/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { LucideIcon } from 'lucide-react';
import { ChevronDown, Eye, FileText, Frame, Square, Type } from 'lucide-react';

import type { DesignNode } from '@miaoma-design-ai/document';

import { SIDEBAR_ACTIONS, SIDEBAR_TABS } from '../../constants/editor';
import { CANVAS_SAMPLE_DESIGN_DOCUMENT } from '../../fixtures/canvasSampleDocument';
import type { LayerRow, SidebarTab } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import { EditorIconButton } from './EditorIconButton';
import { SidebarAgentPanel } from './SidebarAgentPanel';

const DEFAULT_SELECTED_LAYER_ID = 'u6EuTN';

const NODE_TYPE_ICONS: Record<DesignNode['type'], LucideIcon> = {
    ellipse: Square,
    frame: Frame,
    icon: Square,
    rectangle: Square,
    text: Type
};

const toLayerLabel = (node: DesignNode) => node.name ?? node.id;

const toLayerIcon = (node: DesignNode) => {
    if (node.type === 'text') {
        const label = toLayerLabel(node).toLowerCase();

        return label.includes('title') ? FileText : Type;
    }

    return NODE_TYPE_ICONS[node.type];
};

const flattenLayerRows = (nodes: DesignNode[], depth = 0): LayerRow[] =>
    nodes.flatMap((node) => {
        const expanded = node.type === 'frame' && node.children.length > 0;
        const currentRow: LayerRow = {
            id: node.id,
            label: toLayerLabel(node),
            icon: toLayerIcon(node),
            nodeType: node.type,
            depth,
            expanded,
            selected: node.id === DEFAULT_SELECTED_LAYER_ID
        };

        if (node.type !== 'frame' || node.children.length === 0) {
            return [currentRow];
        }

        return [currentRow, ...flattenLayerRows(node.children, depth + 1)];
    });

const CANVAS_LAYER_ROWS = flattenLayerRows(
    CANVAS_SAMPLE_DESIGN_DOCUMENT.children
);

const LayerRowItem = ({
    label,
    icon: Icon,
    nodeType,
    depth,
    expanded,
    selected,
    visible
}: LayerRow) => (
    <div
        className={classNames(
            'editor-layer-row grid w-full items-center rounded-lg text-[12px] leading-none font-medium text-[#1f2937]',
            selected
                ? 'editor-layer-row--selected h-9 w-[calc(100%-1px)] grid-cols-[minmax(0,1fr)_46px] rounded-[10px] bg-[#d9dadd] text-[13px] font-semibold text-[#111827]'
                : 'h-7 grid-cols-[3px_minmax(0,1fr)_auto] bg-transparent',
            !selected && depth === 0 && 'h-[30px] font-semibold'
        )}
        data-depth={depth}
        data-layer-node-type={nodeType}
        data-selected={selected ? 'true' : undefined}
    >
        <span
            className={classNames(
                'editor-layer-rail h-full w-[3px]',
                selected && 'hidden'
            )}
        />
        <span
            className={classNames(
                'editor-layer-content flex h-full min-w-0 items-center gap-1.5 px-3 pl-2.5 text-[#64748b]',
                depth > 0 && 'pl-7',
                selected && 'h-[33px] pl-7 text-[#374151]'
            )}
            style={
                depth > 1
                    ? {
                          paddingLeft: `${28 + (depth - 1) * 19}px`
                      }
                    : undefined
            }
        >
            {expanded ? (
                <ChevronDown
                    aria-hidden="true"
                    className="shrink-0"
                    size={14}
                    strokeWidth={1.8}
                />
            ) : (
                <span className="editor-layer-chevron-spacer h-3.5 w-3.5 shrink-0" />
            )}
            <Icon
                aria-hidden="true"
                className="shrink-0"
                size={16}
                strokeWidth={1.7}
            />
            <span
                className={classNames(
                    'editor-layer-label min-w-0 truncate',
                    selected ? 'text-[#111827]' : 'text-[#1f2937]'
                )}
            >
                {label}
            </span>
        </span>
        {visible ? (
            <span
                className="editor-layer-visibility flex h-[34px] w-[46px] items-center justify-center rounded-[9px] border border-[#e5e7eb] bg-white text-[#6b7280] shadow-[0_1px_4px_#00000012]"
                aria-label="Layer visible"
            >
                <Eye aria-hidden="true" size={16} strokeWidth={1.7} />
            </span>
        ) : null}
    </div>
);

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

const SidebarLayersPanel = () => (
    <div className="editor-sidebar-body min-h-0 overflow-y-auto overflow-x-hidden px-2 pt-2.5 pb-6">
        <div className="editor-layer-tree grid min-h-0 content-start gap-0.5">
            {CANVAS_LAYER_ROWS.map((row) => (
                <LayerRowItem key={row.id} {...row} />
            ))}
        </div>
    </div>
);

export const SidebarContent = ({ activeTab }: { activeTab: SidebarTab }) =>
    activeTab === 'agent' ? <SidebarAgentPanel /> : <SidebarLayersPanel />;

type LeftSidebarProps = {
    activeTab: SidebarTab;
    onSelectTab: (tab: SidebarTab) => void;
};

export const LeftSidebar = ({ activeTab, onSelectTab }: LeftSidebarProps) => (
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
            <SidebarContent activeTab={activeTab} />
        </section>
    </aside>
);
