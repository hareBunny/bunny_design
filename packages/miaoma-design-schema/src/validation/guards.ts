/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDimension } from '../schema/layout';
import type { UnknownRecord } from '../shared/types';

export const isUnknownRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const readString = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

export const readNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export const readBoolean = (value: unknown): boolean | undefined =>
    typeof value === 'boolean' ? value : undefined;

export const readStringUnion = <T extends string>(
    value: unknown,
    allowed: readonly T[]
): T | undefined =>
    typeof value === 'string' && allowed.includes(value as T)
        ? (value as T)
        : undefined;

export const readDimension = (value: unknown): MiaomaDimension | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (value === 'fill_container' || value === 'hug_contents') {
        return value;
    }

    return undefined;
};
