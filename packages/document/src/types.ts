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

type BaseNode = {
    id: string;
    name?: string;
    x: number;
    y: number;
    rotation?: number;
    fill?: Fill;
};

export type FrameNode = BaseNode & {
    type: 'frame';
    width: number;
    height: number;
    clip?: boolean;
    layout?: 'none';
    children: DesignNode[];
};

export type RectangleNode = BaseNode & {
    type: 'rectangle';
    width: number;
    height: number;
};

export type TextNode = BaseNode & {
    type: 'text';
    content: string;
    width?: number;
    height?: number;
    textGrowth?: 'auto' | 'fixed-width' | 'fixed-width-height';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    lineHeight?: number;
};

export type DesignNode = FrameNode | RectangleNode | TextNode;

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
