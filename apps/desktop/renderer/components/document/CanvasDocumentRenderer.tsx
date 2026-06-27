/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { LucideIcon } from 'lucide-react';
import {
    AlignCenterHorizontal,
    AlignCenterVertical,
    AlignEndHorizontal,
    AlignEndVertical,
    AlignStartHorizontal,
    AlignStartVertical,
    ArrowDownFromLine,
    ArrowRightFromLine,
    Bot,
    Check,
    ChevronDown,
    CircleUser,
    DiamondPlus,
    Download,
    Eye,
    FileText,
    Frame as FrameIcon,
    Hand,
    LayoutDashboard,
    LayoutGrid,
    Minus,
    MousePointer2,
    PanelLeft,
    PanelRight,
    Play,
    Plus,
    SlidersHorizontal,
    Square,
    Type as TypeIcon
} from 'lucide-react';
import type { CSSProperties, HTMLAttributes, ReactElement } from 'react';

import type {
    MiaomaAlignItems as AlignItems,
    MiaomaDesignDocument as DesignDocument,
    MiaomaDesignNode as DesignNode,
    MiaomaDimension as Dimension,
    MiaomaEllipseNode as EllipseNode,
    MiaomaFill as Fill,
    MiaomaFrameNode as FrameNode,
    MiaomaIconNode as IconNode,
    MiaomaJustifyContent as JustifyContent,
    MiaomaLayoutDirection as LayoutDirection,
    MiaomaRectangleNode as RectangleNode,
    MiaomaSpacing as Spacing,
    MiaomaTextNode as TextNode
} from '@miaoma-design-ai/miaoma-design-schema';

type AssetResolver = (url: string) => string;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type ParentLayout = 'absolute' | Exclude<LayoutDirection, 'none'>;

type NodeRendererProps<TNode extends DesignNode = DesignNode> = {
    node: TNode;
    nodeRenderers: NodeRendererRegistry;
    onNodePointerDown?: (nodeId: string) => void;
    parentLayout: ParentLayout;
    resolveAsset: AssetResolver;
    selectedNodeId?: string | null;
    topLevelBounds?: Bounds;
};

type NodeRenderer = (props: NodeRendererProps) => ReactElement;

type NodeRendererRegistry = Record<DesignNode['type'], NodeRenderer>;

type CanvasDocumentRendererProps = {
    document: DesignDocument;
    resolveAsset?: AssetResolver;
    className?: string;
    nodeRenderers?: Partial<NodeRendererRegistry>;
    selectedNodeId?: string | null;
    onNodePointerDown?: (nodeId: string) => void;
    onCanvasPointerDown?: () => void;
};

const defaultAssetResolver: AssetResolver = (url) => url;

const px = (value: number) => `${value}px`;

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const toCssGradientAngle = (rotation = 0) => `${normalizeAngle(-rotation)}deg`;

const toCssNodeRotation = (rotation: number) => `rotate(${-rotation}deg)`;

const toCssOpacityValue = (opacity: number | undefined) => {
    if (opacity === undefined) {
        return undefined;
    }

    const normalizedValue = opacity > 1 ? opacity / 100 : opacity;

    return Math.max(0, Math.min(1, normalizedValue));
};

const toBackgroundSize = (mode: 'fill' | 'fit' | 'stretch') => {
    if (mode === 'fit') {
        return 'contain';
    }

    if (mode === 'stretch') {
        return '100% 100%';
    }

    return 'cover';
};

const escapeAssetUrl = (url: string) => url.replaceAll('"', '\\"');

const quoteFontFamily = (fontFamily: string) =>
    `'${fontFamily.replaceAll("'", "\\'")}'`;

const toFontFamily = (fontFamily?: string) => {
    if (!fontFamily) {
        return undefined;
    }

    if (fontFamily === 'Alimama ShuHeiTi' || fontFamily === 'Heiti SC') {
        return `${quoteFontFamily(fontFamily)}, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`;
    }

    return `${quoteFontFamily(fontFamily)}, system-ui, sans-serif`;
};

const toGradientValue = (fill: Extract<Fill, { type: 'gradient' }>) =>
    `linear-gradient(${toCssGradientAngle(fill.rotation)}, ${fill.colors
        .map((stop) => `${stop.color} ${stop.position * 100}%`)
        .join(', ')})`;

const getColorFillValue = (fill: Fill | undefined) =>
    fill?.type === 'color' ? fill.color : undefined;

