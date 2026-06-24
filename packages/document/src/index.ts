/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export { createDefaultDocumentKernel, createDocumentKernel } from './kernel';
export { parseDesignDocument } from './parser';
export { createRenderTree } from './renderTree';
export type {
    AlignItems,
    ColorFill,
    CornerRadius,
    CreateDocumentKernelOptions,
    DesignDocument,
    DesignNode,
    Dimension,
    DocumentDiagnostic,
    DocumentDiagnosticCode,
    DocumentKernel,
    EllipseNode,
    Fill,
    FillParserPlugin,
    FrameNode,
    IconNode,
    ImageFill,
    JustifyContent,
    LayoutDirection,
    LinearGradientFill,
    NodeParserPlugin,
    ParserContext,
    ParseResult,
    RectangleNode,
    RenderDocument,
    RenderNode,
    RenderTreeContext,
    RenderTreePlugin,
    ShadowEffect,
    Spacing,
    TextNode
} from './types';
