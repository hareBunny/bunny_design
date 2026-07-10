/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    MiaomaDesignDocument,
    MiaomaDesignValidationResult,
    MiaomaStrictValidationResult
} from '../schema/document';
import type {
    MiaomaFill,
    MiaomaShadowEffect,
    MiaomaStroke
} from '../schema/fill';
import type { MiaomaCornerRadius, MiaomaSpacing } from '../schema/layout';
import type {
    MiaomaDesignNode,
    MiaomaEllipseNode,
    MiaomaFrameNode,
    MiaomaIconNode,
    MiaomaRectangleNode,
    MiaomaTextNode
} from '../schema/node';

import type {
    MiaomaDesignDiagnostic,
    MiaomaDesignDiagnosticCode
} from './diagnostics';
import {
    isUnknownRecord,
    readBoolean,
    readDimension,
    readNumber,
    readString,
    readStringUnion
} from './guards';
import { normalizeDesignDocument } from './normalize';

const readNumberTuple = (value: unknown): number[] | undefined => {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const values = value.map((item) => readNumber(item));

    return values.every((item) => item !== undefined)
        ? (values as number[])
        : undefined;
};

const parseSpacing = (value: unknown): MiaomaSpacing | undefined => {
    const scalar = readNumber(value);

    if (scalar !== undefined) {
        return scalar;
    }

    const tuple = readNumberTuple(value);

    if (tuple?.length === 2) {
        return [tuple[0], tuple[1]];
    }

    if (tuple?.length === 4) {
        return [tuple[0], tuple[1], tuple[2], tuple[3]];
    }

    return undefined;
};

const parseCornerRadius = (value: unknown): MiaomaCornerRadius | undefined => {
    const scalar = readNumber(value);

    if (scalar !== undefined) {
        return scalar;
    }

    const tuple = readNumberTuple(value);

    return tuple?.length === 4
        ? [tuple[0], tuple[1], tuple[2], tuple[3]]
        : undefined;
};

const parseOptionalPoint = (
    value: unknown
): { x?: number; y?: number } | undefined => {
    if (!isUnknownRecord(value)) {
        return undefined;
    }

    const x = readNumber(value.x);
    const y = readNumber(value.y);

    return x === undefined && y === undefined ? undefined : { x, y };
};

const parseOptionalSize = (
    value: unknown
): { width?: number; height?: number } | undefined => {
    if (!isUnknownRecord(value)) {
        return undefined;
    }

    const width = readNumber(value.width);
    const height = readNumber(value.height);

    return width === undefined && height === undefined
        ? undefined
        : { width, height };
};

const isStrictString = (
    value: unknown,
    path: string,
    addDiagnostic: (
        code: MiaomaDesignDiagnosticCode,
        path: string,
        message: string
    ) => void,
    message: string
) => {
    const text = readString(value);

    if (!text) {
        addDiagnostic('invalid_node', path, message);
    }

    return text;
};

const isStrictDimension = (
    value: unknown,
    path: string,
    addDiagnostic: (
        code: MiaomaDesignDiagnosticCode,
        path: string,
        message: string
    ) => void
) => {
    const dimension = readDimension(value);

    if (dimension === undefined) {
        addDiagnostic('invalid_node', path, 'Node dimension is required.');
    }

    return dimension;
};

