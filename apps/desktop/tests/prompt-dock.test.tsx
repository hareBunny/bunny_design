/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@testing-library/react';

import { PromptDock } from '../renderer/components/editor/PromptDock';

describe('agent prompt dock', () => {
    it('submits the entered prompt through the agent callback', () => {
        const onSubmit = vi.fn();

        render(<PromptDock onSubmit={onSubmit} variant="agent" />);
        const idleSendButton = screen.getByRole('button', {
            name: 'Send agent prompt'
        });
        expect(idleSendButton.hasAttribute('disabled')).toBe(true);
        expect(idleSendButton.classList.contains('bg-[#202328]')).toBe(true);
        expect(idleSendButton.classList.contains('text-white')).toBe(true);
        fireEvent.change(screen.getByLabelText('Agent prompt'), {
            target: { value: 'Create a landing page' }
        });
        const sendButton = screen.getByRole('button', {
            name: 'Send agent prompt'
        });
        expect(sendButton.classList.contains('bg-[#202328]')).toBe(true);
        expect(sendButton.classList.contains('text-white')).toBe(true);
        fireEvent.click(sendButton);

        expect(onSubmit).toHaveBeenCalledWith('Create a landing page');
    });

    it('submits with Enter and keeps Shift+Enter for line breaks', () => {
        const onSubmit = vi.fn();

        render(<PromptDock onSubmit={onSubmit} variant="agent" />);
        const input = screen.getByLabelText('Agent prompt');
        fireEvent.change(input, {
            target: { value: 'Create a dashboard' }
        });

        fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
        expect(onSubmit).not.toHaveBeenCalled();

        fireEvent.keyDown(input, { key: 'Enter' });
        expect(onSubmit).toHaveBeenCalledWith('Create a dashboard');
    });

    it('attaches a selected screenshot to the next agent prompt', async () => {
        const onReferenceImageSelect = vi.fn().mockResolvedValue({
            path: 'C:\\temp\\ui.png',
            previewUrl: 'file:///C:/temp/ui.png'
        });
        const onSubmit = vi.fn();

        render(
            <PromptDock
                onReferenceImageSelect={onReferenceImageSelect}
                onSubmit={onSubmit}
                variant="agent"
            />
        );
        fireEvent.click(
            screen.getByRole('button', { name: '截图转 UI 图' })
        );
        await screen.findByText('已添加截图');
        expect(
            screen.getByRole('img', { name: '待转换的 UI 截图' }).getAttribute('src')
        ).toBe('file:///C:/temp/ui.png');
        fireEvent.change(screen.getByLabelText('Agent prompt'), {
            target: { value: '按截图重建界面' }
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Send agent prompt' })
        );

        expect(onSubmit).toHaveBeenCalledWith(
            '按截图重建界面',
            'C:\\temp\\ui.png'
        );
    });

    it('attaches a pasted screenshot and prevents text paste', async () => {
        const onReferenceImagePaste = vi.fn().mockResolvedValue({
            path: 'C:\\temp\\pasted.png',
            previewUrl: 'file:///C:/temp/pasted.png'
        });

        render(
            <PromptDock
                onReferenceImagePaste={onReferenceImagePaste}
                variant="agent"
            />
        );
        const screenshot = new File(['screenshot'], 'screenshot.png', {
            type: 'image/png'
        });
        const preventDefault = vi.fn();

        fireEvent.paste(screen.getByLabelText('Agent prompt'), {
            clipboardData: { files: [screenshot] },
            preventDefault
        });

        await screen.findByRole('img', { name: '待转换的 UI 截图' });
        expect(onReferenceImagePaste).toHaveBeenCalledWith({
            bytes: expect.any(Uint8Array),
            extension: 'png'
        });
    });

    it('routes the running state to cancel instead of send', () => {
        const onCancel = vi.fn();

        render(<PromptDock isRunning onCancel={onCancel} variant="agent" />);
        const cancelButton = screen.getByRole('button', {
            name: 'Cancel agent generation'
        });
        expect(cancelButton.classList.contains('bg-[#f1f2f4]')).toBe(true);
        expect(cancelButton.classList.contains('text-[#b7b8bf]')).toBe(true);
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByRole('button', { name: 'Send agent prompt' })
        ).toBeNull();
    });
});
