/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

const FALLBACK_RANDOM = () =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const buildNodeId = (prefix: string) => {
    const token =
        globalThis.crypto?.randomUUID?.().slice(0, 8) ?? FALLBACK_RANDOM();

    return `${prefix}-${token}`;
};
