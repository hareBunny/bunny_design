/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { ChevronDown, Eye } from 'lucide-react';

import {
    CONTENT_LAYER_ROWS,
    RECREATION_LAYER_ROWS,
    SIDEBAR_ACTIONS
} from '../../constants/editor';
import type { LayerRow } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import { EditorIconButton } from './EditorIconButton';

const LayerRowItem = ({
    label,
    icon: Icon,
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
                depth === 1 && 'pl-7',
                depth === 2 && 'pl-[46px]',
                selected && 'h-[33px] pl-7 text-[#374151]'
            )}
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

const LayerGroup = ({ rows }: { rows: LayerRow[] }) => (
    <div className="editor-layer-group grid gap-0.5">
        {rows.map((row) => (
            <LayerRowItem key={row.id} {...row} />
        ))}
    </div>
);

export const LeftSidebar = () => (
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
            className="editor-sidebar-surface grid h-[calc(100%-var(--editor-header-height))] min-h-0 w-[var(--editor-sidebar-width)] grid-rows-[40px_minmax(0,1fr)] overflow-hidden rounded-3xl"
            aria-label="Layers"
        >
            <div className="editor-tabs-row flex h-10 items-center gap-3 p-2">
                <button
                    className="editor-tab h-7 cursor-default rounded-lg border-0 bg-transparent px-2 py-1 text-[13px] leading-none font-semibold text-[#6b7280]"
                    type="button"
                >
                    Agent
                </button>
                <button
                    className="editor-tab editor-tab--active h-7 cursor-default rounded-md border-0 bg-[#e9e9e9] px-2 py-1 text-[14px] leading-none font-semibold text-[#111827]"
                    type="button"
                >
                    Layers
                </button>
            </div>

            <div className="editor-sidebar-body min-h-0 overflow-hidden px-2 pt-2.5 pb-6">
                <div className="editor-layer-tree grid min-h-0 content-start gap-2.5 overflow-hidden">
                    <LayerGroup rows={CONTENT_LAYER_ROWS} />
                    <LayerGroup rows={RECREATION_LAYER_ROWS} />
                </div>
            </div>
        </section>
    </aside>
);
