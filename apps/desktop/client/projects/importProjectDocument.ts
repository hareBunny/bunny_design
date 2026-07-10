/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { OpenDialogOptions } from 'electron';
import { readFile } from 'node:fs/promises';

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';
import { strictValidateDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import type { MiaomaProjectImportKind } from '../../shared/projects';

type UnknownRecord = Record<string, unknown>;

const PROJECT_IMPORT_DIALOG_OPTIONS = {
    json: {
        title: 'Import JSON',
        properties: ['openFile'],
        filters: [
            {
                name: 'Miaoma Design JSON',
                extensions: ['json']
            }
        ]
    },
    pencil: {
        title: 'Import Pencil',
        properties: ['openFile'],
        filters: [
            {
                name: 'Pencil Files',
                extensions: ['pen']
            }
        ]
    }
} satisfies Record<MiaomaProjectImportKind, OpenDialogOptions>;

export const getProjectImportDialogOptions = (
    kind: MiaomaProjectImportKind
): OpenDialogOptions => PROJECT_IMPORT_DIALOG_OPTIONS[kind];

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const readVariables = (input: unknown): UnknownRecord => {
    if (!isRecord(input) || !isRecord(input.variables)) {
        return {};
    }

    return input.variables;
};

const resolveStringToken = (value: string, variables: UnknownRecord) => {
    if (!value.startsWith('$')) {
        return value;
    }

    const variable = variables[value.slice(1)];

    if (!isRecord(variable) || variable.type !== 'color') {
        return value;
    }

    return typeof variable.value === 'string' ? variable.value : value;
};

const normalizeFill = (value: unknown, variables: UnknownRecord): unknown => {
    if (Array.isArray(value)) {
        return value.flatMap((item) => {
            if (isRecord(item) && item.enabled === false) {
                return [];
            }

            const normalizedItem = normalizeFill(item, variables);

            return normalizedItem === undefined ? [] : [normalizedItem];
        });
    }

    if (typeof value === 'string') {
        return {
            type: 'color',
            color: resolveStringToken(value, variables)
        };
    }

    if (!isRecord(value)) {
        return value;
    }

    if (value.type === 'color' && typeof value.color === 'string') {
        return {
            ...value,
            color: resolveStringToken(value.color, variables)
        };
    }

    if (value.type === 'gradient' && Array.isArray(value.colors)) {
        return {
            ...value,
            colors: value.colors.map((stop) =>
                isRecord(stop) && typeof stop.color === 'string'
                    ? {
                          ...stop,
                          color: resolveStringToken(stop.color, variables)
                      }
                    : stop
            )
        };
    }

    return value;
};

const normalizeNode = (value: unknown, variables: UnknownRecord): unknown => {
    if (!isRecord(value)) {
        return value;
    }

    return {
        ...value,
        fill: normalizeFill(value.fill, variables),
        stroke: normalizeFill(value.stroke, variables),
        children: Array.isArray(value.children)
            ? value.children.map((child) => normalizeNode(child, variables))
            : value.children
    };
};

const normalizeImportDesignInput = (input: unknown): unknown => {
    if (!isRecord(input)) {
        return input;
    }

    const variables = readVariables(input);

    return {
        ...input,
        children: Array.isArray(input.children)
            ? input.children.map((child) => normalizeNode(child, variables))
            : input.children
    };
};

export const readProjectImportDocument = async (
    filePath: string
): Promise<MiaomaDesignDocument> => {
    let input: unknown;

    try {
        input = JSON.parse(await readFile(filePath, 'utf8'));
    } catch {
        throw new Error('Selected file is not valid JSON.');
    }

    const validation = strictValidateDesignDocument(
        normalizeImportDesignInput(input)
    );

    if (!validation.success) {
        throw new Error('Selected file is not a valid Miaoma design document.');
    }

    return validation.document;
};
