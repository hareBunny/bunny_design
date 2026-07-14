/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export {
    parseMiaomaDesignFragment,
    parseMiaomaDesignGenerationPlan,
    parseMiaomaDesignVariablesDraft
} from './contracts';
export {
    appendMiaomaDesignFragment,
    applyMiaomaDesignVariables
} from './documentAssembly';
export { createMiaomaDesignGenerationOrchestrator } from './orchestrator';
export type {
    MiaomaDesignGenerationExecution,
    MiaomaDesignGenerationOrchestrator,
    MiaomaDesignGenerationOrchestratorOptions,
    MiaomaDesignGenerationResult,
    MiaomaDesignGenerationStartInput
} from './orchestratorTypes';
export { MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS } from './schemaPaths';
export {
    MIAOMA_DESIGN_GENERATION_FORMAT_VERSION,
    type MiaomaDesignDocumentState,
    type MiaomaDesignFragment,
    MiaomaDesignGenerationError,
    type MiaomaDesignGenerationErrorCode,
    type MiaomaDesignGenerationPlan,
    type MiaomaDesignVariablesDraft
} from './types';
