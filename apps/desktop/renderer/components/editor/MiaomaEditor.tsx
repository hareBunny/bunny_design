/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Bot, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { EDITOR_DESIGN_METRICS } from '../../constants/editor';
import type { SidebarTab } from '../../types/editor';

import { CanvasStage } from './CanvasStage';
import { LeftSidebar } from './LeftSidebar';
import { RightInspector } from './RightInspector';

const MainHeader = () => (
    <header className="editor-main-header col-start-1 row-start-1 flex h-[var(--editor-header-height)] min-w-0 items-center justify-between border-b border-[#ededed] bg-[#f6f6f6] px-6 [-webkit-app-region:drag]">
        <p className="editor-document-title m-0 min-w-0 overflow-hidden text-[13px] leading-none font-medium overflow-ellipsis whitespace-nowrap text-[#1a1a1a]">
            miaoma-magicut.miaomadesign — Edited
        </p>
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

export const MiaomaEditor = () => {
    const [activeSidebarTab, setActiveSidebarTab] =
        useState<SidebarTab>('agent');

    return (
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
                onSelectTab={setActiveSidebarTab}
            />
            <section className="editor-content grid h-full min-w-0 grid-cols-[minmax(0,1fr)_var(--editor-inspector-width)] grid-rows-[var(--editor-header-height)_minmax(0,1fr)] overflow-hidden rounded-l-3xl border-l border-[#e6e6e6] bg-[#f6f6f6] shadow-[-4px_0_20px_#0000001a] max-[980px]:grid-cols-[minmax(520px,1fr)]">
                <MainHeader />
                <CanvasStage activeSidebarTab={activeSidebarTab} />
                <RightInspector />
            </section>
        </div>
    );
};
