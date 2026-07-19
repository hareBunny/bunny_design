/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Check, ChevronDown, LoaderCircle, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import {
    MIAOMA_AGENT_ACTIVITY_LABELS,
    MIAOMA_AGENT_ROSTER,
    MIAOMA_COORDINATOR_AGENT_ID,
    type MiaomaAgentActivity,
    type MiaomaAgentId,
    type MiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';

import { classNames } from '../../utils/classNames';

import type { MiaomaGenerationController } from './state/useMiaomaGeneration';
import { PromptDock } from './PromptDock';

type AgentSelectorOption = {
    id: MiaomaAgentId;
    label: string;
    dotColor: string;
    isRunning: boolean;
};

const TERMINAL_RUN_STATUSES = new Set<MiaomaGenerationRun['status']>([
    'completed',
    'failed',
    'cancelled'
]);

const MAX_VISIBLE_COMPLETED_BASH_ACTIVITIES = 2;
const DEFAULT_AGENT_ID: MiaomaAgentId = 'miaoma';

const getAgentSelectorOptions = (
    run?: MiaomaGenerationRun | null
): AgentSelectorOption[] => {
    if (!run) {
        return MIAOMA_AGENT_ROSTER.map((agent) => ({
            id: agent.id,
            label: agent.name,
            dotColor: agent.color,
            isRunning: false
        }));
    }

    const agentIds = [
        run.coordinatorAgentId,
        ...run.assignments.map(({ agentId }) => agentId)
    ];

    return [...new Set(agentIds)].flatMap((id) => {
        const agent = MIAOMA_AGENT_ROSTER.find(
            (candidate) => candidate.id === id
        );
        if (!agent) {
            return [];
        }

        const assignment = run.assignments.find(
            (candidate) => candidate.agentId === id
        );

        return [
            {
                id: agent.id,
                label: agent.name,
                dotColor: agent.color,
                isRunning:
                    agent.role === 'coordinator'
                        ? !TERMINAL_RUN_STATUSES.has(run.status)
                        : assignment?.status === 'running'
            }
        ];
    });
};

const AgentTopControl = ({
    onAgentSelect,
    options,
    selectedAgentId
}: {
    onAgentSelect: (agentId: MiaomaAgentId) => void;
    options: AgentSelectorOption[];
    selectedAgentId: MiaomaAgentId;
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const controlRef = useRef<HTMLDivElement | null>(null);
    const listboxId = useId();
    const selectedAgent = options.find(({ id }) => id === selectedAgentId);
    const runningAgentCount = options.filter(
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
                    {runningAgentCount}/{options.length} 个智能体运行中
                </span>
            </div>

            <button
                aria-label={`切换智能体，当前为 ${selectedAgent.label}`}
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
                    aria-label="选择智能体"
                    className="editor-agent-selector-menu absolute top-[calc(100%+6px)] right-[10px] z-20 w-[148px] overflow-hidden rounded-[14px] border border-[#e8eaee] bg-white p-1.5 shadow-[0_18px_44px_#1118271a]"
                    id={listboxId}
                    role="listbox"
                >
                    {options.map((option) => {
                        const isSelected = option.id === selectedAgent.id;

                        return (
                            <button
                                aria-label={option.label}
                                aria-selected={isSelected}
                                className={classNames(
                                    'flex w-full cursor-default items-center justify-between gap-3 rounded-[12px] border-0 px-2.5 py-2 text-left',
                                    isSelected
                                        ? 'bg-[#f4f7fb]'
                                        : 'bg-transparent hover:bg-[#f8fafc]'
                                )}
                                key={option.id}
                                onClick={() => {
                                    onAgentSelect(option.id);
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
                                {option.id !== MIAOMA_COORDINATOR_AGENT_ID &&
                                option.isRunning ? (
                                    <LoaderCircle
                                        aria-label={`${option.label} 正在执行`}
                                        className="shrink-0 animate-spin text-[#7b8492]"
                                        size={12}
                                        strokeWidth={2}
                                    />
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};

const AgentPromptBubble = ({ text }: { text: string }) => (
    <div className="editor-agent-title-row flex w-full shrink-0 justify-end">
        <p className="editor-agent-title-pill m-0 max-w-[92%] whitespace-pre-wrap break-words rounded-[8px] bg-[#23272f] px-3 py-2 font-cn text-[12px]/[18px] font-normal text-white">
            {text}
        </p>
    </div>
);

const AgentStatusIcon = ({
    status
}: {
    status: MiaomaAgentActivity['status'];
}) => {
    const label =
        status === 'running'
            ? '进行中'
            : status === 'failed'
              ? '失败'
              : '已完成';

    return (
        <span
            aria-label={label}
            className={classNames(
                'grid h-4 w-4 shrink-0 place-items-center rounded-full',
                status === 'running'
                    ? 'bg-[#eff6ff] text-[#2563eb]'
                    : status === 'failed'
                      ? 'bg-[#fff1f0] text-[#d92d20]'
                      : 'bg-[#e9fff4] text-[#12b76a]'
            )}
        >
            {status === 'running' ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            ) : status === 'failed' ? (
                <X aria-hidden="true" size={9} strokeWidth={2.8} />
            ) : (
                <Check aria-hidden="true" size={9} strokeWidth={2.8} />
            )}
        </span>
    );
};

const AgentStatusRow = ({ label }: { label: string }) => (
    <div
        className="editor-agent-status-row flex h-7 w-full shrink-0 items-center gap-2 rounded-[12px] border border-[#e8eaee] bg-white px-2 text-[#1f2937] shadow-[0_1px_2px_#00000008]"
        role="status"
    >
        <AgentStatusIcon status="running" />
        <span className="min-w-0 truncate text-[12px]/[normal] font-normal">
            {label}
        </span>
    </div>
);

const AgentActivityRow = ({ activity }: { activity: MiaomaAgentActivity }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const label = MIAOMA_AGENT_ACTIVITY_LABELS[activity.kind];

    return (
        <div className="w-full shrink-0">
            <button
                aria-expanded={isExpanded}
                className="editor-agent-status-row flex h-7 w-full cursor-default items-center justify-between gap-2 rounded-[12px] border border-[#e8eaee] bg-white px-2 text-[#1f2937] shadow-[0_1px_2px_#00000008]"
                data-activity-status={activity.status}
                onClick={() => setIsExpanded((expanded) => !expanded)}
                type="button"
            >
                <span className="flex min-w-0 items-center gap-1.5">
                    <AgentStatusIcon status={activity.status} />
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

const getVisibleAgentActivities = (
    run: MiaomaGenerationRun,
    agentId: MiaomaAgentId
) => {
    const activities = run.activities.filter(
        (activity) => activity.agentId === agentId
    );
    const visibleCompletedBashIds = new Set<string>();

    for (
        let index = activities.length - 1;
        index >= 0 &&
        visibleCompletedBashIds.size < MAX_VISIBLE_COMPLETED_BASH_ACTIVITIES;
        index -= 1
    ) {
        const activity = activities[index];
        if (activity?.kind === 'bash' && activity.status === 'completed') {
            visibleCompletedBashIds.add(activity.activityId);
        }
    }

    return activities.filter(
        (activity) =>
            activity.kind !== 'bash' ||
            activity.status !== 'completed' ||
            visibleCompletedBashIds.has(activity.activityId)
    );
};

const getAgentOpeningPrompt = (
    run: MiaomaGenerationRun,
    agentId: MiaomaAgentId
) => {
    if (agentId === run.coordinatorAgentId) {
        return run.prompt;
    }

    const assignment = run.assignments.find(
        (candidate) => candidate.agentId === agentId
    );
    return assignment
        ? `任务分配：负责「${assignment.region.label}」模块。${assignment.objective}`
        : null;
};

const getAgentName = (agentId: MiaomaAgentId) =>
    MIAOMA_AGENT_ROSTER.find(({ id }) => id === agentId)?.name ?? agentId;

const AgentCollaborationStatus = ({ run }: { run: MiaomaGenerationRun }) => {
    const assignments = run.assignments;
    const activeAssignments = TERMINAL_RUN_STATUSES.has(run.status)
        ? []
        : assignments.filter(
              ({ status }) => status === 'pending' || status === 'running'
          );

    if (activeAssignments.length > 0) {
        const names = activeAssignments
            .map(({ agentId }) => getAgentName(agentId))
            .join('、');

        return (
            <div
                className="mx-1 flex items-center gap-2 py-1.5 text-[11px]/[16px] text-[#6b7280]"
                role="status"
            >
                <LoaderCircle
                    aria-hidden="true"
                    className="shrink-0 animate-spin"
                    size={12}
                    strokeWidth={2}
                />
                <span>{names} 正在执行</span>
            </div>
        );
    }

    const allAssignmentsFinished =
        assignments.length > 0 &&
        assignments.every(
            ({ status }) => status === 'completed' || status === 'placeholder'
        );

    if (!allAssignmentsFinished) {
        return null;
    }

    return (
        <section className="mx-1 border-l-2 border-[#cfd8e6] py-1 pl-3 text-[#4b5563]">
            <p className="m-0 text-[12px]/[18px] font-medium text-[#303742]">
                已完成本轮并行设计，结果如下：
            </p>
            <ul className="m-0 mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[11px]/[17px]">
                {assignments.map((assignment) => (
                    <li key={assignment.assignmentId}>
                        <span className="font-medium">
                            {getAgentName(assignment.agentId)}
                        </span>
                        {assignment.status === 'placeholder'
                            ? `：「${assignment.region.label}」模块使用占位结果，${assignment.reason}`
                            : `：完成「${assignment.region.label}」模块，${assignment.objective}`}
                    </li>
                ))}
            </ul>
        </section>
    );
};

const AgentAssignmentSummary = ({
    agentId,
    run
}: {
    agentId: MiaomaAgentId;
    run: MiaomaGenerationRun;
}) => {
    const assignment = run.assignments.find(
        (candidate) => candidate.agentId === agentId
    );

    if (
        !assignment ||
        assignment.status === 'pending' ||
        assignment.status === 'running'
    ) {
        return null;
    }

    const isPlaceholder = assignment.status === 'placeholder';

    return (
        <section className="mx-1 border-l-2 border-[#cfd8e6] py-1 pl-3 text-[#4b5563]">
            <p className="m-0 text-[12px]/[18px] font-medium text-[#303742]">
                {getAgentName(agentId)}
                {isPlaceholder ? ' 已生成占位结果' : ' 已完成任务'}
            </p>
            <ul className="m-0 mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[11px]/[17px]">
                <li>模块：{assignment.region.label}</li>
                <li>目标：{assignment.objective}</li>
                <li>
                    结果：
                    {isPlaceholder ? '已生成占位结果' : '已完成设计并写入画布'}
                </li>
                {isPlaceholder ? <li>原因：{assignment.reason}</li> : null}
            </ul>
        </section>
    );
};

const AgentRunTimeline = ({
    agentId,
    run
}: {
    agentId: MiaomaAgentId;
    run: MiaomaGenerationRun;
}) => {
    const openingPrompt = getAgentOpeningPrompt(run, agentId);
    const activities = getVisibleAgentActivities(run, agentId);

    return (
        <div className="editor-agent-timeline-stack flex w-full flex-col gap-2.5 px-3 pr-[11px]">
            {openingPrompt ? <AgentPromptBubble text={openingPrompt} /> : null}
            {activities.map((activity) => (
                <AgentActivityRow
                    activity={activity}
                    key={activity.activityId}
                />
            ))}
            {agentId === run.coordinatorAgentId ? (
                <AgentCollaborationStatus run={run} />
            ) : (
                <AgentAssignmentSummary agentId={agentId} run={run} />
            )}
        </div>
    );
};

const AgentStartingRow = () => (
    <div className="editor-agent-timeline-stack flex w-full flex-col gap-2.5 px-3 pr-[11px]">
        <AgentStatusRow label="正在启动" />
    </div>
);

type SidebarAgentPanelProps = {
    generation?: MiaomaGenerationController;
};

export const SidebarAgentPanel = ({ generation }: SidebarAgentPanelProps) => {
    const [promptDraft, setPromptDraft] = useState('');
    const [requestedAgentId, setRequestedAgentId] =
        useState<MiaomaAgentId>(DEFAULT_AGENT_ID);
    const selectorOptions = useMemo(
        () => getAgentSelectorOptions(generation?.run),
        [generation?.run]
    );
    const selectedAgentId = selectorOptions.some(
        ({ id }) => id === requestedAgentId
    )
        ? requestedAgentId
        : (selectorOptions[0]?.id ?? DEFAULT_AGENT_ID);
    const hasStartedCollaborators =
        generation?.run?.assignments.some(
            ({ status }) => status !== 'pending'
        ) ?? false;

    return (
        <div className="editor-agent-panel flex h-full min-h-0 flex-col overflow-hidden py-3">
            {hasStartedCollaborators ? (
                <div className="shrink-0 px-3 pr-[11px]">
                    <AgentTopControl
                        onAgentSelect={setRequestedAgentId}
                        options={selectorOptions}
                        selectedAgentId={selectedAgentId}
                    />
                </div>
            ) : null}
            <div
                className={classNames(
                    'editor-agent-timeline flex min-h-0 flex-1 overflow-y-auto overflow-x-hidden',
                    hasStartedCollaborators ? 'mt-2.5' : ''
                )}
            >
                {generation?.run ? (
                    <AgentRunTimeline
                        agentId={selectedAgentId}
                        run={generation.run}
                    />
                ) : generation?.isRunning ? (
                    <AgentStartingRow />
                ) : (
                    <section className="flex min-h-full w-full flex-1 items-center px-6 py-8">
                        <div className="w-full">
                            <p className="m-0 text-[15px]/[22px] font-medium text-[#202328]">
                                Hi, I am your design agent.
                            </p>
                            <p className="m-0 mt-1 text-[13px]/[20px] text-[#6c6c72]">
                                Tell me what you want to design.
                            </p>
                        </div>
                    </section>
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
                    onValueChange={setPromptDraft}
                    value={promptDraft}
                    variant="agent"
                />
            </div>
        </div>
    );
};
