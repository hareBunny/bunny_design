/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignEndHorizontal,
    AlignEndVertical,
    AlignStartHorizontal,
    AlignStartVertical,
    ChevronDown,
    FileText,
    Frame,
    Hand,
    Minus,
    MousePointer2,
    PanelLeft,
    PanelRight,
    Plus,
    SlidersHorizontal,
    Square,
    Type
} from 'lucide-react';

import type {
    AgentTimelineItem,
    DesignMetrics,
    EditorIconButtonConfig,
    LayerRow,
    SidebarTabConfig
} from '../types/editor';

export const EDITOR_DESIGN_METRICS: DesignMetrics = {
    frameId: 'tzVyN',
    sidebarWidth: 300,
    contentWidth: 1620,
    canvasWidth: 1352,
    inspectorWidth: 268
};

export const CONTENT_LAYER_ROWS: LayerRow[] = [
    { id: 'content', label: 'Content', icon: Frame, depth: 0, expanded: true },
    { id: 'right-divider', label: 'Right Divider', icon: Minus, depth: 1 },
    {
        id: 'right-inspector',
        label: 'Right Inspector',
        icon: SlidersHorizontal,
        depth: 1
    },
    {
        id: 'chrome-bottom-divider',
        label: 'Chrome Bottom Divider',
        icon: Minus,
        depth: 1
    },
    { id: 'canvas-stage', label: 'Canvas Stage', icon: Square, depth: 1 },
    { id: 'window-chrome', label: 'Window Chrome', icon: Frame, depth: 1 },
    {
        id: 'main-right-region',
        label: 'Main Right Region',
        icon: PanelRight,
        depth: 1
    },
    {
        id: 'main-title-region',
        label: 'Main Title Region',
        icon: Type,
        depth: 1
    },
    { id: 'document-title', label: 'Document Title', icon: FileText, depth: 1 }
];

export const RECREATION_LAYER_ROWS: LayerRow[] = [
    {
        id: 'miaoma-editor-recreation',
        label: 'Miaoma Editor Recreation',
        icon: Frame,
        depth: 0,
        expanded: true
    },
    { id: 'left-sidebar', label: 'Left Sidebar', icon: PanelLeft, depth: 1 },
    {
        id: 'sidebar-surface',
        label: 'Sidebar Surface',
        icon: Square,
        depth: 1,
        selected: true,
        visible: true
    },
    {
        id: 'sidebar-tabs-section',
        label: 'Sidebar Tabs Section',
        icon: Frame,
        depth: 1
    },
    { id: 'sidebar-body', label: 'Sidebar Body', icon: Frame, depth: 1 }
];

export const SIDEBAR_ACTIONS: EditorIconButtonConfig[] = [
    { icon: PanelLeft, label: 'Toggle sidebar' },
    { icon: Plus, label: 'Create item' }
];

export const SIDEBAR_TABS: SidebarTabConfig[] = [
    { id: 'agent', label: 'Agent' },
    { id: 'layers', label: 'Layers' }
];

export const AGENT_TIMELINE_ITEMS: AgentTimelineItem[] = [
    { id: 'crm-title', type: 'pill', text: '妙码学院 crm 系统', height: 28 },
    { id: 'bash-primary', type: 'status', label: 'Bash' },
    { id: 'bash-secondary', type: 'status', label: 'Bash' },
    {
        id: 'mendel-summary',
        type: 'summary',
        agent: 'Mendel',
        height: 157,
        text: '正在检查 /Users/heyi/Downloads/miaoma-crm.pen，并整理当前执行摘要：\n• 已定位 Agent Smart Screen 的中间说明区域\n• 正在核对节点层级、尺寸和文本密度\n• 仅补充这段运行状态说明，不新增图形元素\n• 保持偏左对齐、舒展行距和黑灰色正文'
    },
    { id: 'checked-guidelines', type: 'status', label: 'Checked guidelines' },
    { id: 'read-variables', type: 'status', label: 'Read variables' },
    { id: 'read-objects', type: 'status', label: 'Read objects' },
    { id: 'set-variables', type: 'status', label: 'Set variables' },
    { id: 'designed-primary', type: 'status', label: 'Designed' },
    { id: 'activation-title', type: 'pill', text: '项激活后，请优化修改' },
    {
        id: 'newton-summary',
        type: 'summary',
        agent: 'Newton',
        height: 146,
        text: '已把右侧 Design Goodies 属性栏按图重做，包含顶部动作区、选中对象块、Context、Alignment、Position、Layout、Appearance、Fill、Stroke、Effects、Export 各分组的结构和细节。'
    },
    { id: 'designed-secondary', type: 'status', label: 'Designed' }
];

export const TOOL_BUTTONS: EditorIconButtonConfig[] = [
    { icon: MousePointer2, label: 'Pointer tool', active: true },
    { icon: Square, label: 'Rectangle tool' },
    { icon: ChevronDown, label: 'More shape tools', compact: true },
    { icon: Type, label: 'Text tool' },
    { icon: Frame, label: 'Frame tool' },
    { icon: Hand, label: 'Hand tool' }
];

export const ALIGNMENT_BUTTONS: EditorIconButtonConfig[] = [
    { icon: AlignStartHorizontal, label: 'Align left' },
    { icon: AlignCenterHorizontal, label: 'Align center' },
    { icon: AlignEndHorizontal, label: 'Align right' },
    { icon: AlignStartVertical, label: 'Align top' },
    { icon: AlignCenterVertical, label: 'Align middle' },
    { icon: AlignEndVertical, label: 'Align bottom' }
];
