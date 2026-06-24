/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { CSSProperties } from 'react';

import type {
    Fill,
    FrameNode,
    RectangleNode,
    RenderDocument,
    RenderNode,
    TextNode
} from '@miaoma-design-ai/document';

type AssetResolver = (url: string) => string;

type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type CanvasDocumentRendererProps = {
    document: RenderDocument;
    resolveAsset?: AssetResolver;
    className?: string;
};

const defaultAssetResolver: AssetResolver = (url) => url;

const px = (value: number) => `${value}px`;

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

const toCssGradientAngle = (rotation = 0) => `${normalizeAngle(-rotation)}deg`;

const toCssNodeRotation = (rotation: number) => `rotate(${-rotation}deg)`;

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

    if (fontFamily === 'Alimama ShuHeiTi') {
        return `${quoteFontFamily(fontFamily)}, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`;
    }

    if (fontFamily === 'Heiti SC') {
        return `${quoteFontFamily(fontFamily)}, 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif`;
    }

    return `${quoteFontFamily(fontFamily)}, system-ui, sans-serif`;
};

const toGradientValue = (fill: Extract<Fill, { type: 'gradient' }>) =>
    `linear-gradient(${toCssGradientAngle(fill.rotation)}, ${fill.colors
        .map((stop) => `${stop.color} ${stop.position * 100}%`)
        .join(', ')})`;

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

const getTopLevelBounds = (nodes: RenderNode[]): Bounds => {
    if (nodes.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxX = Math.max(
        ...nodes.map((node) => node.x + ('width' in node ? node.width : 0))
    );
    const maxY = Math.max(
        ...nodes.map(
            (node) => node.y + ('height' in node ? (node.height ?? 0) : 0)
        )
    );

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

const getNodePositionStyle = (
    node: RenderNode,
    bounds: Bounds | undefined
): CSSProperties => ({
    position: 'absolute',
    left: px(bounds ? node.x - bounds.x : node.x),
    top: px(bounds ? node.y - bounds.y : node.y)
});

const getSizedNodeStyle = (
    node: FrameNode | RectangleNode,
    bounds: Bounds | undefined
): CSSProperties => ({
    ...getNodePositionStyle(node, bounds),
    width: px(node.width),
    height: px(node.height),
    boxSizing: 'border-box'
});

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

const CanvasTextNode = ({
    node,
    resolveAsset,
    topLevelBounds
}: {
    node: TextNode;
    resolveAsset: AssetResolver;
    topLevelBounds?: Bounds;
}) => {
    const lineHeight =
        node.lineHeight && node.fontSize
            ? px(node.lineHeight * node.fontSize)
            : undefined;
    const style: CSSProperties = {
        ...getNodePositionStyle(node, topLevelBounds),
        ...getFillStyle(node.fill, resolveAsset, 'text'),
        boxSizing: 'border-box',
        width: node.width === undefined ? undefined : px(node.width),
        height: node.height === undefined ? undefined : px(node.height),
        transform:
            node.rotation === undefined
                ? undefined
                : toCssNodeRotation(node.rotation),
        transformOrigin: node.rotation === undefined ? undefined : 'top left',
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
            style={style}
        >
            <TextContent content={node.content} />
        </div>
    );
};

const CanvasRectangleNode = ({
    node,
    resolveAsset,
    topLevelBounds
}: {
    node: RectangleNode;
    resolveAsset: AssetResolver;
    topLevelBounds?: Bounds;
}) => (
    <div
        className="editor-document-node editor-document-rectangle"
        data-design-node-id={node.id}
        data-design-node-name={node.name}
        style={{
            ...getSizedNodeStyle(node, topLevelBounds),
            ...getFillStyle(node.fill, resolveAsset, 'shape')
        }}
    />
);

const CanvasFrameNode = ({
    node,
    resolveAsset,
    topLevelBounds
}: {
    node: FrameNode;
    resolveAsset: AssetResolver;
    topLevelBounds?: Bounds;
}) => (
    <div
        className="editor-document-node editor-document-frame"
        data-design-node-id={node.id}
        data-design-node-name={node.name}
        style={{
            ...getSizedNodeStyle(node, topLevelBounds),
            ...getFillStyle(node.fill, resolveAsset, 'shape'),
            overflow: node.clip ? 'hidden' : undefined
        }}
    >
        {node.children.map((child) => (
            <CanvasRenderNode
                key={child.id}
                node={child}
                resolveAsset={resolveAsset}
            />
        ))}
    </div>
);

const CanvasRenderNode = ({
    node,
    resolveAsset,
    topLevelBounds
}: {
    node: RenderNode;
    resolveAsset: AssetResolver;
    topLevelBounds?: Bounds;
}) => {
    if (node.type === 'frame') {
        return (
            <CanvasFrameNode
                node={node}
                resolveAsset={resolveAsset}
                topLevelBounds={topLevelBounds}
            />
        );
    }

    if (node.type === 'rectangle') {
        return (
            <CanvasRectangleNode
                node={node}
                resolveAsset={resolveAsset}
                topLevelBounds={topLevelBounds}
            />
        );
    }

    return (
        <CanvasTextNode
            node={node}
            resolveAsset={resolveAsset}
            topLevelBounds={topLevelBounds}
        />
    );
};

export const CanvasDocumentRenderer = ({
    className,
    document,
    resolveAsset = defaultAssetResolver
}: CanvasDocumentRendererProps) => {
    const bounds = getTopLevelBounds(document.children);

    return (
        <div
            className={['editor-document-renderer relative', className]
                .filter(Boolean)
                .join(' ')}
            data-document-renderer="true"
            style={{
                width: px(bounds.width),
                height: px(bounds.height)
            }}
        >
            {document.children.map((node) => (
                <CanvasRenderNode
                    key={node.id}
                    node={node}
                    resolveAsset={resolveAsset}
                    topLevelBounds={bounds}
                />
            ))}
        </div>
    );
};
