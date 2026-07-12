/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { OpenDialogOptions } from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';
import { strictValidateDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import type { MiaomaProjectImportKind } from '../../shared/projects';

import { readFigmaDesignDocument } from './figmaImport';

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
    },
    figma: {
        title: 'Import Figma',
        properties: ['openFile'],
        filters: [
            {
                name: 'Figma Files',
                extensions: ['fig']
            }
        ]
    }
} satisfies Record<MiaomaProjectImportKind, OpenDialogOptions>;

export const getProjectImportDialogOptions = (
    kind: MiaomaProjectImportKind
): OpenDialogOptions => PROJECT_IMPORT_DIALOG_OPTIONS[kind];

const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeFill = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.flatMap((item) => {
            if (isRecord(item) && item.enabled === false) {
                return [];
            }

            const normalizedItem = normalizeFill(item);

            return normalizedItem === undefined ? [] : [normalizedItem];
        });
    }

    if (!isRecord(value)) {
        return value;
    }

    return value;
};

const normalizeNode = (value: unknown): unknown => {
    if (!isRecord(value)) {
        return value;
    }

    return {
        ...value,
        fill: normalizeFill(value.fill),
        stroke: normalizeFill(value.stroke),
        children: Array.isArray(value.children)
            ? value.children.map(normalizeNode)
            : value.children
    };
};

const normalizeImportDesignInput = (input: unknown): unknown => {
    if (!isRecord(input)) {
        return input;
    }

    return {
        ...input,
        children: Array.isArray(input.children)
            ? input.children.map(normalizeNode)
            : input.children
    };
};

export const readProjectImportDocument = async (
    filePath: string
): Promise<MiaomaDesignDocument> => {
    let input: unknown;

    if (path.extname(filePath).toLowerCase() === '.fig') {
        try {
            input = await readFigmaDesignDocument(filePath);
        } catch {
            throw new Error('Selected file is not a supported Figma document.');
        }
    } else {
        try {
            input = JSON.parse(await readFile(filePath, 'utf8'));
        } catch {
            throw new Error('Selected file is not valid JSON.');
        }
    }

    const validation = strictValidateDesignDocument(
        normalizeImportDesignInput(input)
    );

    if (!validation.success) {
        throw new Error('Selected file is not a valid Miaoma design document.');
    }

    return validation.document;
};
