/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { type LucideIcon, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

import { classNames } from '../../utils/classNames';

type FillControlProps = {
    value: string;
    opacity: string;
    valueAriaLabel: string;
    opacityAriaLabel: string;
    removeAriaLabel: string;
    preview?: ReactNode;
    disabled?: boolean;
    valueDisabled?: boolean;
    opacityDisabled?: boolean;
    onValueChange?: (value: string) => void;
    onOpacityChange?: (value: string) => void;
    onRemove?: () => void;
    startIcon?: LucideIcon;
    extraControl?: ReactNode;
};

const ControlInput = ({
    ariaLabel,
    centered,
    disabled,
    onChange,
    value
}: {
    ariaLabel: string;
    centered?: boolean;
    disabled?: boolean;
    onChange?: (value: string) => void;
    value: string;
}) => (
    <input
        aria-label={ariaLabel}
        className={classNames(
            'min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-[12px] leading-none font-medium text-[#262626] outline-none',
            centered && 'text-center'
        )}
        disabled={disabled}
        onChange={(event) => {
            onChange?.(event.target.value);
        }}
        readOnly={disabled || onChange === undefined}
        value={value}
    />
);

export const FillControl = ({
    value,
    opacity,
    valueAriaLabel,
    opacityAriaLabel,
    removeAriaLabel,
    preview,
    disabled,
    valueDisabled,
    opacityDisabled,
    onValueChange,
    onOpacityChange,
    onRemove,
    startIcon: StartIcon,
    extraControl
}: FillControlProps) => (
    <div
        className={classNames(
            'editor-fill-row flex min-h-[34px] items-start justify-between gap-2 text-[#8a8a8a]',
            disabled && 'opacity-60'
        )}
    >
        <div className="grid min-w-0 flex-1 gap-1.5">
            <div className="editor-fill-control flex h-[34px] min-w-0 shrink-0 overflow-hidden rounded-lg bg-white">
                <label className="editor-fill-color-field flex h-8 min-w-0 flex-1 items-center gap-2 rounded-l-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2">
                    {preview}
                    {StartIcon ? (
                        <StartIcon
                            aria-hidden="true"
                            className="shrink-0 text-[#9ca3af]"
                            size={14}
                            strokeWidth={1.7}
                        />
                    ) : null}
                    <ControlInput
                        ariaLabel={valueAriaLabel}
                        disabled={valueDisabled}
                        onChange={onValueChange}
                        value={value}
                    />
                </label>
                <label className="editor-fill-opacity-field flex h-8 w-[73px] shrink-0 items-center justify-center rounded-r-lg border border-l-0 border-[#e3e3e3] bg-[#f8f8f8] px-2">
                    <ControlInput
                        ariaLabel={opacityAriaLabel}
                        centered
                        disabled={opacityDisabled}
                        onChange={onOpacityChange}
                        value={opacity}
                    />
                </label>
            </div>
            {extraControl}
        </div>
        <button
            aria-label={removeAriaLabel}
            className="grid h-[34px] w-[18px] shrink-0 cursor-default place-items-center border-0 bg-transparent p-0 text-[#8a8a8a]"
            disabled={disabled}
            onClick={onRemove}
            type="button"
        >
            <Minus aria-hidden="true" size={14} strokeWidth={1.8} />
        </button>
    </div>
);
