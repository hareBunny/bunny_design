/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { EditorIconButtonConfig } from '../../types/editor';
import { classNames } from '../../utils/classNames';

export const EditorIconButton = ({
    icon: Icon,
    label,
    active,
    compact,
    disabled,
    onClick
}: EditorIconButtonConfig) => (
    <button
        aria-label={label}
        className={classNames(
            'editor-icon-button inline-flex h-7 w-7 shrink-0 cursor-default items-center justify-center rounded-[10px] border-0 bg-transparent p-0 text-[#242424]',
            active &&
                'editor-icon-button--active h-8 border border-[#eaebed] bg-[#f6f6f6] shadow-[0_1px_6px_#00000012]',
            compact && 'editor-icon-button--compact h-4',
            disabled && 'opacity-60'
        )}
        disabled={disabled}
        onClick={onClick}
        title={label}
        type="button"
    >
        <Icon aria-hidden="true" size={16} strokeWidth={1.9} />
    </button>
);
