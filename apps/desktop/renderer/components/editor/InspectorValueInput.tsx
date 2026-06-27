/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { InspectorValueInputProps } from '../../types/editor';
import { classNames } from '../../utils/classNames';

export const InspectorValueInput = ({
    value,
    ariaLabel,
    label,
    startIcon: StartIcon,
    swatch,
    unit,
    size = 'default',
    className,
    inputClassName,
    disabled,
    onValueChange
}: InspectorValueInputProps) => (
    <label
        className={classNames(
            'editor-inspector-value-input flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2 text-[#262626] [&_svg]:shrink-0 [&_svg]:text-[#9ca3af]',
            size === 'default' ? 'h-8' : 'h-6 rounded-md',
            disabled && 'opacity-60',
            className
        )}
    >
        {label ? (
            <span className="editor-inspector-value-input-label shrink-0 text-[11px] leading-none font-medium text-[#8a8a8a]">
                {label}
            </span>
        ) : null}
        {swatch ? (
            <span
                className="editor-inspector-value-input-swatch h-3.5 w-3.5 shrink-0 rounded-[3px] border border-[#d1d5db]"
                style={{ background: swatch }}
            />
        ) : null}
        {StartIcon ? (
            <StartIcon aria-hidden="true" size={14} strokeWidth={1.7} />
        ) : null}
        <input
            aria-label={ariaLabel}
            className={classNames(
                'min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[12px] leading-none font-medium text-[#262626] outline-none',
                inputClassName
            )}
            disabled={disabled}
            onChange={(event) => {
                onValueChange?.(event.target.value);
            }}
            readOnly={disabled || onValueChange === undefined}
            value={value}
        />
        {unit ? (
            <span className="editor-inspector-value-input-unit shrink-0 text-[11px] leading-none font-medium text-[#8a8a8a]">
                {unit}
            </span>
        ) : null}
    </label>
);
