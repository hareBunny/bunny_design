/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { RightInspectorFormBridge } from './inspector/RightInspectorFormBridge';
import { TopHeader } from './TopHeader';

export const RightInspector = () => (
    <aside
        className="editor-inspector col-start-2 row-span-2 row-start-1 grid h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l border-[#eaeaea] bg-white text-[12px] text-[#262626] max-[980px]:hidden"
        data-region="right-inspector"
    >
        <TopHeader />
        <div className="editor-inspector-body min-h-0 overflow-y-auto overflow-x-hidden">
            <RightInspectorFormBridge />
        </div>
    </aside>
);
