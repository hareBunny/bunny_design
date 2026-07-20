/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createHashRouter } from 'react-router-dom';

import { DashboardScreen } from '../pages/DashboardScreen';
import { McpCaptureScreen } from '../pages/McpCaptureScreen';
import { MiaomaEditorScreen } from '../pages/MiaomaEditorScreen';

export const router = createHashRouter([
    {
        path: '/',
        element: <DashboardScreen />
    },
    {
        path: '/editor',
        element: <MiaomaEditorScreen />
    },
    {
        path: '/mcp-capture',
        element: <McpCaptureScreen />
    }
]);
