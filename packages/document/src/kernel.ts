/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createDefaultFillPlugins } from './plugins/fillPlugins';
import { createDefaultNodePlugins } from './plugins/nodePlugins';
import type {
    CreateDocumentKernelOptions,
    DesignDocument,
    DesignNode,
    DocumentDiagnostic,
    DocumentKernel,
    Fill,
    FillParserPlugin,
    NodeParserPlugin,
    ParserContext,
    ParseResult,
    RenderDocument,
    RenderNode,
    RenderTreeContext,
    RenderTreePlugin,
    UnknownRecord
} from './types';

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

const readNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: unknown): boolean | undefined =>
    typeof value === 'boolean' ? value : undefined;

const readDimension: ParserContext['readDimension'] = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (value === 'fill_container' || value === 'hug_contents') {
        return value;
    }

    return undefined;
};

const readStringUnion = <T extends string>(
    value: unknown,
    allowed: readonly T[]
): T | undefined =>
    typeof value === 'string' && allowed.includes(value as T)
        ? (value as T)
        : undefined;

const createNodePluginRegistry = (plugins: NodeParserPlugin[]) =>
    new Map(plugins.map((plugin) => [plugin.type, plugin]));

const createParserContext = ({
    diagnostics,
    fillPlugins,
    nodePlugins
}: {
    diagnostics: DocumentDiagnostic[];
    fillPlugins: FillParserPlugin[];
    nodePlugins: Map<string, NodeParserPlugin>;
}): ParserContext => {
    const addDiagnostic: ParserContext['addDiagnostic'] = (
        code,
        path,
        message
    ) => {
        diagnostics.push({ code, path, message });
    };

    const context: ParserContext = {
        diagnostics,
        isRecord,
        readString,
        readNumber,
        readBoolean,
        readDimension,
        readStringUnion,
        addDiagnostic,
        parseFill: (value, path) =>
            parseFill(value, path, context, fillPlugins),
        parseChildren: (value, path) =>
            parseChildren(value, path, context, nodePlugins)
    };

    return context;
};

const parseFill = (
    value: unknown,
    path: string,
    context: ParserContext,
    fillPlugins: FillParserPlugin[]
): Fill | undefined => {
    if (value === undefined) {
        return undefined;
    }

    if (context.isRecord(value) && value.enabled === false) {
        context.addDiagnostic(
            'disabled_fill',
            path,
            'Disabled fill was skipped.'
        );

        return undefined;
    }

    const plugin = fillPlugins.find((candidate) =>
        candidate.match(value, context)
    );

    if (plugin) {
        return plugin.parse({ value, path, context });
    }

    if (!context.isRecord(value)) {
        context.addDiagnostic(
            'invalid_fill',
            path,
            'Fill must be a string or object.'
        );

        return undefined;
    }

    const fillType = context.readString(value.type);

    context.addDiagnostic(
        'unsupported_fill_type',
        path,
        `Unsupported fill type "${fillType ?? 'unknown'}".`
    );

    return undefined;
};

const parseNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext,
    nodePlugins: Map<string, NodeParserPlugin>
): DesignNode[] => {
    const type = context.readString(value.type);
    const plugin = type ? nodePlugins.get(type) : undefined;

    if (!plugin) {
        context.addDiagnostic(
            'unsupported_node_type',
            path,
            `Unsupported node type "${type ?? 'unknown'}".`
        );

        return [];
    }

    return plugin.parse({ value, path, context });
};

const parseChildren = (
    value: unknown,
    path: string,
    context: ParserContext,
    nodePlugins: Map<string, NodeParserPlugin>
): DesignNode[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((child, index) => {
        const childPath = `${path}[${index}]`;

        if (!context.isRecord(child)) {
            context.addDiagnostic(
                'invalid_node',
                childPath,
                'Child node must be an object.'
            );

            return [];
        }

        return parseNode(child, childPath, context, nodePlugins);
    });
};

const cloneRenderNode = (
    node: DesignNode,
    context: RenderTreeContext
): RenderNode => {
    const cloned: RenderNode =
        node.type === 'frame'
            ? {
                  ...node,
                  children: node.children.map((child) =>
                      cloneRenderNode(child, context)
                  )
              }
            : { ...node };

    return context.transformNode(cloned);
};

const createRenderTreeContext = (
    renderPlugins: RenderTreePlugin[]
): RenderTreeContext => {
    const context: RenderTreeContext = {
        transformNode: (node) =>
            renderPlugins.reduce(
                (nextNode, plugin) =>
                    plugin.transformNode
                        ? plugin.transformNode(nextNode, context)
                        : nextNode,
                node
            )
    };

    return context;
};

export const createDocumentKernel = (
    options: CreateDocumentKernelOptions = {}
): DocumentKernel => {
    const nodePlugins = createNodePluginRegistry([
        ...createDefaultNodePlugins(),
        ...(options.nodePlugins ?? [])
    ]);
    const fillPlugins = [
        ...(options.fillPlugins ?? []),
        ...createDefaultFillPlugins()
    ];
    const renderPlugins = options.renderPlugins ?? [];

    return {
        parseDocument: (input: unknown): ParseResult => {
            const diagnostics: DocumentDiagnostic[] = [];
            const context = createParserContext({
                diagnostics,
                fillPlugins,
                nodePlugins
            });

            if (!context.isRecord(input)) {
                context.addDiagnostic(
                    'invalid_document',
                    '$',
                    'Design document must be an object.'
                );

                return {
                    document: { version: 'unknown', children: [] },
                    diagnostics
                };
            }

            const document: DesignDocument = {
                version: context.readString(input.version) ?? 'unknown',
                fileToken: context.readString(input.fileToken),
                children: context.parseChildren(input.children, '$.children')
            };

            return { document, diagnostics };
        },
        createRenderTree: (document: DesignDocument): RenderDocument => {
            const renderContext = createRenderTreeContext(renderPlugins);
            const renderDocument: RenderDocument = {
                version: document.version,
                fileToken: document.fileToken,
                children: document.children.map((node) =>
                    cloneRenderNode(node, renderContext)
                )
            };

            return renderPlugins.reduce(
                (nextDocument, plugin) =>
                    plugin.transformDocument
                        ? plugin.transformDocument(nextDocument, renderContext)
                        : nextDocument,
                renderDocument
            );
        }
    };
};

export const createDefaultDocumentKernel = (): DocumentKernel =>
    createDocumentKernel();
