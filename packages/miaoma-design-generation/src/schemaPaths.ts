/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { fileURLToPath } from 'node:url';

const schemaPath = (fileName: string) =>
    fileURLToPath(new URL(`../schemas/${fileName}`, import.meta.url));

export const MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS = {
    fragment: schemaPath('design-fragment.schema.json'),
    plan: schemaPath('design-plan.schema.json'),
    repair: schemaPath('design-repair.schema.json'),
    visualCheck: schemaPath('design-visual-check.schema.json'),
    variables: schemaPath('design-variables.schema.json')
} as const;
