/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Check } from 'lucide-react';

import { classNames } from '../../utils/classNames';

export const InspectorCheckbox = ({
    label,
    checked
}: {
    label: string;
    checked?: boolean;
}) => (
    <span className="editor-checkbox-control flex min-w-0 items-center gap-2 text-[11px] leading-none font-medium text-[#333333]">
        <span
            className={classNames(
                'editor-check-box grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border border-[#d1d5db] bg-white',
                checked &&
                    'editor-check-box--checked border-[#111111] bg-[#111111] text-white'
            )}
        >
            {checked ? (
                <Check aria-hidden="true" size={10} strokeWidth={2.2} />
            ) : null}
        </span>
        {label}
    </span>
);
