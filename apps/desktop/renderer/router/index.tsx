/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createBrowserRouter } from 'react-router-dom';

import { MiaomaEditorScreen } from '../pages/MiaomaEditorScreen';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MiaomaEditorScreen />
    }
]);
