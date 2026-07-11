/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DashboardScreen } from '../renderer/pages/DashboardScreen';
import type {
    MiaomaProjectListResult,
    MiaomaProjectResult,
    MiaomaProjectSummary
} from '../shared/projects';

const sampleProject: MiaomaProjectSummary = {
    id: 'project-1',
    title: '妙码官网首页',
    createdAt: '2026-07-12T09:00:00.000Z',
    updatedAt: '2026-07-12T10:30:00.000Z',
    document: {
        version: '2.14',
        fileToken: 'project-1',
        children: [
            {
                id: 'frame-1',
                type: 'frame',
                name: 'Home',
                x: 0,
                y: 0,
                width: 1440,
                height: 900,
                clip: true,
                layout: 'none',
                fill: {
                    type: 'color',
                    color: '#f8fafcff'
                },
                children: [
                    {
                        id: 'text-1',
                        type: 'text',
                        name: 'Hero',
                        x: 80,
                        y: 80,
                        content: 'Miaoma Design',
                        fontSize: 48,
                        fill: {
                            type: 'color',
                            color: '#111827ff'
                        }
                    }
                ]
            }
        ]
    }
};

const updatedSampleProject: MiaomaProjectSummary = {
    ...sampleProject,
    title: '更新后的官网首页',
    updatedAt: '2026-07-12T11:20:00.000Z',
    document: {
        ...sampleProject.document,
        children: [
            {
                ...sampleProject.document.children[0],
                name: 'Updated Home',
                children:
                    sampleProject.document.children[0]?.type === 'frame'
                        ? [
                              {
                                  id: 'text-1',
                                  type: 'text',
                                  name: 'Hero',
                                  x: 160,
                                  y: 96,
                                  content: 'Updated Miaoma Design',
                                  fontSize: 56,
                                  fill: {
                                      type: 'color',
                                      color: '#111827ff'
                                  }
                              }
                          ]
                        : []
            }
        ]
    }
};

const listProjects = vi.fn<() => Promise<MiaomaProjectListResult>>();
const createProject =
    vi.fn<() => Promise<MiaomaProjectResult<MiaomaProjectSummary>>>();
const importFromFile =
    vi.fn<
        (
            kind: string
        ) => Promise<
            | MiaomaProjectResult<MiaomaProjectSummary>
            | { success: false; canceled: true }
        >
    >();
const openProject =
    vi.fn<
        (
            projectId: string
        ) => Promise<MiaomaProjectResult<MiaomaProjectSummary>>
    >();
const deleteProject =
    vi.fn<
        (projectId: string) => Promise<{ success: boolean; error?: string }>
    >();

beforeEach(() => {
    listProjects.mockReset();
    createProject.mockReset();
    importFromFile.mockReset();
    openProject.mockReset();
    deleteProject.mockReset();

    const miaomaAPI = {
        ping: vi.fn(async () => ({ success: true })),
        projects: {
            list: listProjects,
            create: createProject,
            importFromFile,
            get: vi.fn(),
            open: openProject,
            update: vi.fn(),
            delete: deleteProject
        }
    };
    window.miaomaAPI = miaomaAPI as typeof window.miaomaAPI;
});

