/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Check } from 'lucide-react';

import { classNames } from '../../utils/classNames';

export const InspectorCheckbox = ({
    label,
    checked,
    ariaLabel,
    onCheckedChange,
    disabled
}: {
    label: string;
    checked?: boolean;
    ariaLabel?: string;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
}) => (
    <button
        aria-label={ariaLabel ?? label}
        aria-checked={checked ? 'true' : 'false'}
        aria-pressed={checked ? 'true' : 'false'}
        className={classNames(
            'editor-checkbox-control flex min-w-0 cursor-default items-center gap-2 border-0 bg-transparent p-0 text-[11px] leading-none font-medium text-[#333333]',
            checked && 'editor-checkbox-control--checked text-[#111111]',
            disabled && 'opacity-60'
        )}
        data-checked={checked ? 'true' : 'false'}
        disabled={disabled}
        onClick={() => {
            if (disabled) {
                return;
            }

            onCheckedChange?.(!checked);
        }}
        role="checkbox"
        type="button"
    >
        <span
            className={classNames(
                'editor-check-box grid h-[14px] w-[14px] shrink-0 place-items-center rounded-[3px] border border-[#111111]',
                checked
                    ? 'editor-check-box--checked bg-[#111111] text-white'
                    : 'bg-white text-transparent'
            )}
        >
            {checked ? (
                <Check aria-hidden="true" size={10} strokeWidth={2.2} />
            ) : null}
        </span>
        {label}
    </button>
);
