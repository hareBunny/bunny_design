/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { LucideIcon } from 'lucide-react';

export type LayerDepth = 0 | 1 | 2;
export type SidebarTab = 'agent' | 'layers';

export type EditorIconButtonConfig = {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    compact?: boolean;
};

export type InspectorValueInputProps = {
    value: string;
    ariaLabel: string;
    label?: string;
    startIcon?: LucideIcon;
    swatch?: string;
    unit?: string;
    size?: 'default' | 'compact';
    className?: string;
    inputClassName?: string;
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

export type SidebarTabConfig = {
    id: SidebarTab;
    label: string;
};

export type AgentTimelineItem =
    | {
          id: string;
          type: 'pill';
          text: string;
          height?: 24 | 28;
      }
    | {
          id: string;
          type: 'status';
          label: string;
      }
    | {
          id: string;
          type: 'summary';
          agent: string;
          text: string;
          height: 146 | 157;
      };

export type DesignMetrics = {
    frameId: string;
    sidebarWidth: number;
    contentWidth: number;
    canvasWidth: number;
    inspectorWidth: number;
};
