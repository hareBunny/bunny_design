/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type MiaomaInspectorGroupId =
    | 'context'
    | 'layout'
    | 'position'
    | 'appearance'
    | 'fill'
    | 'stroke'
    | 'effects'
    | 'text'
    | 'export';

export type MiaomaInspectorGroupDefinition = {
    id: MiaomaInspectorGroupId;
    label: string;
    order: number;
};

export const INSPECTOR_GROUPS: MiaomaInspectorGroupDefinition[] = [
    { id: 'context', label: 'Context', order: 0 },
    { id: 'layout', label: 'Layout', order: 1 },
    { id: 'position', label: 'Position', order: 2 },
    { id: 'appearance', label: 'Appearance', order: 3 },
    { id: 'fill', label: 'Fill', order: 4 },
    { id: 'stroke', label: 'Stroke', order: 5 },
    { id: 'effects', label: 'Effects', order: 6 },
    { id: 'text', label: 'Text', order: 7 },
    { id: 'export', label: 'Export', order: 8 }
];
