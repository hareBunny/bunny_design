/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import path from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
    resolve: {
        alias: {
            '@miaoma-design-ai/miaoma-design-schema': path.resolve(
                __dirname,
                '../../packages/miaoma-design-schema/src'
            ),
            '@miaoma-design-ai/miaoma-mcp': path.resolve(
                __dirname,
                '../../packages/miaoma-mcp/src'
            )
        }
    }
});