describe('DashboardScreen', () => {
    it('renders a full-width Dashboard heading and an empty state when there are no local projects', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: []
        });

        const { container } = render(<DashboardScreen />);

        expect(
            await screen.findByRole('heading', {
                name: '妙笔AI - Dashboard'
            })
        ).toBeTruthy();
        expect(screen.getByAltText('Miaoma logo')).toBeTruthy();
        const content = container.querySelector('main > div');

        expect(content?.className).not.toContain('mx-auto');
        expect(content?.className).not.toContain('max-w-');
        expect(content?.className).toContain('px-5');
        expect(
            screen.getByRole('button', { name: 'New Project' }).className
        ).toContain('bg-[#111827]');
        expect(
            screen.getByRole('button', { name: 'New Project' }).className
        ).toContain('h-8');
        expect(
            screen.getByRole('button', { name: 'New Project' }).className
        ).toContain('rounded-xl');
        expect(
            screen.queryByRole('button', { name: 'From Template' })
        ).toBeNull();
        expect(screen.getByRole('button', { name: 'Import' })).toBeTruthy();
        const headerControls = screen
            .getByRole('banner')
            .querySelector('.right-0.left-0');
        const headerBrand = screen
            .getByRole('banner')
            .querySelector('[data-dashboard-brand="true"]');

        expect(headerControls?.className).toContain('top-[10px]');
        expect(headerBrand?.className).toContain(
            '[left:calc(var(--editor-system-traffic-light-space)+30px)]'
        );
        expect(headerBrand?.className).toContain('top-[10px]');
        expect(
            screen.getByRole('heading', { name: '妙笔AI - Dashboard' })
                .className
        ).toContain('text-[15px]');
        expect(screen.getByRole('banner').className).toContain(
            '[-webkit-app-region:drag]'
        );
        expect(screen.getByRole('banner').className).toContain('min-h-[56px]');
        expect(await screen.findByText('No local projects yet')).toBeTruthy();
    });

    it('renders project cards with preview metadata and opens a project on click', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: [sampleProject]
        });
        openProject.mockResolvedValue({
            success: true,
            project: sampleProject
        });

        render(<DashboardScreen />);

        expect(
            await screen.findByRole('button', { name: 'Open 妙码官网首页' })
        ).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Open 妙码官网首页' }).className
        ).toContain('rounded-xl');
        const grid = screen
            .getByRole('button', { name: 'Open 妙码官网首页' })
            .closest('section');

        expect(grid?.className).toContain('grid-cols-2');
        expect(grid?.className).toContain('min-[1000px]:grid-cols-3');
        expect(grid?.className).toContain('min-[1400px]:grid-cols-4');
        expect(grid?.className).toContain('gap-5');
        const previewContent = document.querySelector<HTMLElement>(
            '[data-dashboard-preview-content="true"]'
        );

        expect(previewContent?.className).not.toContain('bg-white');
        expect(previewContent?.className).not.toContain('border');
        expect(previewContent?.className).toContain('absolute');
        expect(previewContent?.style.transform).toContain(
            'translate(-50%, -50%) scale(0.19444444444444445)'
        );
        expect(screen.getByText('妙码官网首页')).toBeTruthy();
        expect(screen.getByText('Edited 2026-07-12 18:30')).toBeTruthy();
        expect(screen.getByText('Miaoma Design')).toBeTruthy();

        await userEvent.click(
            screen.getByRole('button', { name: 'Open 妙码官网首页' })
        );

        await waitFor(() => {
            expect(openProject).toHaveBeenCalledWith('project-1');
        });
    });

    it('refreshes project previews and metadata when the Dashboard window receives focus', async () => {
        listProjects
            .mockResolvedValueOnce({
                success: true,
                projects: [sampleProject]
            })
            .mockResolvedValueOnce({
                success: true,
                projects: [updatedSampleProject]
            });

        render(<DashboardScreen />);

        expect(await screen.findByText('妙码官网首页')).toBeTruthy();

        window.dispatchEvent(new Event('focus'));

        await waitFor(() => {
            expect(listProjects).toHaveBeenCalledTimes(2);
        });
        expect(await screen.findByText('更新后的官网首页')).toBeTruthy();
        expect(screen.getByText('Edited 2026-07-12 19:20')).toBeTruthy();
        expect(screen.getByText('Updated Miaoma Design')).toBeTruthy();
    });

    it('creates a new project from the New Project button', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: []
        });
        createProject.mockResolvedValue({
            success: true,
            project: sampleProject
        });

        render(<DashboardScreen />);

        await userEvent.click(
            await screen.findByRole('button', { name: 'New Project' })
        );

        await waitFor(() => {
            expect(createProject).toHaveBeenCalledTimes(1);
        });
    });

    it('imports local JSON, Pencil, and Figma files from the Dashboard dropdown', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: []
        });
        importFromFile.mockResolvedValue({
            success: true,
            project: sampleProject
        });

        render(<DashboardScreen />);

        await userEvent.click(
            await screen.findByRole('button', { name: 'Import' })
        );

        expect(
            screen.getAllByRole('menuitem').map((item) => item.textContent)
        ).toEqual([
            'Import JSON',
            'Import Pencil (.pen)',
            'Import Figma (.fig)'
        ]);

        await userEvent.click(
            screen.getByRole('menuitem', { name: 'Import JSON' })
        );
        await waitFor(() => {
            expect(importFromFile).toHaveBeenCalledWith('json');
        });
        expect(await screen.findByText('妙码官网首页')).toBeTruthy();

        await userEvent.click(screen.getByRole('button', { name: 'Import' }));
        await userEvent.click(
            screen.getByRole('menuitem', { name: 'Import Pencil (.pen)' })
        );
        await waitFor(() => {
            expect(importFromFile).toHaveBeenCalledWith('pencil');
        });

        await userEvent.click(screen.getByRole('button', { name: 'Import' }));
        await userEvent.click(
            screen.getByRole('menuitem', { name: 'Import Figma (.fig)' })
        );
        await waitFor(() => {
            expect(importFromFile).toHaveBeenCalledWith('figma');
        });

        expect(importFromFile).toHaveBeenCalledTimes(3);
    });

    it('does not show an error when a project import is canceled', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: []
        });
        importFromFile.mockResolvedValue({
            success: false,
            canceled: true
        });

        render(<DashboardScreen />);

        await userEvent.click(
            await screen.findByRole('button', { name: 'Import' })
        );
        await userEvent.click(
            screen.getByRole('menuitem', { name: 'Import JSON' })
        );

        await waitFor(() => {
            expect(importFromFile).toHaveBeenCalledWith('json');
        });
        expect(screen.queryByText('Unable to import project.')).toBeNull();
        expect(await screen.findByText('No local projects yet')).toBeTruthy();
    });

    it('shows an error when a project import fails', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: []
        });
        importFromFile.mockResolvedValue({
            success: false,
            error: 'Selected file is not a valid Miaoma design document.'
        });

        render(<DashboardScreen />);

        await userEvent.click(
            await screen.findByRole('button', { name: 'Import' })
        );
        await userEvent.click(
            screen.getByRole('menuitem', { name: 'Import JSON' })
        );

        expect(
            await screen.findByText(
                'Selected file is not a valid Miaoma design document.'
            )
        ).toBeTruthy();
    });

    it('opens a custom delete confirmation dialog and removes a project after confirmation', async () => {
        listProjects.mockResolvedValue({
            success: true,
            projects: [sampleProject]
        });
        deleteProject.mockResolvedValue({
            success: true
        });

        render(<DashboardScreen />);

        await userEvent.click(
            await screen.findByRole('button', { name: 'Delete 妙码官网首页' })
        );

        expect(
            await screen.findByRole('dialog', { name: 'Delete project' })
        ).toBeTruthy();
        expect(
            screen.getByText('This will permanently remove this local project.')
        ).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Cancel' }).className
        ).toContain('h-8');
        expect(
            screen.getByRole('button', { name: 'Cancel' }).className
        ).toContain('rounded-xl');
        expect(
            screen.getByRole('button', { name: 'Delete' }).className
        ).toContain('h-8');
        expect(
            screen.getByRole('button', { name: 'Delete' }).className
        ).toContain('rounded-xl');

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(deleteProject).toHaveBeenCalledWith('project-1');
        });
        await waitFor(() => {
            expect(screen.queryByText('妙码官网首页')).toBeNull();
        });
    });
});
