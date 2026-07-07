/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useEffect, useLayoutEffect, useRef } from 'react';

const INLINE_TEXT_EDITOR_ACCENT = '#4592FF';

type InlineTextEditorLayout = {
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

type CanvasInlineTextEditorProps = {
    initialValue: string;
    layout: InlineTextEditorLayout;
    onCancel: () => void;
    onCommit: (value: string) => void;
};

const resizeEditorToContent = (
    element: HTMLDivElement,
    layout: InlineTextEditorLayout
) => {
    element.style.width = `${layout.width}px`;
    element.style.height = `${layout.height}px`;
    element.style.width = `${Math.max(layout.width, element.scrollWidth)}px`;
    element.style.height = `${Math.max(layout.height, element.scrollHeight)}px`;
};

const moveCaretToEnd = (element: HTMLDivElement) => {
    const selection = window.getSelection();

    if (!selection) {
        return;
    }

    const range = document.createRange();

    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
};

const insertTextAtCaret = (text: string) => {
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
        return;
    }

    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);

    range.deleteContents();
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
};

export const CanvasInlineTextEditor = ({
    initialValue,
    layout,
    onCancel,
    onCommit
}: CanvasInlineTextEditorProps) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const finishedRef = useRef(false);

    const resizeEditor = () => {
        const element = editorRef.current;

        if (!element) {
            return;
        }

        resizeEditorToContent(element, layout);
    };

    const getEditorValue = () => editorRef.current?.textContent ?? '';

    useEffect(() => {
        let cancelled = false;
        const frameId = window.requestAnimationFrame(() => {
            if (cancelled) {
                return;
            }

            const element = editorRef.current;

            if (!element) {
                return;
            }

            if (document.activeElement === element) {
                return;
            }

            element.focus();
            moveCaretToEnd(element);
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    useLayoutEffect(() => {
        resizeEditor();
    }, [layout.height, layout.width]);

    const commit = () => {
        if (finishedRef.current) {
            return;
        }

        finishedRef.current = true;
        onCommit(getEditorValue());
    };

    const cancel = () => {
        if (finishedRef.current) {
            return;
        }

        finishedRef.current = true;
        onCancel();
    };

    return (
        <div
            aria-label="Canvas inline text editor"
            className="absolute overflow-hidden rounded-[2px] border-0 bg-transparent p-0 outline-none"
            contentEditable
            onBlur={commit}
            onInput={() => {
                resizeEditor();
            }}
            onKeyDown={(event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    cancel();
                    return;
                }

                if (event.key === ' ') {
                    event.preventDefault();
                    insertTextAtCaret(' ');
                    resizeEditor();
                    return;
                }

                if (event.key === 'Enter') {
                    event.preventDefault();

                    if (event.shiftKey) {
                        insertTextAtCaret('\n');
                        resizeEditor();
                        return;
                    }

                    commit();
                }
            }}
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            ref={editorRef}
            role="textbox"
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
                textAlign: layout.textAlign,
                whiteSpace: 'pre-wrap'
            }}
            suppressContentEditableWarning
        >
            {initialValue}
        </div>
    );
};
