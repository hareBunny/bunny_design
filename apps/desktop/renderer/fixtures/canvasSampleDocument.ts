/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    type MiaomaDesignDocument,
    type MiaomaFrameNode,
    strictValidateDesignDocument
} from '@miaoma-design-ai/miaoma-design-schema';

import designSchemaDocument from '../../../../miaoma-design-design-schema.json';

import { COVER_DOCUMENT_FIXTURE } from './coverDocument';

const SAMPLE_DOCUMENT_GAP = 180;
const validatedDesignSchemaDocument =
    strictValidateDesignDocument(designSchemaDocument);

if (!validatedDesignSchemaDocument.success) {
    throw new Error(
        JSON.stringify(validatedDesignSchemaDocument.diagnostics, null, 2)
    );
}

const designSchemaRoot = validatedDesignSchemaDocument.document
    .children[0] as MiaomaFrameNode;
const coverRoot = COVER_DOCUMENT_FIXTURE.children[0] as MiaomaFrameNode;
const designSchemaRootWidth =
    typeof designSchemaRoot.width === 'number' ? designSchemaRoot.width : 0;
const designSchemaRootHeight =
    typeof designSchemaRoot.height === 'number' ? designSchemaRoot.height : 0;
const coverRootHeight =
    typeof coverRoot.height === 'number' ? coverRoot.height : 0;

export const CANVAS_SAMPLE_DESIGN_DOCUMENT: MiaomaDesignDocument = {
    version: validatedDesignSchemaDocument.document.version,
    fileToken: 'canvas-sample-document',
    children: [
        {
            ...designSchemaRoot,
            x: 0,
            y: 0
        },
        {
            ...coverRoot,
            x: designSchemaRootWidth + SAMPLE_DOCUMENT_GAP,
            y: (designSchemaRootHeight - coverRootHeight) / 2
        }
    ]
};
