/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorFrameNode } from '../model/node';

import { buildNodeId } from './shared';

type CreateDefaultFrameNodeInput = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
};

export const createDefaultFrameNode = ({
    x,
    y,
    width,
    height
}: CreateDefaultFrameNodeInput): EditorFrameNode => ({
    id: buildNodeId('frame'),
    type: 'frame',
    name: 'Frame',
    x,
    y,
    width,
    height,
    layout: 'none',
    fills: [],
    strokes: [],
    effects: [],
    children: []
});
