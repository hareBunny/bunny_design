/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Minus } from 'lucide-react';

export const FillControl = () => (
    <div className="editor-fill-row flex h-[34px] items-center justify-between text-[#8a8a8a]">
        <div className="editor-fill-control flex h-[34px] w-[221px] shrink-0 overflow-hidden rounded-lg bg-white">
            <label className="editor-fill-color-field flex h-8 w-[144px] shrink-0 items-center gap-2 rounded-l-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2">
                <span
                    className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-[#d1d5db]"
                    style={{ background: '#f3f4f6' }}
                />
                <input
                    aria-label="Fill color"
                    className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[12px] leading-none font-medium text-[#262626] outline-none"
                    defaultValue="#f3f4f6"
                />
            </label>
            <label className="editor-fill-opacity-field flex h-8 w-[73px] shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-[#e3e3e3] bg-[#f8f8f8] px-2">
                <input
                    aria-label="Fill opacity"
                    className="w-full border-0 bg-transparent p-0 text-center font-mono text-[12px] leading-none font-medium text-[#262626] outline-none"
                    defaultValue="100%"
                />
            </label>
        </div>
        <Minus aria-hidden="true" size={14} strokeWidth={1.8} />
    </div>
);