const getFillStyle = (
    fill: Fill | undefined,
    resolveAsset: AssetResolver,
    target: 'shape' | 'text'
): CSSProperties => {
    if (!fill) {
        return {};
    }

    if (fill.type === 'color') {
        return target === 'text'
            ? { color: fill.color }
            : { backgroundColor: fill.color };
    }

    if (fill.type === 'gradient') {
        const gradientStyle: CSSProperties = {
            backgroundImage: toGradientValue(fill),
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%'
        };

        if (target === 'text') {
            return {
                ...gradientStyle,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent'
            };
        }

        return gradientStyle;
    }

    return {
        backgroundImage: `url("${escapeAssetUrl(resolveAsset(fill.url))}")`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: toBackgroundSize(fill.mode)
    };
};

const getStrokeStyle = (
    stroke: Fill | undefined,
    strokeWidth: number | undefined
): CSSProperties => {
    if (!stroke || strokeWidth === undefined) {
        return {};
    }

    if (stroke.type === 'color') {
        return {
            borderColor: stroke.color,
            borderStyle: 'solid',
            borderWidth: px(strokeWidth)
        };
    }

    if (stroke.type === 'gradient') {
        return {
            borderImage: `${toGradientValue(stroke)} 1`,
            borderStyle: 'solid',
            borderWidth: px(strokeWidth)
        };
    }

    return {};
};

const toCornerRadiusValue = (
    cornerRadius: FrameNode['cornerRadius']
): string | undefined => {
    if (cornerRadius === undefined) {
        return undefined;
    }

    if (typeof cornerRadius === 'number') {
        return px(cornerRadius);
    }

    return cornerRadius.map(px).join(' ');
};

const toPaddingValue = (padding: Spacing | undefined): string | undefined => {
    if (padding === undefined) {
        return undefined;
    }

    if (typeof padding === 'number') {
        return px(padding);
    }

    return padding.map(px).join(' ');
};

const toJustifyContent = (
    justifyContent: JustifyContent | undefined
): CSSProperties['justifyContent'] => {
    if (justifyContent === 'end') {
        return 'flex-end';
    }

    if (justifyContent === 'space_between') {
        return 'space-between';
    }

    if (justifyContent === 'space_around') {
        return 'space-around';
    }

    if (justifyContent === 'start') {
        return 'flex-start';
    }

    return justifyContent;
};

const toAlignItems = (
    alignItems: AlignItems | undefined
): CSSProperties['alignItems'] => {
    if (alignItems === 'end') {
        return 'flex-end';
    }

    if (alignItems === 'start') {
        return 'flex-start';
    }

    return alignItems;
};

const getEffectStyle = (node: DesignNode): CSSProperties => {
    if (node.effect?.type !== 'shadow') {
        return {};
    }

    const offsetX = node.effect.offset?.x ?? 0;
    const offsetY = node.effect.offset?.y ?? 0;
    const blur = node.effect.blur ?? 0;
    const inset = node.effect.shadowType === 'inner' ? 'inset ' : '';

    return {
        boxShadow: `${inset}${px(offsetX)} ${px(offsetY)} ${px(blur)} ${node.effect.color}`
    };
};

const getVisualStyle = (
    node: DesignNode,
    resolveAsset: AssetResolver,
    target: 'shape' | 'text'
): CSSProperties => ({
    ...getFillStyle(node.fill, resolveAsset, target),
    ...getStrokeStyle(node.stroke, node.strokeWidth),
    ...getEffectStyle(node),
    borderRadius: toCornerRadiusValue(node.cornerRadius)
});

const getNumericDimension = (value: Dimension | undefined) =>
    typeof value === 'number' ? value : 0;

const getNodeWidth = (node: DesignNode) =>
    'width' in node ? getNumericDimension(node.width) : 0;

const getNodeHeight = (node: DesignNode) =>
    'height' in node ? getNumericDimension(node.height) : 0;

