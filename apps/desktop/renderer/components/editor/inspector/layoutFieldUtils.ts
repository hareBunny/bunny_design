/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    EditorAlignItems,
    EditorDimension,
    EditorFrameNode,
    EditorJustifyContent,
    EditorSpacing
} from '@miaoma-design-ai/miaoma-editor-core';

export type InspectorLayoutAlignment =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

export type InspectorLayoutGapMode = 'fixed' | 'between' | 'around';

export type InspectorDimensionMode = 'fixed' | 'fill' | 'hug';

type AlignmentRow = 'bottom' | 'middle' | 'top';
type AlignmentColumn = 'center' | 'left' | 'right';
type DistributedJustifyContent = Exclude<
    EditorJustifyContent,
    'space_around' | 'space_between'
>;

const DEFAULT_ALIGNMENT_ROW: AlignmentRow = 'top';
const DEFAULT_ALIGNMENT_COLUMN: AlignmentColumn = 'left';

const JUSTIFY_BY_ROW: Record<AlignmentRow, DistributedJustifyContent> = {
    top: 'start',
    middle: 'center',
    bottom: 'end'
};

const JUSTIFY_BY_COLUMN: Record<AlignmentColumn, DistributedJustifyContent> = {
    left: 'start',
    center: 'center',
    right: 'end'
};

const ROW_BY_JUSTIFY: Record<DistributedJustifyContent, AlignmentRow> = {
    start: 'top',
    center: 'middle',
    end: 'bottom'
};

const COLUMN_BY_JUSTIFY: Record<DistributedJustifyContent, AlignmentColumn> = {
    start: 'left',
    center: 'center',
    end: 'right'
};

const ALIGN_BY_COLUMN: Record<AlignmentColumn, EditorAlignItems> = {
    left: 'start',
    center: 'center',
    right: 'end'
};

const ALIGN_BY_ROW: Record<AlignmentRow, EditorAlignItems> = {
    top: 'start',
    middle: 'center',
    bottom: 'end'
};

const COLUMN_BY_ALIGN: Record<EditorAlignItems, AlignmentColumn> = {
    start: 'left',
    center: 'center',
    end: 'right',
    stretch: 'left'
};

const ROW_BY_ALIGN: Record<EditorAlignItems, AlignmentRow> = {
    start: 'top',
    center: 'middle',
    end: 'bottom',
    stretch: 'top'
};

const splitAlignment = (alignment: InspectorLayoutAlignment) => {
    const [row, column] = alignment.split('-') as [
        AlignmentRow,
        AlignmentColumn
    ];

    return { column, row };
};

const buildAlignment = (
    row: AlignmentRow,
    column: AlignmentColumn
): InspectorLayoutAlignment => `${row}-${column}` as InspectorLayoutAlignment;

export const parseFiniteNumber = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    const parsedValue = Number(trimmedValue);

    return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const getDimensionMode = (
    value: EditorDimension | undefined
): InspectorDimensionMode => {
    if (value === 'fill_container') {
        return 'fill';
    }

    if (value === 'hug_contents') {
        return 'hug';
    }

    return 'fixed';
};

export const getDimensionInputValue = (value: EditorDimension | undefined) =>
    typeof value === 'number' ? String(value) : '';

export const getGapMode = (
    justifyContent: EditorFrameNode['justifyContent']
): InspectorLayoutGapMode => {
    if (justifyContent === 'space_between') {
        return 'between';
    }

    if (justifyContent === 'space_around') {
        return 'around';
    }

    return 'fixed';
};

export const getPaddingInputs = (padding: EditorSpacing | undefined) => {
    if (padding === undefined) {
        return {
            paddingHorizontal: '0',
            paddingVertical: '0'
        };
    }

    if (typeof padding === 'number') {
        return {
            paddingHorizontal: String(padding),
            paddingVertical: String(padding)
        };
    }

    if (padding.length === 2) {
        return {
            paddingHorizontal: String(padding[1]),
            paddingVertical: String(padding[0])
        };
    }

    return {
        paddingHorizontal: String(padding[1]),
        paddingVertical: String(padding[0])
    };
};

export const getAlignmentFromFrameNode = ({
    alignItems,
    gapMode,
    justifyContent,
    layout
}: {
    alignItems: EditorFrameNode['alignItems'];
    gapMode: InspectorLayoutGapMode;
    justifyContent: EditorFrameNode['justifyContent'];
    layout: EditorFrameNode['layout'];
}): InspectorLayoutAlignment => {
    if (layout === 'vertical') {
        return buildAlignment(
            gapMode === 'fixed'
                ? ROW_BY_JUSTIFY[
                      justifyContent === 'center' || justifyContent === 'end'
                          ? justifyContent
                          : 'start'
                  ]
                : DEFAULT_ALIGNMENT_ROW,
            COLUMN_BY_ALIGN[alignItems ?? 'start']
        );
    }

    if (layout === 'horizontal') {
        return buildAlignment(
            ROW_BY_ALIGN[alignItems ?? 'start'],
            gapMode === 'fixed'
                ? COLUMN_BY_JUSTIFY[
                      justifyContent === 'center' || justifyContent === 'end'
                          ? justifyContent
                          : 'start'
                  ]
                : DEFAULT_ALIGNMENT_COLUMN
        );
    }

    return buildAlignment(DEFAULT_ALIGNMENT_ROW, DEFAULT_ALIGNMENT_COLUMN);
};

export const getLayoutAxisValues = ({
    alignment,
    gapMode,
    layout
}: {
    alignment: InspectorLayoutAlignment;
    gapMode: InspectorLayoutGapMode;
    layout: EditorFrameNode['layout'];
}) => {
    const { column, row } = splitAlignment(alignment);

    if (layout === 'vertical') {
        return {
            alignItems: ALIGN_BY_COLUMN[column],
            justifyContent:
                gapMode === 'between'
                    ? 'space_between'
                    : gapMode === 'around'
                      ? 'space_around'
                      : JUSTIFY_BY_ROW[row]
        } satisfies Pick<EditorFrameNode, 'alignItems' | 'justifyContent'>;
    }

    if (layout === 'horizontal') {
        return {
            alignItems: ALIGN_BY_ROW[row],
            justifyContent:
                gapMode === 'between'
                    ? 'space_between'
                    : gapMode === 'around'
                      ? 'space_around'
                      : JUSTIFY_BY_COLUMN[column]
        } satisfies Pick<EditorFrameNode, 'alignItems' | 'justifyContent'>;
    }

    return {
        alignItems: undefined,
        justifyContent: undefined
    } satisfies Pick<EditorFrameNode, 'alignItems' | 'justifyContent'>;
};

export const getDimensionValueFromControls = ({
    inputValue,
    mode
}: {
    inputValue: string;
    mode: InspectorDimensionMode;
}) => {
    if (mode === 'fill') {
        return 'fill_container' as const;
    }

    if (mode === 'hug') {
        return 'hug_contents' as const;
    }

    return parseFiniteNumber(inputValue);
};

export const getPaddingValueFromControls = ({
    horizontalValue,
    verticalValue
}: {
    horizontalValue: string;
    verticalValue: string;
}): number | [number, number] | null => {
    const horizontal = parseFiniteNumber(horizontalValue);
    const vertical = parseFiniteNumber(verticalValue);

    if (horizontal === null || vertical === null) {
        return null;
    }

    return horizontal === vertical
        ? vertical
        : ([vertical, horizontal] as [number, number]);
};
