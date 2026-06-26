/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type {
    MiaomaInspectorGroupDefinition,
    MiaomaInspectorGroupId
} from './inspector/groups';
export { INSPECTOR_GROUPS } from './inspector/groups';
export type {
    MiaomaInspectorPropertyDefinition,
    MiaomaInspectorValueKind
} from './inspector/properties';
export {
    getNodeInspectorGroups,
    getNodeInspectorProperties,
    INSPECTOR_PROPERTY_REGISTRY
} from './inspector/registry';
export type {
    MiaomaDesignDocument,
    MiaomaDesignValidationResult,
    MiaomaStrictValidationResult
} from './schema/document';
export type {
    MiaomaColorFill,
    MiaomaFill,
    MiaomaImageFill,
    MiaomaLinearGradientFill,
    MiaomaShadowEffect
} from './schema/fill';
export type {
    MiaomaAlignItems,
    MiaomaCornerRadius,
    MiaomaDimension,
    MiaomaJustifyContent,
    MiaomaLayoutDirection,
    MiaomaSpacing
} from './schema/layout';
export type {
    MiaomaDesignNode,
    MiaomaEllipseNode,
    MiaomaFrameNode,
    MiaomaIconNode,
    MiaomaRectangleNode,
    MiaomaTextNode
} from './schema/node';
export { FILL_TYPES, LAYOUT_TYPES, NODE_TYPES } from './shared/literals';
export type { UnknownRecord } from './shared/types';
export type {
    MiaomaDesignDiagnostic,
    MiaomaDesignDiagnosticCode
} from './validation/diagnostics';
export {
    isUnknownRecord,
    readBoolean,
    readDimension,
    readNumber,
    readString,
    readStringUnion
} from './validation/guards';
export { normalizeDesignDocument } from './validation/normalize';
export {
    strictValidateDesignDocument,
    validateDesignDocument
} from './validation/validate';