export const strictValidateDesignDocument = (
    input: unknown
): MiaomaStrictValidationResult => {
    const diagnostics: MiaomaDesignDiagnostic[] = [];
    const addDiagnostic = (
        code: MiaomaDesignDiagnosticCode,
        path: string,
        message: string
    ) => {
        diagnostics.push({ code, path, message });
    };

    const parseFill = (
        value: unknown,
        path: string
    ): MiaomaFill | undefined => {
        if (value === undefined) {
            return undefined;
        }

        if (isUnknownRecord(value) && value.enabled === false) {
            addDiagnostic('disabled_fill', path, 'Disabled fill was skipped.');
            return undefined;
        }

        if (typeof value === 'string') {
            addDiagnostic(
                'invalid_fill',
                path,
                'Fill must use the object form in strict mode.'
            );
            return undefined;
        }

        if (!isUnknownRecord(value)) {
            addDiagnostic('invalid_fill', path, 'Fill must be an object.');
            return undefined;
        }

        if (value.type === 'color' && readString(value.color)) {
            return { type: 'color', color: readString(value.color)! };
        }

        const fillType = readString(value.type);

        if (fillType === 'color') {
            addDiagnostic(
                'invalid_fill',
                path,
                'Color fill requires a color string.'
            );
            return undefined;
        }

        if (value.type === 'gradient') {
            const colors = Array.isArray(value.colors)
                ? value.colors.flatMap((stop, index) => {
                      if (!isUnknownRecord(stop)) {
                          addDiagnostic(
                              'invalid_fill',
                              `${path}.colors[${index}]`,
                              'Gradient color stop must be an object.'
                          );
                          return [];
                      }

                      const color = readString(stop.color);
                      const position = readNumber(stop.position);

                      if (!color || position === undefined) {
                          addDiagnostic(
                              'invalid_fill',
                              `${path}.colors[${index}]`,
                              'Gradient color stop requires color and position.'
                          );
                          return [];
                      }

                      return [{ color, position }];
                  })
                : [];

            if (colors.length > 0) {
                return {
                    type: 'gradient',
                    gradientType:
                        readStringUnion(value.gradientType, [
                            'linear',
                            'radial'
                        ]) ?? 'linear',
                    rotation: readNumber(value.rotation),
                    center: parseOptionalPoint(value.center),
                    size: parseOptionalSize(value.size),
                    colors
                };
            }

            addDiagnostic(
                'invalid_fill',
                path,
                'Gradient fill requires at least one valid color stop.'
            );
            return undefined;
        }

        if (value.type === 'image') {
            const url = readString(value.url);

            if (url) {
                return {
                    type: 'image',
                    url,
                    mode:
                        readStringUnion(value.mode, [
                            'fill',
                            'fit',
                            'stretch'
                        ]) ?? 'fill'
                };
            }

            addDiagnostic(
                'invalid_fill',
                path,
                'Image fill requires a url string.'
            );
            return undefined;
        }

        addDiagnostic(
            fillType ? 'unsupported_fill_type' : 'invalid_fill',
            path,
            fillType
                ? `Unsupported fill type "${fillType}".`
                : 'Fill must be a supported color, gradient, or image fill.'
        );
        return undefined;
    };

    const parseFillList = (
        value: unknown,
        path: string
    ): MiaomaFill[] | undefined => {
        if (value === undefined) {
            return undefined;
        }

        const values = Array.isArray(value) ? value : [value];
        const fills = values.flatMap((item, index) => {
            const fill = parseFill(
                item,
                Array.isArray(value) ? `${path}[${index}]` : path
            );

            return fill ? [fill] : [];
        });

        return fills.length > 0 ? fills : undefined;
    };

    const parseStrokeItem = (
        value: unknown,
        path: string,
        fallbackWidth: number | undefined,
        fallbackAlignment: MiaomaStroke['align'] | undefined
    ): MiaomaStroke | undefined => {
        const fill = parseFill(value, path);

        if (!fill) {
            return undefined;
        }

        return {
            ...fill,
            width: isUnknownRecord(value)
                ? (readNumber(value.width) ?? fallbackWidth)
                : fallbackWidth,
            align: isUnknownRecord(value)
                ? (readStringUnion(value.align, ['center', 'inner', 'outer']) ??
                  fallbackAlignment)
                : fallbackAlignment
        };
    };

    const parseStrokeList = (
        value: unknown,
        path: string,
        fallbackWidth: number | undefined,
        fallbackAlignment: MiaomaStroke['align'] | undefined
    ): MiaomaStroke[] | undefined => {
        if (value === undefined) {
            return undefined;
        }

        const values = Array.isArray(value) ? value : [value];
        const strokes = values.flatMap((item, index) => {
            const stroke = parseStrokeItem(
                item,
                Array.isArray(value) ? `${path}[${index}]` : path,
                fallbackWidth,
                fallbackAlignment
            );

            return stroke ? [stroke] : [];
        });

        return strokes.length > 0 ? strokes : undefined;
    };

    const parseEffect = (value: unknown): MiaomaShadowEffect | undefined => {
        if (!isUnknownRecord(value) || value.type !== 'shadow') {
            return undefined;
        }

        const color = readString(value.color);
        if (!color) {
            return undefined;
        }

        return {
            type: 'shadow',
            shadowType: readStringUnion(value.shadowType, ['inner', 'outer']),
            color,
            offset: isUnknownRecord(value.offset)
                ? {
                      x: readNumber(value.offset.x) ?? 0,
                      y: readNumber(value.offset.y) ?? 0
                  }
                : undefined,
            blur: readNumber(value.blur)
        };
    };

    const parseEffectList = (
        value: unknown
    ): MiaomaShadowEffect[] | undefined => {
        if (value === undefined) {
            return undefined;
        }

        const values = Array.isArray(value) ? value : [value];
        const effects = values.flatMap((item) => {
            const effect = parseEffect(item);

            return effect ? [effect] : [];
        });

        return effects.length > 0 ? effects : undefined;
    };

    const parseCommonNode = (value: Record<string, unknown>, path: string) => {
        const strokeWidth = readNumber(value.strokeWidth);
        const strokeAlignment = readStringUnion(value.strokeAlignment, [
            'center',
            'inner',
            'outer'
        ]);

        return {
            id:
                isStrictString(
                    value.id,
                    `${path}.id`,
                    addDiagnostic,
                    'Node id is required.'
                ) ?? path,
            name: readString(value.name),
            opacity: readNumber(value.opacity),
            x: readNumber(value.x),
            y: readNumber(value.y),
            rotation: readNumber(value.rotation),
            fill: parseFillList(value.fill, `${path}.fill`),
            stroke: parseStrokeList(
                value.stroke,
                `${path}.stroke`,
                strokeWidth,
                strokeAlignment
            ),
            strokeWidth,
            strokeAlignment,
            cornerRadius: parseCornerRadius(value.cornerRadius),
            effect: parseEffectList(value.effect)
        };
    };

    const parseNode = (value: unknown, path: string): MiaomaDesignNode[] => {
        if (!isUnknownRecord(value)) {
            addDiagnostic(
                'invalid_node',
                path,
                'Child node must be an object.'
            );
            return [];
        }

        switch (value.type) {
            case 'frame': {
                const node: MiaomaFrameNode = {
                    ...parseCommonNode(value, path),
                    type: 'frame',
                    width: readDimension(value.width),
                    height: readDimension(value.height),
                    clip: readBoolean(value.clip),
                    layout: readStringUnion(value.layout, [
                        'none',
                        'horizontal',
                        'vertical'
                    ]),
                    gap: readNumber(value.gap),
                    padding: parseSpacing(value.padding),
                    justifyContent: readStringUnion(value.justifyContent, [
                        'start',
                        'center',
                        'end',
                        'space_between',
                        'space_around'
                    ]),
                    alignItems: readStringUnion(value.alignItems, [
                        'start',
                        'center',
                        'end',
                        'stretch'
                    ]),
                    children: Array.isArray(value.children)
                        ? value.children.flatMap((child, index) =>
                              parseNode(child, `${path}.children[${index}]`)
                          )
                        : undefined
                };
                return [node];
            }
            case 'rectangle': {
                const node: MiaomaRectangleNode = {
                    ...parseCommonNode(value, path),
                    type: 'rectangle',
                    width:
                        isStrictDimension(
                            value.width,
                            `${path}.width`,
                            addDiagnostic
                        ) ?? 0,
                    height:
                        isStrictDimension(
                            value.height,
                            `${path}.height`,
                            addDiagnostic
                        ) ?? 0
                };
                return [node];
            }
            case 'ellipse': {
                const node: MiaomaEllipseNode = {
                    ...parseCommonNode(value, path),
                    type: 'ellipse',
                    width:
                        isStrictDimension(
                            value.width,
                            `${path}.width`,
                            addDiagnostic
                        ) ?? 0,
                    height:
                        isStrictDimension(
                            value.height,
                            `${path}.height`,
                            addDiagnostic
                        ) ?? 0
                };
                return [node];
            }
            case 'icon': {
                const node: MiaomaIconNode = {
                    ...parseCommonNode(value, path),
                    type: 'icon',
                    width:
                        isStrictDimension(
                            value.width,
                            `${path}.width`,
                            addDiagnostic
                        ) ?? 0,
                    height:
                        isStrictDimension(
                            value.height,
                            `${path}.height`,
                            addDiagnostic
                        ) ?? 0,
                    icon:
                        isStrictString(
                            value.icon,
                            `${path}.icon`,
                            addDiagnostic,
                            'Icon node icon is required.'
                        ) ?? '',
                    library: readString(value.library)
                };
                return [node];
            }
            case 'text': {
                const node: MiaomaTextNode = {
                    ...parseCommonNode(value, path),
                    type: 'text',
                    content:
                        isStrictString(
                            value.content,
                            `${path}.content`,
                            addDiagnostic,
                            'Text content is required.'
                        ) ?? '',
                    width: readDimension(value.width),
                    height: readDimension(value.height),
                    textGrowth: readStringUnion(value.textGrowth, [
                        'auto',
                        'fixed-width',
                        'fixed-width-height'
                    ]),
                    textAlign: readStringUnion(value.textAlign, [
                        'left',
                        'center',
                        'right',
                        'justify'
                    ]),
                    fontFamily: readString(value.fontFamily),
                    fontSize: readNumber(value.fontSize),
                    fontWeight: readString(value.fontWeight),
                    lineHeight: readNumber(value.lineHeight)
                };
                return [node];
            }
            default:
                addDiagnostic(
                    'unsupported_node_type',
                    path,
                    `Unsupported node type "${readString(value.type) ?? 'unknown'}".`
                );
                return [];
        }
    };

    if (!isUnknownRecord(input)) {
        addDiagnostic(
            'invalid_document',
            '$',
            'Design document must be an object.'
        );
        return { success: false, diagnostics };
    }

    const version = readString(input.version);
    if (!version) {
        addDiagnostic('invalid_document', '$.version', 'Version is required.');
    }

    if (!Array.isArray(input.children)) {
        addDiagnostic(
            'invalid_document',
            '$.children',
            'Document children must be an array.'
        );
    }

    const document: MiaomaDesignDocument = {
        version: version ?? 'unknown',
        fileToken: readString(input.fileToken),
        children: Array.isArray(input.children)
            ? input.children.flatMap((child, index) =>
                  parseNode(child, `$.children[${index}]`)
              )
            : []
    };

    if (diagnostics.length > 0) {
        return {
            success: false,
            diagnostics
        };
    }

    return {
        success: true,
        document: normalizeDesignDocument(document),
        diagnostics: []
    };
};

export const validateDesignDocument = (
    input: unknown
): MiaomaDesignValidationResult => {
    const result = strictValidateDesignDocument(input);

    if (result.success) {
        return result;
    }

    return {
        document: { version: 'unknown', children: [] },
        diagnostics: result.diagnostics
    };
};
