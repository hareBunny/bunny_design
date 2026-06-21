/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createBrowserRouter } from 'react-router-dom';

const HomePage = () => {
    return (
        <main style={{ padding: 24 }}>
            <h1>妙码设计 AI 平台</h1>
            <p>桌面端基础壳已就绪。</p>
        </main>
    );
};

export const router = createBrowserRouter([
    {
        path: '/',
        element: <HomePage />
    }
]);
