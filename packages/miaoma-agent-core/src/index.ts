/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type {
    MiaomaAgentActivity,
    MiaomaAgentActivityKind,
    MiaomaAgentActivityOutput
} from './activity';
export { MIAOMA_AGENT_ACTIVITY_LABELS } from './activity';
export type {
    MiaomaAgentDefinition,
    MiaomaAgentId,
    MiaomaCollaboratorAgentId,
    MiaomaCoordinatorAgentId
} from './agents';
export {
    isMiaomaCollaboratorAgentId,
    MIAOMA_AGENT_ROSTER,
    MIAOMA_COLLABORATOR_AGENT_IDS,
    MIAOMA_COORDINATOR_AGENT_ID
} from './agents';
export type {
    MiaomaAgentJsonObject,
    MiaomaAgentJsonPrimitive,
    MiaomaAgentJsonValue
} from './json';
export type {
    MiaomaDesignRegion,
    MiaomaGenerationAssignment,
    MiaomaGenerationRun,
    MiaomaGenerationRunStatus
} from './run';
export {
    createMiaomaGenerationRun,
    isMiaomaGenerationRunTransitionAllowed,
    MIAOMA_GENERATION_RUN_FORMAT_VERSION,
    MIAOMA_MAX_PARALLEL_COLLABORATORS,
    validateMiaomaGenerationAssignments
} from './run';
