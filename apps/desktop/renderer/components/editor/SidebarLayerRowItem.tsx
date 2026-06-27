/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { ChevronDown, ChevronRight, Eye } from 'lucide-react';
import type { HTMLAttributes } from 'react';

import type { LayerRow } from '../../types/editor';
import { classNames } from '../../utils/classNames';

type LayerRowItemProps = LayerRow & {
    onSelectNode?: (nodeId: string) => void;
    onToggleLayer?: (nodeId: string) => void;
};

type NodeInteractionProps = HTMLAttributes<HTMLDivElement> & {
    'data-selected'?: 'true';
};

export const SidebarLayerRowItem = ({
    hasChildren,
    id,
    label,
    icon: Icon,
    nodeType,
    depth,
    expanded,
    groupHighlighted,
    selected,
    visible,
    onSelectNode,
    onToggleLayer
}: LayerRowItemProps) => {
    const interactionProps: NodeInteractionProps = {
        'data-selected': selected ? 'true' : undefined
    };

    return (
        <div
            className={classNames(
                'editor-layer-row grid w-full grid-cols-[3px_minmax(0,1fr)_auto] items-center rounded-lg text-[12px] leading-none font-medium text-[#1f2937]',
                depth === 0 ? 'h-[30px] font-semibold' : 'h-7',
                selected
                    ? 'editor-layer-row--selected bg-[#d9dadd] text-[#111827]'
                    : 'bg-transparent'
            )}
            data-depth={depth}
            data-group-highlight={groupHighlighted ? 'true' : undefined}
            data-layer-node-type={nodeType}
            {...interactionProps}
        >
            <span className="editor-layer-rail h-full w-[3px]" />
            <span
                className={classNames(
                    'editor-layer-content flex h-full min-w-0 items-center gap-1.5 px-3 pl-2.5 text-[#64748b]',
                    depth > 0 && 'pl-7',
                    selected && 'text-[#374151]'
                )}
                style={
                    depth > 1
                        ? {
                              paddingLeft: `${28 + (depth - 1) * 19}px`
                          }
                        : undefined
                }
            >
                {hasChildren ? (
                    <button
                        aria-expanded={expanded ? 'true' : 'false'}
                        aria-label={`Toggle layer ${label}`}
                        className="editor-layer-toggle flex h-3.5 w-3.5 shrink-0 cursor-default items-center justify-center border-0 bg-transparent p-0 text-inherit"
                        onClick={() => onToggleLayer?.(id)}
                        type="button"
                    >
                        {expanded ? (
                            <ChevronDown
                                aria-hidden="true"
                                className="shrink-0"
                                size={14}
                                strokeWidth={1.8}
                            />
                        ) : (
                            <ChevronRight
                                aria-hidden="true"
                                className="shrink-0"
                                size={14}
                                strokeWidth={1.8}
                            />
                        )}
                    </button>
                ) : (
                    <span className="editor-layer-chevron-spacer h-3.5 w-3.5 shrink-0" />
                )}
                <button
                    aria-label={`Select layer ${label}`}
                    className="editor-layer-select flex h-full min-w-0 flex-1 cursor-default items-center gap-1.5 border-0 bg-transparent p-0 text-left text-inherit"
                    onClick={() => onSelectNode?.(id)}
                    type="button"
                >
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
                </button>
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
};
