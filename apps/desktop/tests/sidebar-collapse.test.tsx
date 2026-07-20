/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { fireEvent, render, screen } from '@testing-library/react';

import { MiaomaEditor } from '../renderer/components/editor/MiaomaEditor';

class TestResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

describe('editor sidebar collapse', () => {
    it('keeps the traffic-light safe area and toggle when collapsed', () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = TestResizeObserver;

        try {
            const { container } = render(<MiaomaEditor />);
            const editor = container.querySelector<HTMLElement>(
                '.miaoma-editor-screen'
            );

            fireEvent.click(
                screen.getByRole('button', { name: 'Close sidebar' })
            );

            expect(editor?.dataset.sidebarCollapsed).toBe('true');
            expect(editor?.className).toContain('grid-cols-[minmax(0,1fr)]');
            expect(
                container.querySelector('[data-region="left-sidebar"]')
            ).toBeNull();
            expect(screen.queryByLabelText('Sidebar surface')).toBeNull();
            expect(
                screen.getByRole('button', { name: 'Open sidebar' })
            ).toBeTruthy();
            expect(
                container.querySelector('.editor-main-header')?.className
            ).toContain(
                '[padding-left:calc(var(--editor-system-traffic-light-space)+20px)]'
            );
            expect(
                container.querySelector('.editor-content')?.className
            ).toContain('rounded-none');

            fireEvent.click(
                screen.getByRole('button', { name: 'Open sidebar' })
            );
            expect(editor?.dataset.sidebarCollapsed).toBe('false');
            expect(
                container.querySelector('[data-region="left-sidebar"]')
            ).not.toBeNull();
            expect(screen.getByLabelText('Sidebar surface')).toBeTruthy();
        } finally {
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });
});
