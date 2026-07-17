/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties, HTMLAttributes } from 'react';

import type {
    MiaomaEllipseNode as EllipseNode,
    MiaomaFrameNode as FrameNode,
    MiaomaIconNode as IconNode,
    MiaomaRectangleNode as RectangleNode,
    MiaomaTextNode as TextNode
} from '@miaoma-design-ai/miaoma-design-schema';

import { LUCIDE_ICONS } from './CanvasNodeIcons';
import type {
    NodeRenderer,
    NodeRendererProps,
    NodeRendererRegistry,
    ParentLayout
} from './CanvasNodeRendererTypes';
import {
    getColorFillValue,
    getFlowLayout,
    getNodeBoxStyle,
    getVisualStyle,
    px,
    toAlignItems,
    toFontFamily,
    toJustifyContent,
    toPaddingValue
} from './CanvasNodeStyle';

export type {
    AssetResolver,
    Bounds,
    NodeRenderer,
    NodeRendererProps,
    NodeRendererRegistry,
    ParentLayout
} from './CanvasNodeRendererTypes';
export { getTopLevelBounds } from './CanvasNodeStyle';

const TextContent = ({ content }: { content: string }) => {
    const lines = content.split('\n');

    return (
        <>
            {lines.map((line, index) => (
                <span key={`${line}-${index}`}>
                    {index > 0 ? <br /> : null}
                    {line}
                </span>
            ))}
        </>
    );
};

type NodeInteractionProps = HTMLAttributes<HTMLDivElement> & {
    'data-design-node-selected'?: 'true';
};

const getNodeInteractionProps = (
    nodeId: string,
    selectedNodeId: string | null | undefined
): NodeInteractionProps => ({
    'data-design-node-selected': selectedNodeId === nodeId ? 'true' : undefined
});

const CanvasTextNode = ({
    editingTextNodeId,
    node,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds,
    variables
}: NodeRendererProps<TextNode>) => {
    const style: CSSProperties = {
        ...getNodeBoxStyle({
            node,
            width: node.width,
            height: node.height,
            parentLayout,
            topLevelBounds
        }),
        ...getVisualStyle(node, resolveAsset, 'text', variables),
        fontFamily: toFontFamily(node.fontFamily, variables),
        fontSize: node.fontSize === undefined ? undefined : px(node.fontSize),
        fontWeight: node.fontWeight,
        textAlign: node.textAlign,
        visibility: editingTextNodeId === node.id ? 'hidden' : undefined,
        zIndex: 0
    };

    return (
        <div
            className="editor-document-node editor-document-text"
            data-design-node-id={node.id}
            data-design-node-name={node.name}
            {...getNodeInteractionProps(node.id, selectedNodeId)}
            style={style}
        >
            <TextContent content={node.content} />
        </div>
    );
};

const CanvasRectangleNode = ({
    node,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds,
    variables
}: NodeRendererProps<RectangleNode>) => (
    <div
        className="editor-document-node editor-document-rectangle"
        data-design-node-id={node.id}
        data-design-node-name={node.name}
        {...getNodeInteractionProps(node.id, selectedNodeId)}
        style={{
            ...getNodeBoxStyle({
                node,
                width: node.width,
                height: node.height,
                parentLayout,
                topLevelBounds
            }),
            ...getVisualStyle(node, resolveAsset, 'shape', variables)
        }}
    />
);

const CanvasEllipseNode = ({
    node,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds,
    variables
}: NodeRendererProps<EllipseNode>) => (
    <div
        className="editor-document-node editor-document-ellipse"
        data-design-node-id={node.id}
        data-design-node-name={node.name}
        {...getNodeInteractionProps(node.id, selectedNodeId)}
        style={{
            ...getNodeBoxStyle({
                node,
                width: node.width,
                height: node.height,
                parentLayout,
                topLevelBounds
            }),
            ...getVisualStyle(node, resolveAsset, 'shape', variables),
            borderRadius: '50%'
        }}
    />
);

