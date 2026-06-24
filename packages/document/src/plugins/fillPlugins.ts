/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    FillParserPlugin,
    ImageFill,
    LinearGradientFill,
    UnknownRecord
} from '../types';

const isFillRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const isFillType = (value: unknown, type: string) =>
    isFillRecord(value) && value.type === type;

const colorStringFillPlugin: FillParserPlugin = {
    name: 'color-string-fill',
    match: (value) => typeof value === 'string',
    parse: ({ value }) =>
        typeof value === 'string'
            ? {
                  type: 'color',
                  color: value
              }
            : undefined
};

const colorObjectFillPlugin: FillParserPlugin = {
    name: 'color-object-fill',
    match: (value) => isFillType(value, 'color'),
    parse: ({ value, path, context }) => {
        if (!context.isRecord(value)) {
            return undefined;
        }

        const color = context.readString(value.color);

        if (!color) {
            context.addDiagnostic(
                'invalid_fill',
                path,
                'Color fill requires color.'
            );

            return undefined;
        }

        return { type: 'color', color };
    }
};

const linearGradientFillPlugin: FillParserPlugin = {
    name: 'linear-gradient-fill',
    match: (value) => isFillType(value, 'gradient'),
    parse: ({ value, path, context }) => {
        if (!context.isRecord(value)) {
            return undefined;
        }

        const gradientType = context.readStringUnion(value.gradientType, [
            'linear'
        ]);
        const rawColors = Array.isArray(value.colors) ? value.colors : [];
        const colors = rawColors.flatMap((colorStop, index) => {
            if (!context.isRecord(colorStop)) {
                context.addDiagnostic(
                    'invalid_fill',
                    `${path}.colors[${index}]`,
                    'Gradient color stop must be an object.'
                );

                return [];
            }

            const color = context.readString(colorStop.color);
            const position = context.readNumber(colorStop.position);

            if (!color || position === undefined) {
                context.addDiagnostic(
                    'invalid_fill',
                    `${path}.colors[${index}]`,
                    'Gradient color stop requires color and position.'
                );

                return [];
            }

            return [{ color, position }];
        });

        if (gradientType !== 'linear' || colors.length === 0) {
            context.addDiagnostic(
                'invalid_fill',
                path,
                'Only linear gradients with at least one color stop are supported.'
            );

            return undefined;
        }

        return {
            type: 'gradient',
            gradientType,
            rotation: context.readNumber(value.rotation),
            colors
        } satisfies LinearGradientFill;
    }
};

const imageFillPlugin: FillParserPlugin = {
    name: 'image-fill',
    match: (value) => isFillType(value, 'image'),
    parse: ({ value, path, context }) => {
        if (!context.isRecord(value)) {
            return undefined;
        }

        const url = context.readString(value.url);

        if (!url) {
            context.addDiagnostic(
                'invalid_fill',
                path,
                'Image fill requires a URL.'
            );

            return undefined;
        }

        return {
            type: 'image',
            url,
            mode:
                context.readStringUnion(value.mode, [
                    'fill',
                    'fit',
                    'stretch'
                ]) ?? 'fill'
        } satisfies ImageFill;
    }
};

export const createDefaultFillPlugins = (): FillParserPlugin[] => [
    colorStringFillPlugin,
    colorObjectFillPlugin,
    linearGradientFillPlugin,
    imageFillPlugin
];
