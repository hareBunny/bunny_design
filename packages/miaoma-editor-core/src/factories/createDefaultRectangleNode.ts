/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorRectangleNode } from '../model/node';

import { buildNodeId } from './shared';

type CreateDefaultRectangleNodeInput = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
};

export const createDefaultRectangleNode = ({
    x,
    y,
    width,
    height
}: CreateDefaultRectangleNodeInput): EditorRectangleNode => ({
    id: buildNodeId('rectangle'),
    type: 'rectangle',
    name: 'Rectangle',
    x,
    y,
    width,
    height,
    cornerRadius: 0,
    fills: [
        {
            id: 'fill-0',
            enabled: true,
            type: 'color',
            color: '#d9d9d9ff'
        }
    ],
    strokes: [],
    effects: []
});
