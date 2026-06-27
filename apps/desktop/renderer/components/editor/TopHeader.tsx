/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { CircleUser, Play } from 'lucide-react';

import logoUrl from '../../assets/brand/favicon@152.png';
import { classNames } from '../../utils/classNames';

type TopHeaderProps = {
    muted?: boolean;
};

export const TopHeader = ({ muted = false }: TopHeaderProps) => (
    <header
        className={classNames(
            'flex h-12 items-center justify-between border-b border-[#e8e8e8] px-3.5',
            muted ? 'bg-[#f6f6f6] text-[#6b7280]' : 'bg-white text-[#222222]'
        )}
        data-region="right-inspector-header"
        data-tone={muted ? 'muted' : 'default'}
    >
        <div className="flex w-[105px] items-center gap-1">
            <img
                alt="Miaoma logo"
                className="h-6 w-6 shrink-0"
                height={24}
                src={logoUrl}
                width={24}
            />
            <span
                className={classNames(
                    'whitespace-pre-line text-[11px] leading-[1.1] font-semibold',
                    muted ? 'text-[#6b7280]' : 'text-black'
                )}
            >
                妙笔 AI{'\n'}miaomadesign
            </span>
        </div>
        <div
            className={classNames(
                'flex h-6 w-[86px] items-center justify-end gap-5',
                muted ? 'text-[#6b7280]' : 'text-[#222222]'
            )}
        >
            <CircleUser aria-label="User profile" size={16} strokeWidth={1.8} />
            <Play aria-label="Preview" size={16} strokeWidth={1.8} />
        </div>
    </header>
);
