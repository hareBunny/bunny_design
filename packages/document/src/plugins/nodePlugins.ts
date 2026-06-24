/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    AlignItems,
    CornerRadius,
    DesignNode,
    Dimension,
    EllipseNode,
    FrameNode,
    IconNode,
    JustifyContent,
    LayoutDirection,
    NodeParserPlugin,
    ParserContext,
    RectangleNode,
    ShadowEffect,
    Spacing,
    TextNode,
    UnknownRecord
} from '../types';

const readNumberTuple = (
    value: unknown,
    context: ParserContext
): number[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const numbers = value.map((item) => context.readNumber(item));

    return numbers.every((item) => item !== undefined)
        ? (numbers as number[])
        : undefined;
};

const parseSpacing = (
    value: unknown,
    context: ParserContext
): Spacing | undefined => {
    const spacing = context.readNumber(value);

    if (spacing !== undefined) {
        return spacing;
    }

    const tuple = readNumberTuple(value, context);

    if (tuple?.length === 2) {
        return [tuple[0], tuple[1]];
    }

    if (tuple?.length === 4) {
        return [tuple[0], tuple[1], tuple[2], tuple[3]];
    }

    return undefined;
};

const parseCornerRadius = (
    value: unknown,
    context: ParserContext
): CornerRadius | undefined => {
    const radius = context.readNumber(value);

    if (radius !== undefined) {
        return radius;
    }

    const tuple = readNumberTuple(value, context);

    if (tuple?.length === 4) {
        return [tuple[0], tuple[1], tuple[2], tuple[3]];
    }

    return undefined;
};

const parseShadowEffect = (
    value: unknown,
    context: ParserContext
): ShadowEffect | undefined => {
    if (!context.isRecord(value)) {
        return undefined;
    }

    const type = context.readStringUnion(value.type, ['shadow']);
    const color = context.readString(value.color);

    if (type !== 'shadow' || !color) {
        return undefined;
    }

    const offset = context.isRecord(value.offset)
        ? {
              x: context.readNumber(value.offset.x) ?? 0,
              y: context.readNumber(value.offset.y) ?? 0
          }
        : undefined;

    return {
        type,
        shadowType: context.readStringUnion(value.shadowType, [
            'inner',
            'outer'
        ]),
        color,
        offset,
        blur: context.readNumber(value.blur)
    };
};

const parseLayoutDirection = (
    value: UnknownRecord,
    context: ParserContext
): LayoutDirection | undefined => {
    const layout = context.readStringUnion(value.layout, [
        'none',
        'horizontal',
        'vertical'
    ]);

    if (layout) {
        return layout;
    }

    if (
        Array.isArray(value.children) ||
        value.alignItems !== undefined ||
        value.gap !== undefined ||
        value.justifyContent !== undefined ||
        value.padding !== undefined
    ) {
        return 'horizontal';
    }

    return undefined;
};

const readDimensionWithFallback = (
    value: unknown,
    context: ParserContext
): Dimension => context.readDimension(value) ?? 0;

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
    fill: context.parseFill(value.fill, `${path}.fill`),
    stroke: context.parseFill(value.stroke, `${path}.stroke`),
    strokeWidth: context.readNumber(value.strokeWidth),
    strokeAlignment: context.readStringUnion(value.strokeAlignment, [
        'center',
        'inner',
        'outer'
    ]),
    cornerRadius: parseCornerRadius(value.cornerRadius, context),
    effect: parseShadowEffect(value.effect, context)
});

const parseFrameNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): FrameNode => ({
    ...parseCommonNode(value, path, context),
    type: 'frame',
    width: context.readDimension(value.width),
    height: context.readDimension(value.height),
    clip: context.readBoolean(value.clip),
    layout: parseLayoutDirection(value, context),
    gap: context.readNumber(value.gap),
    padding: parseSpacing(value.padding, context),
    justifyContent: context.readStringUnion<JustifyContent>(
        value.justifyContent,
        ['start', 'center', 'end', 'space_between']
    ),
    alignItems: context.readStringUnion<AlignItems>(value.alignItems, [
        'start',
        'center',
        'end',
        'stretch'
    ]),
    children: context.parseChildren(value.children, `${path}.children`)
});

const parseRectangleNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): RectangleNode => ({
    ...parseCommonNode(value, path, context),
    type: 'rectangle',
    width: readDimensionWithFallback(value.width, context),
    height: readDimensionWithFallback(value.height, context)
});

const parseEllipseNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): EllipseNode => ({
    ...parseCommonNode(value, path, context),
    type: 'ellipse',
    width: readDimensionWithFallback(value.width, context),
    height: readDimensionWithFallback(value.height, context)
});

const parseIconNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): IconNode => ({
    ...parseCommonNode(value, path, context),
    type: 'icon',
    width: readDimensionWithFallback(value.width, context),
    height: readDimensionWithFallback(value.height, context),
    icon: context.readString(value.icon) ?? '',
    library: context.readString(value.library)
});

const parseTextNode = (
    value: UnknownRecord,
    path: string,
    context: ParserContext
): TextNode => ({
    ...parseCommonNode(value, path, context),
    type: 'text',
    content: context.readString(value.content) ?? '',
    width: context.readDimension(value.width),
    height: context.readDimension(value.height),
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
    createNodePlugin('ellipse', parseEllipseNode),
    createNodePlugin('icon', parseIconNode),
    createNodePlugin('text', parseTextNode)
];
