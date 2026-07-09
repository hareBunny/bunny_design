/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import type { EditorDocument } from '@miaoma-design-ai/miaoma-editor-core';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { MiaomaEditor } from '../renderer/components/editor/MiaomaEditor';

const AUTOSAVE_EDITOR_DOCUMENT: EditorDocument = {
    version: '2.14',
    fileToken: 'project-1',
    children: [
        {
            id: 'frame-1',
            type: 'frame',
            name: 'Frame 1',
            x: 10,
            y: 20,
            width: 320,
            height: 180,
            clip: true,
            layout: 'none',
            fills: [
                {
                    id: 'fill-1',
                    enabled: true,
                    type: 'color',
                    color: '#ffffffff'
                }
            ],
            strokes: [],
            effects: [],
            children: []
        }
    ]
};

class TestResizeObserver {
    constructor() {}

    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

type TestMiaomaWindow = Window & {
    miaomaAPI: unknown;
};

const flushPromises = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

describe('editor project autosave', () => {
    it('periodically syncs renamed projects and canvas document changes', async () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        const updateProject = vi.fn(async (projectId, input) => ({
            success: true as const,
            project: {
                id: projectId,
                title: input.title,
                createdAt: '2026-07-12T09:00:00.000Z',
                updatedAt: '2026-07-12T09:01:00.000Z',
                document: input.document
            }
        }));

        globalThis.ResizeObserver = TestResizeObserver;
        vi.useFakeTimers();
        (window as unknown as TestMiaomaWindow).miaomaAPI = {
            ping: vi.fn(async () => ({ success: true })),
            projects: {
                list: vi.fn(),
                create: vi.fn(),
                get: vi.fn(),
                open: vi.fn(),
                update: updateProject,
                delete: vi.fn()
            }
        };

        try {
            render(
                <MiaomaEditor
                    autoSaveIntervalMs={1000}
                    initialDocument={AUTOSAVE_EDITOR_DOCUMENT}
                    initialProjectTitle="Landing"
                    projectId="project-1"
                />
            );

            await act(async () => {
                vi.advanceTimersByTime(1000);
                await flushPromises();
            });

            expect(updateProject).not.toHaveBeenCalled();

            fireEvent.change(screen.getByLabelText('Project name'), {
                target: { value: 'Renamed Landing' }
            });
            fireEvent.change(screen.getByLabelText('X position'), {
                target: { value: '42' }
            });

            await act(async () => {
                vi.advanceTimersByTime(1000);
                await flushPromises();
            });

            expect(updateProject).toHaveBeenCalledTimes(1);
            expect(updateProject).toHaveBeenLastCalledWith(
                'project-1',
                expect.objectContaining({
                    title: 'Renamed Landing',
                    document: expect.objectContaining({
                        fileToken: 'project-1',
                        children: [
                            expect.objectContaining({
                                id: 'frame-1',
                                name: 'Frame 1',
                                x: 42
                            })
                        ]
                    })
                })
            );
        } finally {
            vi.useRealTimers();
            globalThis.ResizeObserver = originalResizeObserver;
        }
    });
});
