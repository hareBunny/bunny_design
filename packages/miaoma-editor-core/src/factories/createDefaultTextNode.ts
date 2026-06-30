/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorTextNode } from '../model/node';

import { buildNodeId } from './shared';

type CreateDefaultTextNodeInput = {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    content?: string;
};

export const createDefaultTextNode = ({
    x,
    y,
    width,
    height,
    content = ''
}: CreateDefaultTextNodeInput): EditorTextNode => ({
    id: buildNodeId('text'),
    type: 'text',
    name: 'Text',
    x,
    y,
    width,
    height,
    content,
    textGrowth: 'auto',
    textAlign: 'left',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 1.5,
    fills: [
        {
            id: 'fill-0',
            enabled: true,
            type: 'color',
            color: '#000000ff'
        }
    ],
    strokes: [],
    effects: []
});
