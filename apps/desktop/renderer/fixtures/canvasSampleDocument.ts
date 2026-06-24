/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import designSchemaDocument from '../../../../miaoma-design-design-schema.json';

import { COVER_DOCUMENT_FIXTURE } from './coverDocument';

const SAMPLE_DOCUMENT_GAP = 180;
const designSchemaRoot = designSchemaDocument.children[0];
const coverRoot = COVER_DOCUMENT_FIXTURE.children[0];

export const CANVAS_SAMPLE_DOCUMENT_FIXTURE = {
    version: designSchemaDocument.version,
    fileToken: 'canvas-sample-document',
    children: [
        {
            ...designSchemaRoot,
            x: 0,
            y: 0
        },
        {
            ...coverRoot,
            x: Number(designSchemaRoot.width) + SAMPLE_DOCUMENT_GAP,
            y: (Number(designSchemaRoot.height) - coverRoot.height) / 2
        }
    ]
} as const;
