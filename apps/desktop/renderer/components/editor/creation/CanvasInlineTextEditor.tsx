/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const INLINE_TEXT_EDITOR_ACCENT = '#4592FF';

type CanvasInlineTextEditorProps = {
    initialValue: string;
    layout: {
        left: number;
        top: number;
        width: number;
        height: number;
        color?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string;
        lineHeight?: number;
        textAlign?: 'center' | 'justify' | 'left' | 'right' | 'start';
    };
    onCancel: () => void;
    onCommit: (value: string) => void;
};

export const CanvasInlineTextEditor = ({
    initialValue,
    layout,
    onCancel,
    onCommit
}: CanvasInlineTextEditorProps) => {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const finishedRef = useRef(false);

    useEffect(() => {
        let cancelled = false;
        const frameId = window.requestAnimationFrame(() => {
            if (cancelled) {
                return;
            }

            const element = textareaRef.current;

            if (!element) {
                return;
            }

            if (document.activeElement === element) {
                return;
            }

            element.focus();
            element.setSelectionRange(value.length, value.length);
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    useLayoutEffect(() => {
        const element = textareaRef.current;

        if (!element) {
            return;
        }

        element.style.width = `${layout.width}px`;
        element.style.height = `${layout.height}px`;
        element.style.width = `${Math.max(layout.width, element.scrollWidth)}px`;
        element.style.height = `${Math.max(
            layout.height,
            element.scrollHeight
        )}px`;
    }, [layout.height, layout.width, value]);

    const commit = () => {
        if (finishedRef.current) {
            return;
        }

        finishedRef.current = true;
        onCommit(value);
    };

    const cancel = () => {
        if (finishedRef.current) {
            return;
        }

        finishedRef.current = true;
        onCancel();
    };

    return (
        <textarea
            aria-label="Canvas inline text editor"
            className="absolute resize-none overflow-hidden rounded-[2px] border-0 bg-transparent p-0 outline-none"
            onBlur={commit}
            onChange={(event) => {
                setValue(event.target.value);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    cancel();
                    return;
                }

                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    commit();
                }
            }}
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            ref={textareaRef}
            rows={1}
            spellCheck={false}
            style={{
                left: `${layout.left}px`,
                top: `${layout.top}px`,
                minHeight: `${layout.height}px`,
                minWidth: `${layout.width}px`,
                boxShadow: `inset 0 0 0 1px ${INLINE_TEXT_EDITOR_ACCENT}`,
                caretColor: INLINE_TEXT_EDITOR_ACCENT,
                color: layout.color,
                fontFamily: layout.fontFamily,
                fontSize:
                    layout.fontSize === undefined
                        ? undefined
                        : `${layout.fontSize}px`,
                fontWeight: layout.fontWeight,
                lineHeight:
                    layout.lineHeight === undefined
                        ? undefined
                        : `${layout.lineHeight}px`,
                textAlign: layout.textAlign
            }}
            value={value}
        />
    );
};
