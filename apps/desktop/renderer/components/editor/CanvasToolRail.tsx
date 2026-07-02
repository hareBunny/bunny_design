/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    ChevronDown,
    Circle,
    Frame,
    Hand,
    type LucideIcon,
    MousePointer2,
    Sparkles,
    Square,
    Triangle,
    Type
} from 'lucide-react';
import { useState } from 'react';

import type { CanvasToolId as InteractionCanvasToolId } from '@miaoma-design-ai/miaoma-editor-interaction';

import { classNames } from '../../utils/classNames';

type ShapeMenuToolId =
    | Extract<InteractionCanvasToolId, 'ellipse' | 'rectangle'>
    | 'icon'
    | 'polygon';

type ToolButtonConfig = {
    id: InteractionCanvasToolId | 'shape-menu';
    icon: LucideIcon;
    label: string;
    height: 28 | 30;
    iconSize: number;
    kind?: 'compact' | 'regular';
};

const TOOL_BUTTONS: ToolButtonConfig[] = [
    {
        id: 'pointer',
        icon: MousePointer2,
        label: 'Pointer tool',
        height: 30,
        iconSize: 14
    },
    {
        id: 'rectangle',
        icon: Square,
        label: 'Rectangle tool',
        height: 30,
        iconSize: 14
    },
    {
        id: 'shape-menu',
        icon: ChevronDown,
        label: 'More shape tools',
        height: 30,
        iconSize: 12,
        kind: 'compact'
    },
    {
        id: 'text',
        icon: Type,
        label: 'Text tool',
        height: 28,
        iconSize: 16
    },
    {
        id: 'frame',
        icon: Frame,
        label: 'Frame tool',
        height: 28,
        iconSize: 16
    },
    {
        id: 'hand',
        icon: Hand,
        label: 'Hand tool',
        height: 28,
        iconSize: 16
    }
];

const SHAPE_MENU_ITEMS: {
    id: ShapeMenuToolId;
    icon: LucideIcon;
    label: string;
}[] = [
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'polygon', icon: Triangle, label: 'Polygon' },
    { id: 'icon', icon: Sparkles, label: 'Icon' }
];

const SHAPES_MENU_ID = 'canvas-shapes-expand-menu';

type CanvasToolRailProps = {
    activeTool: InteractionCanvasToolId;
    onSelectTool: (tool: InteractionCanvasToolId) => void;
};

const isSupportedShapeMenuTool = (
    toolId: ShapeMenuToolId
): toolId is Extract<InteractionCanvasToolId, 'ellipse' | 'rectangle'> =>
    toolId === 'ellipse' || toolId === 'rectangle';

const isDisabledShapeMenuTool = (toolId: ShapeMenuToolId) =>
    !isSupportedShapeMenuTool(toolId);

export const CanvasToolRail = ({
    activeTool,
    onSelectTool
}: CanvasToolRailProps) => {
    const [isShapesMenuOpen, setIsShapesMenuOpen] = useState(false);

    const selectTool = (toolId: InteractionCanvasToolId) => {
        onSelectTool(toolId);
        setIsShapesMenuOpen(false);
    };

    return (
        <div
            className="editor-tool-region absolute top-[calc(var(--editor-ruler-thickness)+10px)] left-[calc(var(--editor-ruler-thickness)+10px)] z-20"
            data-active-tool={activeTool}
            data-region="canvas-tool-rail"
        >
            <nav
                aria-label="Canvas tools"
                className="editor-tool-rail grid w-11 gap-1 rounded-[14px] border border-[#e5e7eb] bg-white px-[7px] py-2 shadow-[0_4px_16px_#11182712]"
            >
                {TOOL_BUTTONS.map((tool) => {
                    const Icon = tool.icon;
                    if (tool.id === 'shape-menu') {
                        return (
                            <div
                                className="flex h-4 w-[30px] items-center justify-center"
                                key={tool.id}
                            >
                                <button
                                    aria-controls={
                                        isShapesMenuOpen
                                            ? SHAPES_MENU_ID
                                            : undefined
                                    }
                                    aria-expanded={
                                        isShapesMenuOpen ? 'true' : 'false'
                                    }
                                    aria-haspopup="menu"
                                    aria-label={tool.label}
                                    className={classNames(
                                        'editor-tool-button editor-tool-button--expand inline-flex h-4 w-[30px] cursor-default items-center justify-center rounded-md border p-0 text-[#5b6370]',
                                        isShapesMenuOpen
                                            ? 'border-[#f0f2f5] bg-[#f7f8fa]'
                                            : 'border-transparent bg-transparent'
                                    )}
                                    onClick={() =>
                                        setIsShapesMenuOpen((open) => !open)
                                    }
                                    type="button"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        size={tool.iconSize}
                                        strokeWidth={1.9}
                                    />
                                </button>
                            </div>
                        );
                    }

                    const toolId = tool.id as InteractionCanvasToolId;
                    const selected = activeTool === toolId;

                    return (
                        <div
                            className="flex h-[30px] w-[30px] items-center justify-center"
                            key={tool.id}
                        >
                            <button
                                aria-label={tool.label}
                                aria-pressed={selected ? 'true' : 'false'}
                                className={classNames(
                                    'editor-tool-button inline-flex w-[30px] cursor-default items-center justify-center rounded-[8px] border p-0',
                                    tool.height === 30 ? 'h-[30px]' : 'h-7',
                                    selected
                                        ? 'editor-tool-button--active h-[30px] border-[#e5e7eb] bg-[#f7f8fa] text-[#1a1a1a] shadow-[0_1px_4px_#1118270d]'
                                        : 'border-transparent bg-white text-[#242424]'
                                )}
                                data-tool-id={toolId}
                                onClick={() => selectTool(toolId)}
                                type="button"
                            >
                                <Icon
                                    aria-hidden="true"
                                    size={tool.iconSize}
                                    strokeWidth={1.9}
                                />
                            </button>
                        </div>
                    );
                })}
            </nav>
            {isShapesMenuOpen ? (
                <div
                    aria-label="Shapes expand menu"
                    className="editor-shapes-expand-menu absolute top-[76px] left-[49px] grid w-[180px] gap-0.5 rounded-[18px] border border-[#e7e9ee] bg-white p-[6px] shadow-[0_8px_28px_#00000012]"
                    id={SHAPES_MENU_ID}
                    role="menu"
                >
                    {SHAPE_MENU_ITEMS.map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                aria-disabled={
                                    isDisabledShapeMenuTool(item.id)
                                        ? 'true'
                                        : undefined
                                }
                                className={classNames(
                                    'editor-shapes-expand-menu-item group flex h-[26px] w-full cursor-default items-center gap-3 rounded-md border-0 bg-transparent px-1.5 py-1 text-left text-[14px] leading-none font-normal text-[#26272b] focus-visible:outline-none',
                                    isDisabledShapeMenuTool(item.id)
                                        ? 'opacity-45'
                                        : 'hover:bg-[#f7f8fa] focus-visible:bg-[#f7f8fa]'
                                )}
                                key={item.id}
                                onClick={() => {
                                    if (isSupportedShapeMenuTool(item.id)) {
                                        selectTool(item.id);
                                        return;
                                    }

                                    setIsShapesMenuOpen(false);
                                }}
                                role="menuitem"
                                type="button"
                            >
                                <Icon
                                    aria-hidden="true"
                                    className={classNames(
                                        'text-[#7a808d]',
                                        !isDisabledShapeMenuTool(item.id) &&
                                            'group-hover:text-[#5b6370]'
                                    )}
                                    size={18}
                                    strokeWidth={1.7}
                                />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
};