const CanvasIconNode = ({
    node,
    parentLayout,
    selectedNodeId,
    topLevelBounds,
    variables
}: NodeRendererProps<IconNode>) => {
    const Icon =
        node.library === 'lucide' ? LUCIDE_ICONS[node.icon] : undefined;
    const color = getColorFillValue(node.fill, variables) ?? 'currentColor';
    const style: CSSProperties = {
        ...getNodeBoxStyle({
            node,
            width: node.width,
            height: node.height,
            parentLayout,
            topLevelBounds
        }),
        color,
        display: 'grid',
        lineHeight: 0,
        placeItems: 'center'
    };

    return (
        <div
            className="editor-document-node editor-document-icon"
            data-design-icon-name={node.icon}
            data-design-node-id={node.id}
            data-design-node-name={node.name}
            {...getNodeInteractionProps(node.id, selectedNodeId)}
            style={style}
        >
            {Icon ? (
                <Icon
                    aria-hidden="true"
                    color={color}
                    size="100%"
                    strokeWidth={2}
                    style={{ display: 'block' }}
                />
            ) : null}
        </div>
    );
};

const CanvasFrameNode = ({
    node,
    nodeRenderers,
    editingTextNodeId,
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds,
    variables
}: NodeRendererProps<FrameNode>) => {
    const flowLayout = getFlowLayout(node.layout);
    const childParentLayout: ParentLayout = flowLayout ?? 'absolute';
    const children = node.children ?? [];
    const style: CSSProperties = {
        ...getNodeBoxStyle({
            node,
            width: node.width,
            height: node.height,
            parentLayout,
            topLevelBounds
        }),
        ...getVisualStyle(node, resolveAsset, 'shape', variables),
        alignItems: flowLayout ? toAlignItems(node.alignItems) : undefined,
        display: flowLayout ? 'flex' : undefined,
        flexDirection:
            flowLayout === undefined
                ? undefined
                : flowLayout === 'vertical'
                  ? 'column'
                  : 'row',
        gap: flowLayout && node.gap !== undefined ? px(node.gap) : undefined,
        justifyContent: flowLayout
            ? toJustifyContent(node.justifyContent)
            : undefined,
        overflow: node.clip ? 'hidden' : undefined,
        padding: flowLayout ? toPaddingValue(node.padding) : undefined
    };

    return (
        <div
            className="editor-document-node editor-document-frame"
            data-design-node-id={node.id}
            data-design-node-name={node.name}
            {...getNodeInteractionProps(node.id, selectedNodeId)}
            style={style}
        >
            {children.map((child) => (
                <CanvasRenderNode
                    key={child.id}
                    editingTextNodeId={editingTextNodeId}
                    node={child}
                    nodeRenderers={nodeRenderers}
                    onNodePointerDown={onNodePointerDown}
                    parentLayout={childParentLayout}
                    resolveAsset={resolveAsset}
                    selectedNodeId={selectedNodeId}
                    variables={variables}
                />
            ))}
        </div>
    );
};

export const defaultNodeRenderers: NodeRendererRegistry = {
    ellipse: CanvasEllipseNode as NodeRenderer,
    frame: CanvasFrameNode as NodeRenderer,
    icon: CanvasIconNode as NodeRenderer,
    rectangle: CanvasRectangleNode as NodeRenderer,
    text: CanvasTextNode as NodeRenderer
};

export const CanvasRenderNode = ({
    node,
    nodeRenderers,
    editingTextNodeId,
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds,
    variables
}: NodeRendererProps) => {
    const Renderer = nodeRenderers[node.type];

    return (
        <Renderer
            node={node}
            nodeRenderers={nodeRenderers}
            editingTextNodeId={editingTextNodeId}
            onNodePointerDown={onNodePointerDown}
            parentLayout={parentLayout}
            resolveAsset={resolveAsset}
            selectedNodeId={selectedNodeId}
            topLevelBounds={topLevelBounds}
            variables={variables}
        />
    );
};
