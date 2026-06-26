/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignDiagnostic } from '../validation/diagnostics';

import type { MiaomaDesignNode } from './node';

export type MiaomaDesignDocument = {
    version: string;
    fileToken?: string;
    children: MiaomaDesignNode[];
};

export type MiaomaDesignValidationResult = {
    document: MiaomaDesignDocument;
    diagnostics: MiaomaDesignDiagnostic[];
};

export type MiaomaStrictValidationSuccess = {
    success: true;
    document: MiaomaDesignDocument;
    diagnostics: [];
};

export type MiaomaStrictValidationFailure = {
    success: false;
    diagnostics: MiaomaDesignDiagnostic[];
};

export type MiaomaStrictValidationResult =
    | MiaomaStrictValidationSuccess
    | MiaomaStrictValidationFailure;
