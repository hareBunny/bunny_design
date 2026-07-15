/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = (fileName: string) => {
    const moduleUrl = import.meta.url;
    const moduleDirectory = moduleUrl.startsWith('file:')
        ? path.dirname(fileURLToPath(moduleUrl))
        : null;
    const runtimeProcess = process as typeof process & {
        resourcesPath?: string;
    };
    const processResourcesPath =
        typeof process !== 'undefined'
            ? runtimeProcess.resourcesPath
            : undefined;
    const candidates = [
        moduleDirectory
            ? path.resolve(moduleDirectory, '../schemas', fileName)
            : null,
        path.resolve(process.cwd(), 'schemas', fileName),
        path.resolve(
            process.cwd(),
            'packages/miaoma-design-generation/schemas',
            fileName
        ),
        path.resolve(
            process.cwd(),
            '../../packages/miaoma-design-generation/schemas',
            fileName
        ),
        path.resolve(
            process.cwd(),
            'node_modules/@miaoma-design-ai/miaoma-design-generation/schemas',
            fileName
        ),
        processResourcesPath
            ? path.join(
                  processResourcesPath,
                  'app/node_modules/@miaoma-design-ai/miaoma-design-generation/schemas',
                  fileName
              )
            : null,
        processResourcesPath
            ? path.join(processResourcesPath, 'schemas', fileName)
            : null
    ].filter((candidate): candidate is string => candidate !== null);
    const resolvedPath = candidates.find((candidate) => existsSync(candidate));

    if (!resolvedPath) {
        throw new Error(`Design generation schema was not found: ${fileName}.`);
    }

    return resolvedPath;
};

export const MIAOMA_DESIGN_GENERATION_SCHEMA_PATHS = {
    fragment: schemaPath('design-fragment.schema.json'),
    plan: schemaPath('design-plan.schema.json'),
    repair: schemaPath('design-repair.schema.json'),
    visualCheck: schemaPath('design-visual-check.schema.json'),
    variables: schemaPath('design-variables.schema.json')
} as const;
