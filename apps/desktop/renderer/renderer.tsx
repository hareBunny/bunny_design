/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createRoot } from 'react-dom/client';

import './index.css';

import { App } from './App';

const root = createRoot(document.getElementById('app') as HTMLElement);
root.render(<App />);
