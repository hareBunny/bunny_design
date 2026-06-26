/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type MiaomaDesignDiagnosticCode =
    | 'disabled_fill'
    | 'invalid_document'
    | 'invalid_fill'
    | 'invalid_node'
    | 'unsupported_fill_type'
    | 'unsupported_node_type';

export type MiaomaDesignDiagnostic = {
    code: MiaomaDesignDiagnosticCode;
    path: string;
    message: string;
};
