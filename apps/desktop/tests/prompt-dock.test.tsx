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
        fireEvent.change(screen.getByLabelText('Agent prompt'), {
            target: { value: 'Create a landing page' }
        });
        fireEvent.click(
            screen.getByRole('button', { name: 'Send agent prompt' })
        );

        expect(onSubmit).toHaveBeenCalledWith('Create a landing page');
    });

    it('routes the running state to cancel instead of send', () => {
        const onCancel = vi.fn();

        render(<PromptDock isRunning onCancel={onCancel} variant="agent" />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Cancel agent generation' })
        );

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(
            screen.queryByRole('button', { name: 'Send agent prompt' })
        ).toBeNull();
    });
});
