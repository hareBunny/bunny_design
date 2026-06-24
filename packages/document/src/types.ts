/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type DocumentDiagnosticCode =
    | 'disabled_fill'
    | 'invalid_document'
    | 'invalid_fill'
    | 'invalid_node'
    | 'unsupported_fill_type'
    | 'unsupported_node_type';

export type DocumentDiagnostic = {
    code: DocumentDiagnosticCode;
    path: string;
    message: string;
};

export type ColorFill = {
    type: 'color';
    color: string;
};

export type LinearGradientFill = {
    type: 'gradient';
    gradientType: 'linear';
    rotation?: number;
    colors: {
        color: string;
        position: number;
    }[];
};

export type ImageFill = {
    type: 'image';
    url: string;
    mode: 'fill' | 'fit' | 'stretch';
};

export type Fill = ColorFill | LinearGradientFill | ImageFill;

export type Dimension = number | 'fill_container' | 'hug_contents';

export type CornerRadius = number | [number, number, number, number];

export type Spacing =
    | number
    | [number, number]
    | [number, number, number, number];

export type LayoutDirection = 'none' | 'horizontal' | 'vertical';

export type JustifyContent = 'start' | 'center' | 'end' | 'space_between';

export type AlignItems = 'start' | 'center' | 'end' | 'stretch';

export type ShadowEffect = {
    type: 'shadow';
    shadowType?: 'inner' | 'outer';
    color: string;
    offset?: {
        x: number;
        y: number;
    };
    blur?: number;
};

type BaseNode = {
    id: string;
    name?: string;
    x: number;
    y: number;
    rotation?: number;
    fill?: Fill;
    stroke?: Fill;
    strokeWidth?: number;
    strokeAlignment?: 'center' | 'inner' | 'outer';
    cornerRadius?: CornerRadius;
    effect?: ShadowEffect;
};

export type FrameNode = BaseNode & {
    type: 'frame';
    width?: Dimension;
    height?: Dimension;
    clip?: boolean;
    layout?: LayoutDirection;
    gap?: number;
    padding?: Spacing;
    justifyContent?: JustifyContent;
    alignItems?: AlignItems;
    children: DesignNode[];
};

export type RectangleNode = BaseNode & {
    type: 'rectangle';
    width: Dimension;
    height: Dimension;
};

export type EllipseNode = BaseNode & {
    type: 'ellipse';
    width: Dimension;
    height: Dimension;
};

export type IconNode = BaseNode & {
    type: 'icon';
    width: Dimension;
    height: Dimension;
    icon: string;
    library?: string;
};

export type TextNode = BaseNode & {
    type: 'text';
    content: string;
    width?: Dimension;
    height?: Dimension;
    textGrowth?: 'auto' | 'fixed-width' | 'fixed-width-height';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    lineHeight?: number;
};

export type DesignNode =
    | EllipseNode
    | FrameNode
    | IconNode
    | RectangleNode
    | TextNode;

export type DesignDocument = {
    version: string;
    fileToken?: string;
    children: DesignNode[];
};

export type ParseResult = {
    document: DesignDocument;
    diagnostics: DocumentDiagnostic[];
};

export type RenderNode = DesignNode;

export type RenderDocument = {
    version: string;
    fileToken?: string;
    children: RenderNode[];
};

export type UnknownRecord = Record<string, unknown>;

export type ParserContext = {
    diagnostics: DocumentDiagnostic[];
    isRecord: (value: unknown) => value is UnknownRecord;
    readString: (value: unknown) => string | undefined;
    readNumber: (value: unknown) => number | undefined;
    readBoolean: (value: unknown) => boolean | undefined;
    readDimension: (value: unknown) => Dimension | undefined;
    readStringUnion: <T extends string>(
        value: unknown,
        allowed: readonly T[]
    ) => T | undefined;
    addDiagnostic: (
        code: DocumentDiagnosticCode,
        path: string,
        message: string
    ) => void;
    parseFill: (value: unknown, path: string) => Fill | undefined;
    parseChildren: (value: unknown, path: string) => DesignNode[];
};

export type NodeParserPlugin = {
    type: string;
    parse: (input: {
        value: UnknownRecord;
        path: string;
        context: ParserContext;
    }) => DesignNode[];
};

export type FillParserPlugin = {
    name: string;
    match: (value: unknown, context: ParserContext) => boolean;
    parse: (input: {
        value: unknown;
        path: string;
        context: ParserContext;
    }) => Fill | undefined;
};

export type RenderTreeContext = {
    transformNode: (node: RenderNode) => RenderNode;
};

export type RenderTreePlugin = {
    transformNode?: (
        node: RenderNode,
        context: RenderTreeContext
    ) => RenderNode;
    transformDocument?: (
        document: RenderDocument,
        context: RenderTreeContext
    ) => RenderDocument;
};

export type CreateDocumentKernelOptions = {
    fillPlugins?: FillParserPlugin[];
    nodePlugins?: NodeParserPlugin[];
    renderPlugins?: RenderTreePlugin[];
};

export type DocumentKernel = {
    parseDocument: (input: unknown) => ParseResult;
    createRenderTree: (document: DesignDocument) => RenderDocument;
};
