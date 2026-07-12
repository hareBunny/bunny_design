/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export const MIAOMA_COORDINATOR_AGENT_ID = 'miaoma' as const;

export const MIAOMA_COLLABORATOR_AGENT_IDS = [
    'newton',
    'tesla',
    'maxwell',
    'curie',
    'faraday'
] as const;

export type MiaomaCoordinatorAgentId = typeof MIAOMA_COORDINATOR_AGENT_ID;

export type MiaomaCollaboratorAgentId =
    (typeof MIAOMA_COLLABORATOR_AGENT_IDS)[number];

export type MiaomaAgentId =
    | MiaomaCollaboratorAgentId
    | MiaomaCoordinatorAgentId;

export type MiaomaAgentDefinition = {
    id: MiaomaAgentId;
    name: string;
    role: 'collaborator' | 'coordinator';
    color: string;
};

export const MIAOMA_AGENT_ROSTER = [
    {
        id: MIAOMA_COORDINATOR_AGENT_ID,
        name: 'miaoma',
        role: 'coordinator',
        color: '#2563eb'
    },
    {
        id: 'newton',
        name: 'Newton',
        role: 'collaborator',
        color: '#12b76a'
    },
    {
        id: 'tesla',
        name: 'Tesla',
        role: 'collaborator',
        color: '#f79009'
    },
    {
        id: 'maxwell',
        name: 'Maxwell',
        role: 'collaborator',
        color: '#7a5af8'
    },
    {
        id: 'curie',
        name: 'Curie',
        role: 'collaborator',
        color: '#ee46bc'
    },
    {
        id: 'faraday',
        name: 'Faraday',
        role: 'collaborator',
        color: '#06aed4'
    }
] as const satisfies readonly MiaomaAgentDefinition[];

export const isMiaomaCollaboratorAgentId = (
    value: string
): value is MiaomaCollaboratorAgentId =>
    MIAOMA_COLLABORATOR_AGENT_IDS.includes(value as MiaomaCollaboratorAgentId);
