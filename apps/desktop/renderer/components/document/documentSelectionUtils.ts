/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

const DOUBLE_CLICK_SEQUENCE_TIMEOUT_MS = 500;

export type DoubleClickSelectionTarget = {
    nodeId: string;
    wasSelectedAtSequenceStart: boolean;
    sequenceStartedAt: number;
};

const getCommonPathLength = (left: string[], right: string[]) => {
    const maxLength = Math.min(left.length, right.length);
    let index = 0;

    while (index < maxLength && left[index] === right[index]) {
        index += 1;
    }

    return index;
};

export const findDesignNodePathById = (
    nodes: MiaomaDesignDocument['children'],
    nodeId: string
): string[] | null => {
    for (const node of nodes) {
        if (node.id === nodeId) {
            return [node.id];
        }

        if (node.type !== 'frame') {
            continue;
        }

        const nestedPath = findDesignNodePathById(node.children, nodeId);

        if (nestedPath) {
            return [node.id, ...nestedPath];
        }
    }

    return null;
};

export const getNextSelectedNodeIdFromPath = ({
    clickCount,
    nodePath,
    selectedNodeId,
    selectedNodePath
}: {
    nodePath: string[];
    selectedNodeId?: string | null;
    selectedNodePath?: string[] | null;
    clickCount: number;
}) => {
    if (nodePath.length === 0) {
        return null;
    }

    if (clickCount >= 2) {
        return nodePath.at(-1) ?? nodePath[0];
    }

    const selectedIndex =
        selectedNodeId === undefined || selectedNodeId === null
            ? -1
            : nodePath.indexOf(selectedNodeId);

    if (selectedIndex === -1) {
        const commonPathLength = getCommonPathLength(
            selectedNodePath ?? [],
            nodePath
        );

        if (commonPathLength > 0 && commonPathLength < nodePath.length) {
            return nodePath[commonPathLength];
        }

        return nodePath[0];
    }

    return nodePath[Math.min(selectedIndex + 1, nodePath.length - 1)];
};

export const getNextDoubleClickSelectionTarget = ({
    clickCount,
    currentTarget,
    eventTimeStamp,
    nodeId,
    selectedNodeId
}: {
    nodeId?: string | null;
    selectedNodeId?: string | null;
    currentTarget?: DoubleClickSelectionTarget | null;
    clickCount: number;
    eventTimeStamp: number;
}): DoubleClickSelectionTarget | null => {
    if (!nodeId) {
        return null;
    }

    const elapsedTime =
        eventTimeStamp - (currentTarget?.sequenceStartedAt ?? 0);
    const isContinuingDoubleClickSequence =
        currentTarget?.nodeId === nodeId &&
        clickCount !== 1 &&
        elapsedTime >= 0 &&
        elapsedTime <= DOUBLE_CLICK_SEQUENCE_TIMEOUT_MS;

    if (isContinuingDoubleClickSequence) {
        return currentTarget;
    }

    return {
        nodeId,
        wasSelectedAtSequenceStart: selectedNodeId === nodeId,
        sequenceStartedAt: eventTimeStamp
    };
};
