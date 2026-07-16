/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
    MIAOMA_AGENT_ACTIVITY_LABELS,
    MIAOMA_AGENT_ROSTER,
    type MiaomaAgentActivity,
    type MiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';

import { AGENT_TIMELINE_ITEMS } from '../../constants/editor';
import type { AgentTimelineItem } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import type { MiaomaGenerationController } from './state/useMiaomaGeneration';
import { PromptDock } from './PromptDock';

type AgentSelectorOption = {
    id: string;
    label: string;
    dotColor: string;
    isRunning: boolean;
};

const AGENT_SELECTOR_OPTIONS: AgentSelectorOption[] = [
    {
        id: 'newton',
        label: 'Newton',
        dotColor: '#AFC3ED',
        isRunning: true
    },
    {
        id: 'mendel',
        label: 'Mendel',
        dotColor: '#C3EAD8',
        isRunning: false
    }
];

const DEFAULT_AGENT_ID = AGENT_SELECTOR_OPTIONS[0]?.id ?? 'newton';

const AgentTopControl = ({ run }: { run?: MiaomaGenerationRun | null }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedAgentId, setSelectedAgentId] = useState(DEFAULT_AGENT_ID);
    const controlRef = useRef<HTMLDivElement | null>(null);
    const listboxId = useId();
    const selectorOptions = useMemo(() => {
        if (!run) {
            return AGENT_SELECTOR_OPTIONS;
        }

        const ids = [
            run.coordinatorAgentId,
            ...run.assignments.map(({ agentId }) => agentId)
        ];

        return ids.flatMap((id) => {
            const agent = MIAOMA_AGENT_ROSTER.find(
                (candidate) => candidate.id === id
            );

            return agent
                ? [
                      {
                          id: agent.id,
                          label: agent.name,
                          dotColor: agent.color,
                          isRunning:
                              run.status !== 'completed' &&
                              run.status !== 'failed' &&
                              run.status !== 'cancelled'
                      }
                  ]
                : [];
        });
    }, [run]);
    const selectedAgent = useMemo(
        () =>
            selectorOptions.find(({ id }) => id === selectedAgentId) ??
            selectorOptions[0],
        [selectedAgentId, selectorOptions]
    );
    const runningAgentCount = selectorOptions.filter(
        ({ isRunning }) => isRunning
    ).length;

    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (
                controlRef.current &&
                !controlRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    if (!selectedAgent) {
        return null;
    }

    return (
        <div
            className="editor-agent-top-control relative z-10 flex h-9 w-full items-center justify-between rounded-[12px] px-[10px]"
            ref={controlRef}
        >
            <div className="flex h-[27px] w-[132px] shrink-0 items-center gap-2">
                <span className="truncate text-[12px]/[normal] font-normal text-[#828282]">
                    {runningAgentCount}/{selectorOptions.length} agent running
                </span>
            </div>

            <button
                aria-controls={listboxId}
                aria-expanded={isMenuOpen}
                aria-haspopup="listbox"
                className="editor-agent-selector-trigger flex h-[27px] w-[130px] shrink-0 cursor-default items-center justify-end gap-[7px] border-0 bg-transparent px-[2px] py-0 text-left"
                onClick={() => {
                    setIsMenuOpen((open) => !open);
                }}
                onKeyDown={(event) => {
                    if (
                        event.key === 'ArrowDown' ||
                        event.key === 'Enter' ||
                        event.key === ' '
                    ) {
                        event.preventDefault();
                        setIsMenuOpen(true);
                    }
                }}
                type="button"
            >
                <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: selectedAgent.dotColor }}
                />
                <span className="truncate text-[12px]/[normal] font-normal text-[#5f6068]">
                    {selectedAgent.label}
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={classNames(
                        'shrink-0 text-[#6f717a] transition-transform duration-150',
                        isMenuOpen ? 'rotate-180' : 'rotate-0'
                    )}
                    size={14}
                    strokeWidth={1.9}
                />
            </button>

            {isMenuOpen ? (
                <div
                    aria-label="Multi agent selector"
                    className="editor-agent-selector-menu absolute top-[calc(100%+6px)] right-[10px] z-20 w-[148px] overflow-hidden rounded-[14px] border border-[#e8eaee] bg-white p-1.5 shadow-[0_18px_44px_#1118271a]"
                    id={listboxId}
                    role="listbox"
                >
                    {selectorOptions.map((option) => {
                        const isSelected = option.id === selectedAgent.id;

                        return (
                            <button
                                aria-selected={isSelected}
                                className={classNames(
                                    'flex w-full cursor-default items-center justify-between gap-3 rounded-[12px] border-0 px-2.5 py-2 text-left',
                                    isSelected
                                        ? 'bg-[#f4f7fb]'
                                        : 'bg-transparent hover:bg-[#f8fafc]'
                                )}
                                key={option.id}
                                onClick={() => {
                                    setSelectedAgentId(option.id);
                                    setIsMenuOpen(false);
                                }}
                                role="option"
                                type="button"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <span
                                        aria-hidden="true"
                                        className="h-2 w-2 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: option.dotColor
                                        }}
                                    />
                                    <span className="min-w-0 truncate text-[12px]/[normal] font-medium text-[#202328]">
                                        {option.label}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

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
                <Check aria-hidden="true" size={9} strokeWidth={2.8} />
            </span>
            <span className="min-w-0 truncate text-[12px]/[normal] font-normal">
                {label}
            </span>
        </span>
        <ChevronDown
            aria-hidden="true"
            className="shrink-0 text-[#9ca3af]"
            size={13}
            strokeWidth={1.9}
        />
    </button>
);

const AgentActivityRow = ({ activity }: { activity: MiaomaAgentActivity }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const label = MIAOMA_AGENT_ACTIVITY_LABELS[activity.kind];
    const isRunning = activity.status === 'running';

    return (
        <div className="w-full shrink-0">
            <button
                aria-expanded={isExpanded}
                className="editor-agent-status-row flex h-7 w-full cursor-default items-center justify-between gap-2 rounded-[12px] border border-[#e8eaee] bg-white px-2 text-[#1f2937] shadow-[0_1px_2px_#00000008]"
                onClick={() => setIsExpanded((expanded) => !expanded)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    <span
                        className={classNames(
                            'grid h-4 w-4 shrink-0 place-items-center rounded-full',
                            isRunning
                                ? 'bg-[#eff6ff] text-[#2563eb]'
                                : activity.status === 'failed'
                                  ? 'bg-[#fff1f0] text-[#d92d20]'
                                  : 'bg-[#e9fff4] text-[#12b76a]'
                        )}
                    >
                        {isRunning ? (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                        ) : (
                            <Check
                                aria-hidden="true"
                                size={9}
                                strokeWidth={2.8}
                            />
                        )}
                    </span>
                    <span className="min-w-0 truncate text-[12px]/[normal] font-normal">
                        {label}
                    </span>
                </span>
                <ChevronDown
                    aria-hidden="true"
                    className={classNames(
                        'shrink-0 text-[#9ca3af] transition-transform duration-150',
                        isExpanded ? 'rotate-180' : 'rotate-0'
                    )}
                    size={13}
                    strokeWidth={1.9}
                />
            </button>
            {isExpanded ? (
                <div className="mx-1 mt-1 rounded-[9px] bg-[#f7f8fa] px-2.5 py-2 text-[11px]/[16px] text-[#5f6068]">
                    <div className="font-medium text-[#3f4652]">Input</div>
                    <pre className="m-0 mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px]/[14px]">
                        {JSON.stringify(activity.input, null, 2)}
                    </pre>
                    {activity.status !== 'running' ? (
                        <>
                            <div className="mt-2 font-medium text-[#3f4652]">
                                Output
                            </div>
                            <p className="m-0 mt-1 whitespace-pre-wrap break-words">
                                {activity.output.summary}
                            </p>
                        </>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

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

const AgentRunTimeline = ({ run }: { run: MiaomaGenerationRun }) => (
    <div className="editor-agent-timeline-stack flex w-full flex-col gap-2.5 px-3 pr-[11px]">
        <AgentTitlePill
            height={28}
            id={`prompt-${run.runId}`}
            text={run.prompt}
            type="pill"
        />
        {run.activities.map((activity) => (
            <AgentActivityRow activity={activity} key={activity.activityId} />
        ))}
    </div>
);

const AgentStartingRow = () => (
    <div className="editor-agent-timeline-stack flex w-full flex-col gap-2.5 px-3 pr-[11px]">
        <AgentStatusRow label="Starting" />
    </div>
);

type SidebarAgentPanelProps = {
    generation?: MiaomaGenerationController;
};

export const SidebarAgentPanel = ({ generation }: SidebarAgentPanelProps) => (
    <div className="editor-agent-panel flex h-full min-h-0 flex-col overflow-hidden py-3">
        <div className="shrink-0 px-3 pr-[11px]">
            <AgentTopControl run={generation?.run} />
        </div>
        <div className="editor-agent-timeline mt-2.5 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            {generation?.run ? (
                <AgentRunTimeline run={generation.run} />
            ) : generation?.isRunning ? (
                <AgentStartingRow />
            ) : (
                <div className="editor-agent-timeline-stack flex w-full flex-col gap-2.5 px-3 pr-[11px]">
                    {AGENT_TIMELINE_ITEMS.map((item) => (
                        <AgentTimelineNode item={item} key={item.id} />
                    ))}
                </div>
            )}
        </div>
        {generation?.error ? (
            <p className="m-0 shrink-0 px-4 pt-2 text-[11px]/[16px] text-[#d92d20]">
                {generation.error}
            </p>
        ) : null}
        <div className="shrink-0 px-3 pr-[11px] pt-2.5">
            <PromptDock
                isRunning={generation?.isRunning}
                onCancel={generation?.cancel}
                onSubmit={generation?.start}
                variant="agent"
            />
        </div>
    </div>
);
