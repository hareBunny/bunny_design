/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { type ReactElement, useMemo, useState } from 'react';

import type {
    EditorDocument,
    EditorNode
} from '@miaoma-design-ai/miaoma-editor-core';

import type { LayerRow } from '../../types/editor';

import { SidebarLayerRowItem } from './SidebarLayerRowItem';
import {
    flattenLayerRows,
    getSelectedAncestorIds,
    getSelectedGroupIds
} from './SidebarLayerRows';

const renderLayerRow = ({
    onSelectNode,
    onToggleLayer,
    row
}: {
    row: LayerRow;
    onSelectNode?: (nodeId: string) => void;
    onToggleLayer?: (nodeId: string) => void;
}) => (
    <SidebarLayerRowItem
        key={row.id}
        {...row}
        onSelectNode={onSelectNode}
        onToggleLayer={onToggleLayer}
    />
);

const renderLayerRows = ({
    layerRows,
    onSelectNode,
    onToggleLayer
}: {
    layerRows: LayerRow[];
    onSelectNode?: (nodeId: string) => void;
    onToggleLayer?: (nodeId: string) => void;
}) => {
    const elements: ReactElement[] = [];
    let rowIndex = 0;

    while (rowIndex < layerRows.length) {
        const row = layerRows[rowIndex];

        if (row.selected && row.hasChildren && row.expanded) {
            const highlightedRows = [row];

            rowIndex += 1;

            while (layerRows[rowIndex]?.depth > row.depth) {
                highlightedRows.push(layerRows[rowIndex]);
                rowIndex += 1;
            }

            elements.push(
                <div
                    className="editor-layer-group-highlight grid gap-0.5 rounded-lg bg-[#eef2f7] py-0.5"
                    data-layer-group-highlight-block="true"
                    key={`group-highlight-${row.id}`}
                >
                    {highlightedRows.map((highlightedRow) =>
                        renderLayerRow({
                            row: highlightedRow,
                            onSelectNode,
                            onToggleLayer
                        })
                    )}
                </div>
            );
            continue;
        }

        if (!row.groupHighlighted) {
            elements.push(renderLayerRow({ row, onSelectNode, onToggleLayer }));
            rowIndex += 1;
            continue;
        }

        const highlightedRows: LayerRow[] = [];

        while (layerRows[rowIndex]?.groupHighlighted) {
            highlightedRows.push(layerRows[rowIndex]);
            rowIndex += 1;
        }

        elements.push(
            <div
                className="editor-layer-group-highlight grid gap-0.5 rounded-lg bg-[#eef2f7] py-0.5"
                data-layer-group-highlight-block="true"
                key={`group-highlight-${highlightedRows[0].id}`}
            >
                {highlightedRows.map((highlightedRow) =>
                    renderLayerRow({
                        row: highlightedRow,
                        onSelectNode,
                        onToggleLayer
                    })
                )}
            </div>
        );
    }

    return elements;
};

const getVisibleExpandedLayerIds = ({
    expandedLayerIds,
    nodes,
    selectedNodeId
}: {
    nodes: EditorNode[];
    expandedLayerIds: Set<string>;
    selectedNodeId?: string | null;
}) => {
    const selectedAncestorIds = getSelectedAncestorIds(nodes, selectedNodeId);
    const selectedGroupIds = getSelectedGroupIds(nodes, selectedNodeId);

    return new Set([
        ...expandedLayerIds,
        ...selectedAncestorIds,
        ...selectedGroupIds
    ]);
};

type SidebarLayersPanelProps = {
    document: EditorDocument;
    selectedNodeId?: string | null;
    onSelectNode?: (nodeId: string) => void;
};

export const SidebarLayersPanel = ({
    document,
    selectedNodeId,
    onSelectNode
}: SidebarLayersPanelProps) => {
    const [expandedLayerIds, setExpandedLayerIds] = useState<Set<string>>(
        () => new Set()
    );
    const layerRows = useMemo(() => {
        const visibleExpandedLayerIds = getVisibleExpandedLayerIds({
            nodes: document.children,
            expandedLayerIds,
            selectedNodeId
        });

        return flattenLayerRows({
            nodes: document.children,
            expandedLayerIds: visibleExpandedLayerIds,
            selectedNodeId
        });
    }, [document.children, expandedLayerIds, selectedNodeId]);
    const toggleLayer = (nodeId: string) => {
        setExpandedLayerIds((currentIds) => {
            const nextIds = new Set(currentIds);

            if (nextIds.has(nodeId)) {
                nextIds.delete(nodeId);
            } else {
                nextIds.add(nodeId);
            }

            return nextIds;
        });
    };

    return (
        <div className="editor-sidebar-body min-h-0 overflow-y-auto overflow-x-hidden px-2 pt-2.5 pb-6">
            <div className="editor-layer-tree grid min-h-0 content-start gap-0.5">
                {renderLayerRows({
                    layerRows,
                    onSelectNode,
                    onToggleLayer: toggleLayer
                })}
            </div>
        </div>
    );
};
