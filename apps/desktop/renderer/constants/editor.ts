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
    DesignMetrics,
    EditorIconButtonConfig,
    LayerRow
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
