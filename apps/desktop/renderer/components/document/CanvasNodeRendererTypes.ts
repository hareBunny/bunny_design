/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { ReactElement } from 'react';

import type {
    MiaomaDesignNode as DesignNode,
    MiaomaDesignVariables as DesignVariables,
    MiaomaLayoutDirection as LayoutDirection
} from '@miaoma-design-ai/miaoma-design-schema';

export type AssetResolver = (url: string) => string;

export type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type ParentLayout = 'absolute' | Exclude<LayoutDirection, 'none'>;

export type NodeRendererProps<TNode extends DesignNode = DesignNode> = {
    node: TNode;
    nodeRenderers: NodeRendererRegistry;
    editingTextNodeId?: string | null;
    onNodePointerDown?: (nodeId: string) => void;
    parentLayout: ParentLayout;
    resolveAsset: AssetResolver;
    selectedNodeId?: string | null;
    topLevelBounds?: Bounds;
    variables?: DesignVariables;
};

export type NodeRenderer = (props: NodeRendererProps) => ReactElement;

export type NodeRendererRegistry = Record<DesignNode['type'], NodeRenderer>;
