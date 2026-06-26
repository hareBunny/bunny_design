/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    getNodeInspectorGroups,
    getNodeInspectorProperties,
    type MiaomaInspectorGroupDefinition,
    type MiaomaInspectorPropertyDefinition
} from '@miaoma-design-ai/miaoma-design-schema';

const FRAME_NODE_TYPE = 'frame';

const frameProperties = getNodeInspectorProperties(FRAME_NODE_TYPE);

const propertyMap = new Map(
    frameProperties.map((property) => [property.id, property] as const)
);

export const FRAME_INSPECTOR_GROUPS = getNodeInspectorGroups(FRAME_NODE_TYPE);

export const FRAME_INSPECTOR_PROPERTIES = {
    x: propertyMap.get('x')!,
    y: propertyMap.get('y')!,
    rotation: propertyMap.get('rotation')!,
    width: propertyMap.get('width')!,
    height: propertyMap.get('height')!,
    clip: propertyMap.get('clip')!,
    cornerRadius: propertyMap.get('cornerRadius')!,
    fill: propertyMap.get('fill')!,
    stroke: propertyMap.get('stroke')!,
    effect: propertyMap.get('effect')!
} satisfies Record<string, MiaomaInspectorPropertyDefinition>;

export const getFrameInspectorGroup = (
    groupId: MiaomaInspectorGroupDefinition['id']
) => FRAME_INSPECTOR_GROUPS.find((group) => group.id === groupId)!;
