/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { AGENT_TIMELINE_ITEMS } from '../../constants/editor';
import type { AgentTimelineItem } from '../../types/editor';
import { classNames } from '../../utils/classNames';

const AgentCheckIcon = () => (
    <svg
        aria-hidden="true"
        className="h-[9px] w-[9px] shrink-0 overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
    >
        <path d="M20 6l-11 11-5-5 1.5-1.5 3.5 3.5 9.5-9.5z" fill="#12B76A" />
    </svg>
);

const AgentChevronIcon = () => (
    <svg
        aria-hidden="true"
        className="h-[13px] w-[13px] shrink-0 overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 24 24"
    >
        <path
            d="M7.41 8.59l4.59 4.58 4.59-4.58 1.41 1.41-6 6-6-6z"
            fill="#9CA3AF"
        />
    </svg>
);

const PromptChevronIcon = () => (
    <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 14 14"
    >
        <path
            d="M3.34619 4.68945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04785 0.25977 0.05127 0.08887 1.8628 1.9038 1.81494 1.81152 1.9038 1.8628 0.09229 0.04785 0.25977 0.04785 0.16748 0 0.25635-0.04785 0.09229-0.05127 1.90381-1.8628 1.81494-1.81494 1.86279-1.9038 0.05127-0.09229 0.05127-0.25977 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
            fill="#5D5E66"
        />
    </svg>
);

const AgentTitlePill = ({
    height = 24,
    text
}: Extract<AgentTimelineItem, { type: 'pill' }>) => (
    <div
        className={classNames(
            'editor-agent-title-row flex w-full shrink-0 justify-end',
            height === 28 ? 'h-7' : 'h-6'
        )}
    >
        <span className="editor-agent-title-pill flex h-6 items-center justify-center rounded-full bg-[#23272f] px-3 py-[5px] font-cn text-[12px]/[normal] font-normal text-white">
            {text}
        </span>
    </div>
);

const AgentStatusRow = ({ label }: { label: string }) => (
    <button
        className="editor-agent-status-row flex h-7 w-full shrink-0 cursor-default items-center justify-between gap-2 rounded-[12px] border border-[#e8eaee] bg-white px-2 text-[#1f2937] shadow-[0_1px_2px_#00000008]"
        type="button"
    >
        <span className="flex min-w-0 items-center gap-1.5">
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#e9fff4] text-[#12b76a]">
                <AgentCheckIcon />
            </span>
            <span className="min-w-0 truncate text-[12px]/[normal] font-normal">
                {label}
            </span>
        </span>
        <AgentChevronIcon />
    </button>
);

const AgentSummaryBlock = ({
    agent,
    height,
    text
}: Extract<AgentTimelineItem, { type: 'summary' }>) => (
    <section
        className={classNames(
            'editor-agent-summary flex w-full shrink-0 flex-col gap-2 px-1 py-2',
            height === 157 ? 'h-[157px]' : 'h-[146px]'
        )}
    >
        <div className="editor-agent-summary-status flex h-4 w-full items-center gap-1.5">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#2563eb]" />
            <span className="text-[12px]/[normal] font-medium text-[#596273]">
                {agent}
            </span>
        </div>
        <p className="m-0 whitespace-pre-line text-[12.5px]/[19px] font-normal text-[#202328]">
            {text}
        </p>
    </section>
);

const AgentTimelineNode = ({ item }: { item: AgentTimelineItem }) => {
    if (item.type === 'pill') {
        return <AgentTitlePill {...item} />;
    }

    if (item.type === 'status') {
        return <AgentStatusRow label={item.label} />;
    }

    return <AgentSummaryBlock {...item} />;
};

const AgentPromptDock = () => (
    <section className="editor-agent-prompt-dock flex h-[104px] w-[277px] shrink-0 flex-col gap-[18px] overflow-hidden rounded-[22px] border border-[#ececee] bg-white p-[18px] shadow-[0_6px_24px_#00000012] max-[980px]:w-full">
        <textarea
            aria-label="Agent prompt"
            className="h-8 w-[137px] shrink-0 resize-none border-0 bg-transparent p-0 text-[14px]/[normal] font-normal text-[#202328] outline-none placeholder:text-[#6c6c72]"
            placeholder="Design anything..."
        />
        <footer className="flex h-6 w-full items-center justify-between">
            <span className="text-[14px]/[normal] font-medium text-[#ff8b1f]">
                ⚡ 6x
            </span>
            <div className="flex items-center gap-2">
                <button
                    className="flex cursor-default items-center gap-1.5 border-0 bg-transparent p-0 text-[12px]/[normal] font-light text-[#5e5f67]"
                    type="button"
                >
                    GPT 5.5
                    <PromptChevronIcon />
                </button>
                <button
                    aria-label="Send agent prompt"
                    className="grid h-[22px] w-[22px] cursor-default place-items-center rounded-[11px] border-0 bg-[#f1f2f4] p-0 text-[14px]/[normal] font-semibold text-[#b7b8bf]"
                    type="button"
                >
                    ↑
                </button>
            </div>
        </footer>
    </section>
);

export const SidebarAgentPanel = () => (
    <div className="editor-agent-panel flex h-full min-h-0 flex-col justify-between gap-2.5 overflow-hidden py-3 pr-[11px] pl-3">
        <div className="editor-agent-timeline flex min-h-0 w-[277px] flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden max-[980px]:w-full">
            {AGENT_TIMELINE_ITEMS.map((item) => (
                <AgentTimelineNode item={item} key={item.id} />
            ))}
        </div>
        <AgentPromptDock />
    </div>
);
