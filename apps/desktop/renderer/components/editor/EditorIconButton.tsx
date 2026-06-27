/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type {
    EditorIconButtonConfig,
    EditorIconButtonVariant
} from '../../types/editor';
import { classNames } from '../../utils/classNames';

type EditorIconButtonProps = EditorIconButtonConfig & {
    variant?: EditorIconButtonVariant;
};

export const EditorIconButton = ({
    icon: Icon,
    label,
    active,
    compact,
    disabled,
    onClick,
    variant = 'default'
}: EditorIconButtonProps) => (
    <button
        aria-label={label}
        className={classNames(
            'editor-icon-button inline-flex shrink-0 cursor-default items-center justify-center p-0',
            variant === 'default' &&
                'h-7 w-7 rounded-[10px] border-0 bg-transparent text-[#242424]',
            variant === 'default' &&
                active &&
                'editor-icon-button--active h-8 border border-[#eaebed] bg-[#f6f6f6] shadow-[0_1px_6px_#00000012]',
            variant === 'toolbar' &&
                'editor-icon-button--toolbar h-[30px] w-[30px] rounded-[8px] border border-[#e5e7eb] bg-[#f7f8fa] text-[#1a1a1a] shadow-[0_1px_4px_#1118270d]',
            compact && 'editor-icon-button--compact h-4',
            disabled && 'opacity-60'
        )}
        disabled={disabled}
        onClick={onClick}
        title={label}
        type="button"
    >
        <Icon
            aria-hidden="true"
            size={variant === 'toolbar' ? 14 : 16}
            strokeWidth={variant === 'toolbar' ? 1.8 : 1.9}
        />
    </button>
);
