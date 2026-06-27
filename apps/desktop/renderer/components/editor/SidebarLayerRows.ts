/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { FileText, Frame, type LucideIcon, Square, Type } from 'lucide-react';

import type { EditorNode } from '@miaoma-design-ai/miaoma-editor-core';

import type { LayerRow } from '../../types/editor';

const NODE_TYPE_ICONS: Record<EditorNode['type'], LucideIcon> = {
    ellipse: Square,
    frame: Frame,
    icon: Square,
    rectangle: Square,
    text: Type
};

const toLayerLabel = (node: EditorNode) => node.name ?? node.id;

const toLayerIcon = (node: EditorNode) => {
    if (node.type === 'text') {
        const label = toLayerLabel(node).toLowerCase();

        return label.includes('title') ? FileText : Type;
    }

    return NODE_TYPE_ICONS[node.type];
};

export const getSelectedAncestorIds = (
    nodes: EditorNode[],
    selectedNodeId: string | null | undefined
): Set<string> => {
    const ancestorIds = new Set<string>();

    if (!selectedNodeId) {
        return ancestorIds;
    }

    const visit = (node: EditorNode): boolean => {
        if (node.id === selectedNodeId) {
            return true;
        }

        if (node.type !== 'frame') {
            return false;
        }

        const containsSelectedChild = node.children.some(visit);

        if (containsSelectedChild) {
            ancestorIds.add(node.id);
        }

        return containsSelectedChild;
    };

    nodes.forEach(visit);

    return ancestorIds;
};

export const getSelectedGroupIds = (
    nodes: EditorNode[],
    selectedNodeId: string | null | undefined
): Set<string> => {
    const groupIds = new Set<string>();

    if (!selectedNodeId) {
        return groupIds;
    }

    const visit = (node: EditorNode) => {
        if (
            node.id === selectedNodeId &&
            node.type === 'frame' &&
            node.children.length > 0
        ) {
            groupIds.add(node.id);
            return;
        }

        if (node.type === 'frame') {
            node.children.forEach(visit);
        }
    };

    nodes.forEach(visit);

    return groupIds;
};

export const flattenLayerRows = ({
    depth = 0,
    expandedLayerIds,
    groupHighlightAncestorId = null,
    nodes,
    selectedNodeId
}: {
    nodes: EditorNode[];
    expandedLayerIds: Set<string>;
    groupHighlightAncestorId?: string | null;
    selectedNodeId?: string | null;
    depth?: number;
}): LayerRow[] =>
    nodes.flatMap((node) => {
        const children = node.type === 'frame' ? (node.children ?? []) : [];
        const hasChildren = node.type === 'frame' && children.length > 0;
        const expanded = hasChildren && expandedLayerIds.has(node.id);
        const currentRow: LayerRow = {
            id: node.id,
            label: toLayerLabel(node),
            icon: toLayerIcon(node),
            nodeType: node.type,
            depth,
            hasChildren,
            expanded,
            groupHighlighted: groupHighlightAncestorId !== null,
            selected: node.id === selectedNodeId
        };

        if (!hasChildren || !expanded) {
            return [currentRow];
        }

        return [
            currentRow,
            ...flattenLayerRows({
                nodes: children,
                depth: depth + 1,
                expandedLayerIds,
                groupHighlightAncestorId:
                    groupHighlightAncestorId ??
                    (node.id === selectedNodeId ? node.id : null),
                selectedNodeId
            })
        ];
    });
