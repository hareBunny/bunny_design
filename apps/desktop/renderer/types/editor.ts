/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { LucideIcon } from 'lucide-react';

export type LayerDepth = 0 | 1 | 2;

export type EditorIconButtonConfig = {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    compact?: boolean;
};

export type LayerRow = {
    id: string;
    label: string;
    icon: LucideIcon;
    depth: LayerDepth;
    expanded?: boolean;
    selected?: boolean;
    visible?: boolean;
};

export type InspectorControl = {
    label?: string;
    value: string;
    icon?: LucideIcon;
    swatch?: string;
    checked?: boolean;
    wide?: boolean;
};

export type DesignMetrics = {
    frameId: string;
    sidebarWidth: number;
    contentWidth: number;
    canvasWidth: number;
    inspectorWidth: number;
};
