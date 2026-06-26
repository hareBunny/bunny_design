/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignNode } from '../schema/node';

import type { MiaomaInspectorGroupId } from './groups';

export type MiaomaInspectorValueKind =
    | 'number'
    | 'string'
    | 'boolean'
    | 'enum'
    | 'color'
    | 'fill'
    | 'stroke'
    | 'effect'
    | 'dimension'
    | 'spacing';

export type MiaomaInspectorPropertyDefinition = {
    id: string;
    group: MiaomaInspectorGroupId;
    path: string;
    label: string;
    valueKind: MiaomaInspectorValueKind;
    nodeTypes: readonly MiaomaDesignNode['type'][];
    optional?: boolean;
    readonly?: boolean;
    unit?: 'px' | '%' | 'deg';
    enumValues?: readonly string[];
};
