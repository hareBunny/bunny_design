/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { MousePointer2 } from 'lucide-react';
import type { CSSProperties } from 'react';

import {
    MIAOMA_AGENT_ROSTER,
    type MiaomaAgentId,
    type MiaomaGenerationAssignment,
    type MiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';

type CanvasAgentCursorLayerProps = {
    run: MiaomaGenerationRun;
    zoom: number;
};

type CursorAnchor = {
    x: number;
    y: number;
};

const COLLABORATOR_CURSOR_ANCHORS: readonly CursorAnchor[] = [
    { x: 0.24, y: 0.3 },
    { x: 0.7, y: 0.34 },
    { x: 0.46, y: 0.62 },
    { x: 0.74, y: 0.7 },
    { x: 0.28, y: 0.72 }
];

const getAgent = (agentId: MiaomaAgentId) =>
    MIAOMA_AGENT_ROSTER.find(({ id }) => id === agentId);

const getPointCoordinate = (size: number, ratio: number) => {
    const padding = Math.min(18, Math.max(0, size / 2));
    return padding + Math.max(0, size - padding * 2) * ratio;
};

const CursorVisual = ({
    agentId,
    cursorIndex,
    zoom
}: {
    agentId: MiaomaAgentId;
    cursorIndex: number;
    zoom: number;
}) => {
    const agent = getAgent(agentId);

    if (!agent) {
        return null;
    }

    const inverseZoom = 1 / Math.max(zoom, 0.01);

    return (
        <div
            className="editor-agent-cursor-visual"
            style={{
                transform: `scale(${inverseZoom})`,
                transformOrigin: '0 0'
            }}
        >
            <div
                className="editor-agent-cursor-orbit relative h-10 min-w-10"
                style={
                    {
                        animationDelay: `${cursorIndex * -0.32}s`,
                        animationDuration: `${2.4 + cursorIndex * 0.16}s`
                    } as CSSProperties
                }
            >
                <MousePointer2
                    aria-hidden="true"
                    className="absolute top-0 left-0 drop-shadow-[0_1px_2px_#00000033]"
                    fill={agent.color}
                    size={19}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                />
                <span
                    className="absolute top-3.5 left-3 whitespace-nowrap rounded-[4px] px-1.5 py-1 text-[11px]/[14px] font-medium shadow-[0_2px_7px_#0000001f]"
                    style={{
                        backgroundColor: agent.color,
                        color: agent.id === 'tesla' ? '#202328' : '#ffffff'
                    }}
                >
                    {agent.name}
                </span>
            </div>
        </div>
    );
};

const PlanningCursor = ({ run, zoom }: CanvasAgentCursorLayerProps) => (
    <div
        className="pointer-events-none absolute inset-0 overflow-visible"
        data-agent-cursor-id={run.coordinatorAgentId}
        data-agent-cursor-state="planning"
    >
        <div className="absolute top-[28%] left-[46%] h-0 w-0">
            <CursorVisual
                agentId={run.coordinatorAgentId}
                cursorIndex={0}
                zoom={zoom}
            />
        </div>
    </div>
);

const AssignmentCursor = ({
    assignment,
    zoom
}: {
    assignment: MiaomaGenerationAssignment;
    zoom: number;
}) => {
    const bounds = assignment.region.bounds;

    if (!bounds) {
        return null;
    }

    const cursorIndex = assignment.order;
    const anchor =
        COLLABORATOR_CURSOR_ANCHORS[
            cursorIndex % COLLABORATOR_CURSOR_ANCHORS.length
        ] ?? COLLABORATOR_CURSOR_ANCHORS[0]!;

    return (
        <div
            className="pointer-events-none absolute overflow-visible"
            data-agent-cursor-id={assignment.agentId}
            data-agent-cursor-region-id={assignment.region.regionId}
            data-agent-cursor-state="designing"
            style={{
                height: `${bounds.height}px`,
                left: `${bounds.x}px`,
                top: `${bounds.y}px`,
                width: `${bounds.width}px`
            }}
        >
            <div
                className="absolute h-0 w-0"
                style={{
                    left: `${getPointCoordinate(bounds.width, anchor.x)}px`,
                    top: `${getPointCoordinate(bounds.height, anchor.y)}px`
                }}
            >
                <CursorVisual
                    agentId={assignment.agentId}
                    cursorIndex={cursorIndex}
                    zoom={zoom}
                />
            </div>
        </div>
    );
};

export const CanvasAgentCursorLayer = ({
    run,
    zoom
}: CanvasAgentCursorLayerProps) => {
    const isPlanning = run.activities.some(
        (activity) =>
            activity.agentId === run.coordinatorAgentId &&
            activity.kind === 'plan-visual' &&
            activity.status === 'running'
    );
    const runningAssignments = run.assignments.filter(
        (assignment) =>
            assignment.status === 'running' && assignment.region.bounds
    );

    if (!isPlanning && runningAssignments.length === 0) {
        return null;
    }

    return (
        <div
            aria-hidden="true"
            className="editor-agent-cursor-layer pointer-events-none absolute inset-0 overflow-visible"
            data-agent-cursor-layer="true"
        >
            {isPlanning && runningAssignments.length === 0 ? (
                <PlanningCursor run={run} zoom={zoom} />
            ) : null}
            {runningAssignments.map((assignment) => (
                <AssignmentCursor
                    assignment={assignment}
                    key={assignment.assignmentId}
                    zoom={zoom}
                />
            ))}
        </div>
    );
};