const getTopLevelBounds = (nodes: DesignNode[]): Bounds => {
    if (nodes.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...nodes.map((node) => node.x ?? 0));
    const minY = Math.min(...nodes.map((node) => node.y ?? 0));
    const maxX = Math.max(
        ...nodes.map((node) => (node.x ?? 0) + getNodeWidth(node))
    );
    const maxY = Math.max(
        ...nodes.map((node) => (node.y ?? 0) + getNodeHeight(node))
    );

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

const applyDimensionStyle = ({
    dimension,
    axis,
    parentLayout,
    style
}: {
    dimension: Dimension | undefined;
    axis: 'height' | 'width';
    parentLayout: ParentLayout;
    style: CSSProperties;
}) => {
    if (dimension === undefined || dimension === 'hug_contents') {
        return;
    }

    if (typeof dimension === 'number') {
        style[axis] = px(dimension);
        return;
    }

    if (axis === 'width') {
        if (parentLayout === 'horizontal') {
            style.flex = '1 1 0';
            style.minWidth = 0;
            return;
        }

        style.width = '100%';
        return;
    }

    if (parentLayout === 'vertical') {
        style.flex = '1 1 0';
        style.minHeight = 0;
        return;
    }

    style.height = '100%';
};

const getNodePlacementStyle = (
    node: DesignNode,
    bounds: Bounds | undefined,
    parentLayout: ParentLayout
): CSSProperties => {
    if (parentLayout !== 'absolute') {
        return { position: 'relative' };
    }

    const x = node.x ?? 0;
    const y = node.y ?? 0;

    return {
        position: 'absolute',
        left: px(bounds ? x - bounds.x : x),
        top: px(bounds ? y - bounds.y : y)
    };
};

const getNodeBoxStyle = ({
    height,
    node,
    parentLayout,
    topLevelBounds,
    width
}: {
    node: DesignNode;
    width?: Dimension;
    height?: Dimension;
    parentLayout: ParentLayout;
    topLevelBounds?: Bounds;
}): CSSProperties => {
    const style: CSSProperties = {
        ...getNodePlacementStyle(node, topLevelBounds, parentLayout),
        boxSizing: 'border-box',
        opacity: toCssOpacityValue(node.opacity),
        transform:
            node.rotation === undefined
                ? undefined
                : toCssNodeRotation(node.rotation),
        transformOrigin: node.rotation === undefined ? undefined : 'top left'
    };

    applyDimensionStyle({
        dimension: width,
        axis: 'width',
        parentLayout,
        style
    });
    applyDimensionStyle({
        dimension: height,
        axis: 'height',
        parentLayout,
        style
    });

    return style;
};

const getFlowLayout = (
    layout: LayoutDirection | undefined
): Exclude<LayoutDirection, 'none'> | undefined =>
    layout === 'horizontal' || layout === 'vertical' ? layout : undefined;

const LUCIDE_ICONS: Record<string, LucideIcon> = {
    'align-center-horizontal': AlignCenterHorizontal,
    'align-center-vertical': AlignCenterVertical,
    'align-end-horizontal': AlignEndHorizontal,
    'align-end-vertical': AlignEndVertical,
    'align-start-horizontal': AlignStartHorizontal,
    'align-start-vertical': AlignStartVertical,
    'arrow-down-from-line': ArrowDownFromLine,
    'arrow-right-from-line': ArrowRightFromLine,
    bot: Bot,
    check: Check,
    'chevron-down': ChevronDown,
    'circle-user': CircleUser,
    'diamond-plus': DiamondPlus,
    download: Download,
    eye: Eye,
    'file-text': FileText,
    frame: FrameIcon,
    hand: Hand,
    'layout-dashboard': LayoutDashboard,
    'layout-grid': LayoutGrid,
    minus: Minus,
    'mouse-pointer-2': MousePointer2,
    'panel-left': PanelLeft,
    'panel-right': PanelRight,
    play: Play,
    plus: Plus,
    'sliders-horizontal': SlidersHorizontal,
    square: Square,
    type: TypeIcon
};

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
    selectedNodeId: string | null | undefined,
    onNodePointerDown: ((nodeId: string) => void) | undefined
): NodeInteractionProps => ({
    'data-design-node-selected': selectedNodeId === nodeId ? 'true' : undefined,
    onPointerDown: onNodePointerDown
        ? (event) => {
              event.stopPropagation();
              onNodePointerDown(nodeId);
          }
        : undefined
});

const CanvasTextNode = ({
    node,
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds
}: NodeRendererProps<TextNode>) => {
    const lineHeight =
        node.lineHeight && node.fontSize
            ? px(node.lineHeight * node.fontSize)
            : undefined;
    const style: CSSProperties = {
        ...getNodeBoxStyle({
            node,
            width: node.width,
            height: node.height,
            parentLayout,
            topLevelBounds
        }),
        ...getVisualStyle(node, resolveAsset, 'text'),
        fontFamily: toFontFamily(node.fontFamily),
        fontSize: node.fontSize === undefined ? undefined : px(node.fontSize),
        fontWeight: node.fontWeight,
        lineHeight,
        textAlign: node.textAlign,
        whiteSpace:
            node.textGrowth === 'fixed-width' ||
            node.textGrowth === 'fixed-width-height'
                ? 'pre-wrap'
                : 'nowrap',
        zIndex: 0
    };

    return (
        <div
            className="editor-document-node editor-document-text"
            data-design-node-id={node.id}
            data-design-node-name={node.name}
            {...getNodeInteractionProps(
                node.id,
                selectedNodeId,
                onNodePointerDown
            )}
            style={style}
        >
            <TextContent content={node.content} />
        </div>
    );
};

