/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    DesignNode,
    FrameNode,
    NodeParserPlugin,
    ParserContext,
    RectangleNode,
    TextNode,
    UnknownRecord
} from '../types';

const parseCommonNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
) => ({
    id: context.readString(value.id) ?? path,
    name: context.readString(value.name),
    x: context.readNumber(value.x) ?? 0,
    y: context.readNumber(value.y) ?? 0,
    rotation: context.readNumber(value.rotation),
    fill: context.parseFill(value.fill, `${path}.fill`)
});

const parseFrameNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): FrameNode => ({
    ...parseCommonNode(value, path, context),
    type: 'frame',
    width: context.readNumber(value.width) ?? 0,
    height: context.readNumber(value.height) ?? 0,
    clip: context.readBoolean(value.clip),
    layout: context.readStringUnion(value.layout, ['none']),
    children: context.parseChildren(value.children, `${path}.children`)
});

const parseRectangleNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): RectangleNode => ({
    ...parseCommonNode(value, path, context),
    type: 'rectangle',
    width: context.readNumber(value.width) ?? 0,
    height: context.readNumber(value.height) ?? 0
});

const parseTextNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): TextNode => ({
    ...parseCommonNode(value, path, context),
    type: 'text',
    content: context.readString(value.content) ?? '',
    width: context.readNumber(value.width),
    height: context.readNumber(value.height),
    textGrowth: context.readStringUnion(value.textGrowth, [
        'auto',
        'fixed-width',
        'fixed-width-height'
    ]),
    textAlign: context.readStringUnion(value.textAlign, [
        'left',
        'center',
        'right',
        'justify'
    ]),
    fontFamily: context.readString(value.fontFamily),
    fontSize: context.readNumber(value.fontSize),
    fontWeight: context.readString(value.fontWeight),
    lineHeight: context.readNumber(value.lineHeight)
});

const createNodePlugin = (
    type: DesignNode['type'],
    parse: (
        value: UnknownRecord,
        path: string,
        context: ParserContext
    ) => DesignNode
): NodeParserPlugin => ({
    type,
    parse: ({ value, path, context }) => [parse(value, path, context)]
});

export const createDefaultNodePlugins = (): NodeParserPlugin[] => [
    createNodePlugin('frame', parseFrameNode),
    createNodePlugin('rectangle', parseRectangleNode),
    createNodePlugin('text', parseTextNode)
];
