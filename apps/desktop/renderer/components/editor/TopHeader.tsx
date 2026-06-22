/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { CircleUser, Play } from 'lucide-react';

import logoUrl from '../../assets/brand/favicon@152.png';

export const TopHeader = () => (
    <header className="flex h-12 items-center justify-between border-b border-[#e8e8e8] px-3.5">
        <div className="flex w-[105px] items-center gap-1">
            <img
                alt="Miaoma logo"
                className="h-6 w-6 shrink-0"
                height={24}
                src={logoUrl}
                width={24}
            />
            <span className="whitespace-pre-line text-[11px] leading-[1.1] font-semibold text-black">
                妙笔 AI{'\n'}miaomadesign
            </span>
        </div>
        <div className="flex h-6 w-[86px] items-center justify-end gap-5 text-[#222222]">
            <CircleUser aria-label="User profile" size={16} strokeWidth={1.8} />
            <Play aria-label="Preview" size={16} strokeWidth={1.8} />
        </div>
    </header>
);