const CanvasRectangleNode = ({
    node,
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds
}: NodeRendererProps<RectangleNode>) => (
    <div
        className="editor-document-node editor-document-rectangle"
        data-design-node-id={node.id}
        data-design-node-name={node.name}
        {...getNodeInteractionProps(node.id, selectedNodeId, onNodePointerDown)}
        style={{
            ...getNodeBoxStyle({
                node,
                width: node.width,
                height: node.height,
                parentLayout,
                topLevelBounds
            }),
            ...getVisualStyle(node, resolveAsset, 'shape')
        }}
    />
);

const CanvasEllipseNode = ({
    node,
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds
}: NodeRendererProps<EllipseNode>) => (
    <div
        className="editor-document-node editor-document-ellipse"
        data-design-node-id={node.id}
        data-design-node-name={node.name}
        {...getNodeInteractionProps(node.id, selectedNodeId, onNodePointerDown)}
        style={{
            ...getNodeBoxStyle({
                node,
                width: node.width,
                height: node.height,
                parentLayout,
                topLevelBounds
            }),
            ...getVisualStyle(node, resolveAsset, 'shape'),
            borderRadius: '50%'
        }}
    />
);

const CanvasIconNode = ({
    node,
    onNodePointerDown,
    parentLayout,
    selectedNodeId,
    topLevelBounds
}: NodeRendererProps<IconNode>) => {
    const Icon =
        node.library === 'lucide' ? LUCIDE_ICONS[node.icon] : undefined;
    const color = getColorFillValue(node.fill) ?? 'currentColor';
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
            {...getNodeInteractionProps(
                node.id,
                selectedNodeId,
                onNodePointerDown
            )}
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
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds
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
        ...getVisualStyle(node, resolveAsset, 'shape'),
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
            {...getNodeInteractionProps(
                node.id,
                selectedNodeId,
                onNodePointerDown
            )}
            style={style}
        >
            {children.map((child) => (
                <CanvasRenderNode
                    key={child.id}
                    node={child}
                    nodeRenderers={nodeRenderers}
                    onNodePointerDown={onNodePointerDown}
                    parentLayout={childParentLayout}
                    resolveAsset={resolveAsset}
                    selectedNodeId={selectedNodeId}
                />
            ))}
        </div>
    );
};

const defaultNodeRenderers: NodeRendererRegistry = {
    ellipse: CanvasEllipseNode as NodeRenderer,
    frame: CanvasFrameNode as NodeRenderer,
    icon: CanvasIconNode as NodeRenderer,
    rectangle: CanvasRectangleNode as NodeRenderer,
    text: CanvasTextNode as NodeRenderer
};

const CanvasRenderNode = ({
    node,
    nodeRenderers,
    onNodePointerDown,
    parentLayout,
    resolveAsset,
    selectedNodeId,
    topLevelBounds
}: NodeRendererProps) => {
    const Renderer = nodeRenderers[node.type];

    return (
        <Renderer
            node={node}
            nodeRenderers={nodeRenderers}
            onNodePointerDown={onNodePointerDown}
            parentLayout={parentLayout}
            resolveAsset={resolveAsset}
            selectedNodeId={selectedNodeId}
            topLevelBounds={topLevelBounds}
        />
    );
};

export const CanvasDocumentRenderer = ({
    className,
    document,
    nodeRenderers,
    resolveAsset = defaultAssetResolver,
    selectedNodeId,
    onNodePointerDown,
    onCanvasPointerDown
}: CanvasDocumentRendererProps) => {
    const bounds = getTopLevelBounds(document.children);
    const rendererRegistry = {
        ...defaultNodeRenderers,
        ...nodeRenderers
    };

    return (
        <div
            className={['editor-document-renderer relative', className]
                .filter(Boolean)
                .join(' ')}
            data-document-renderer="true"
            onPointerDown={
                onCanvasPointerDown
                    ? () => {
                          onCanvasPointerDown();
                      }
                    : undefined
            }
            style={{
                width: px(bounds.width),
                height: px(bounds.height)
            }}
        >
            {document.children.map((node) => (
                <CanvasRenderNode
                    key={node.id}
                    node={node}
                    nodeRenderers={rendererRegistry}
                    onNodePointerDown={onNodePointerDown}
                    parentLayout="absolute"
                    resolveAsset={resolveAsset}
                    selectedNodeId={selectedNodeId}
                    topLevelBounds={bounds}
                />
            ))}
        </div>
    );
};
