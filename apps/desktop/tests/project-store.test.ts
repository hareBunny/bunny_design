/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { createProjectStore } from '../client/projects/projectStore';
import type { MiaomaProjectFile } from '../shared/projects';
import {
    MIAOMA_PROJECT_FILE_EXTENSION,
    MIAOMA_PROJECT_FORMAT_VERSION
} from '../shared/projects';

const createTempProjectsDirectory = async () =>
    mkdtemp(path.join(os.tmpdir(), 'miaoma-projects-'));

const cleanupTempDirectory = async (directory: string) => {
    await rm(directory, { force: true, recursive: true });
};

const createStoredProject = ({
    id,
    title,
    updatedAt
}: {
    id: string;
    title: string;
    updatedAt: string;
}): MiaomaProjectFile => ({
    formatVersion: MIAOMA_PROJECT_FORMAT_VERSION,
    id,
    title,
    createdAt: '2026-07-12T00:00:00.000Z',
    updatedAt,
    document: {
        version: '2.14',
        fileToken: id,
        children: [
            {
                id: `${id}-frame`,
                type: 'frame',
                name: title,
                x: 0,
                y: 0,
                width: 320,
                height: 180,
                fill: { type: 'color', color: '#ffffffff' },
                children: []
            }
        ]
    }
});

describe('project store', () => {
    it('creates a new .miaomadesign JSON project in the projects directory', async () => {
        const projectsDirectory = await createTempProjectsDirectory();

        try {
            const store = createProjectStore({
                projectsDirectory,
                now: () => new Date('2026-07-12T09:30:00.000Z'),
                createId: () => 'project-1'
            });

            const project = await store.createProject({ title: 'Untitled' });
            const filePath = path.join(
                projectsDirectory,
                `project-1${MIAOMA_PROJECT_FILE_EXTENSION}`
            );
            const stored = JSON.parse(
                await readFile(filePath, 'utf8')
            ) as MiaomaProjectFile;

            expect(project).toMatchObject({
                id: 'project-1',
                title: 'Untitled',
                updatedAt: '2026-07-12T09:30:00.000Z'
            });
            expect(stored.formatVersion).toBe(MIAOMA_PROJECT_FORMAT_VERSION);
            expect(stored.document.fileToken).toBe('project-1');
            expect(stored.document.children[0]?.type).toBe('frame');
        } finally {
            await cleanupTempDirectory(projectsDirectory);
        }
    });

    it('creates a project from a provided design document', async () => {
        const projectsDirectory = await createTempProjectsDirectory();

        try {
            const store = createProjectStore({
                projectsDirectory,
                now: () => new Date('2026-07-12T09:35:00.000Z'),
                createId: () => 'project-document'
            });

            const project = await store.createProject({
                title: 'Cover',
                document: {
                    version: '2.14',
                    children: [
                        {
                            id: 'document-frame',
                            type: 'frame',
                            name: '01-cover',
                            x: 12,
                            y: 24,
                            width: 595,
                            height: 842,
                            fill: { type: 'color', color: '#293975ff' },
                            children: []
                        }
                    ]
                }
            });
            const stored = JSON.parse(
                await readFile(
                    path.join(
                        projectsDirectory,
                        `project-document${MIAOMA_PROJECT_FILE_EXTENSION}`
                    ),
                    'utf8'
                )
            ) as MiaomaProjectFile;

            expect(project.title).toBe('Cover');
            expect(stored.document.fileToken).toBe('project-document');
            expect(stored.document.children).toHaveLength(1);
            expect(stored.document.children[0]).toMatchObject({
                id: 'document-frame',
                name: '01-cover',
                width: 595
            });
        } finally {
            await cleanupTempDirectory(projectsDirectory);
        }
    });

    it('lists valid project files only and sorts by updated time descending', async () => {
        const projectsDirectory = await createTempProjectsDirectory();

        try {
            const store = createProjectStore({
                projectsDirectory,
                now: () => new Date('2026-07-12T09:30:00.000Z'),
                createId: () => 'unused'
            });
            const older = createStoredProject({
                id: 'older',
                title: 'Older Project',
                updatedAt: '2026-07-11T08:00:00.000Z'
            });
            const newer = createStoredProject({
                id: 'newer',
                title: 'Newer Project',
                updatedAt: '2026-07-12T08:00:00.000Z'
            });

            await writeFile(
                path.join(
                    projectsDirectory,
                    `older${MIAOMA_PROJECT_FILE_EXTENSION}`
                ),
                JSON.stringify(older)
            );
            await writeFile(
                path.join(
                    projectsDirectory,
                    `newer${MIAOMA_PROJECT_FILE_EXTENSION}`
                ),
                JSON.stringify(newer)
            );
            await writeFile(
                path.join(projectsDirectory, 'notes.txt'),
                JSON.stringify(newer)
            );
            await writeFile(
                path.join(
                    projectsDirectory,
                    `broken${MIAOMA_PROJECT_FILE_EXTENSION}`
                ),
                '{'
            );

            const projects = await store.listProjects();

            expect(projects.map((project) => project.id)).toEqual([
                'newer',
                'older'
            ]);
            expect(projects[0]).toMatchObject({
                title: 'Newer Project',
                updatedAt: '2026-07-12T08:00:00.000Z'
            });
            expect(projects[0]?.document.children[0]?.id).toBe('newer-frame');
        } finally {
            await cleanupTempDirectory(projectsDirectory);
        }
    });

    it('returns a project by id without exposing arbitrary filesystem access', async () => {
        const projectsDirectory = await createTempProjectsDirectory();

        try {
            const store = createProjectStore({
                projectsDirectory,
                now: () => new Date('2026-07-12T09:30:00.000Z'),
                createId: () => 'project-2'
            });

            await store.createProject({ title: 'Loaded Project' });

            const project = await store.getProject('project-2');
            const missing = await store.getProject('../project-2');

            expect(project?.title).toBe('Loaded Project');
            expect(project?.document.children[0]?.name).toBe('Loaded Project');
            expect(missing).toBeNull();
        } finally {
            await cleanupTempDirectory(projectsDirectory);
        }
    });

    it('updates a project title and design document in its .miaomadesign file', async () => {
        const projectsDirectory = await createTempProjectsDirectory();
        const timestamps = [
            '2026-07-12T09:30:00.000Z',
            '2026-07-12T09:45:00.000Z'
        ];
        let timestampIndex = 0;

        try {
            const store = createProjectStore({
                projectsDirectory,
                now: () =>
                    new Date(
                        timestamps[timestampIndex++] ?? timestamps.at(-1) ?? ''
                    ),
                createId: () => 'project-4'
            });

            await store.createProject({ title: 'Before Rename' });

            const nextDocument: MiaomaProjectFile['document'] = {
                version: '2.14',
                fileToken: 'project-4',
                children: [
                    {
                        id: 'project-4-frame',
                        type: 'frame',
                        name: 'Updated Frame',
                        x: 42,
                        y: 16,
                        width: 640,
                        height: 360,
                        fill: { type: 'color', color: '#f4f6f8ff' },
                        children: []
                    }
                ]
            };

            const updated = await store.updateProject('project-4', {
                title: 'After Rename',
                document: nextDocument
            });
            const stored = JSON.parse(
                await readFile(
                    path.join(
                        projectsDirectory,
                        `project-4${MIAOMA_PROJECT_FILE_EXTENSION}`
                    ),
                    'utf8'
                )
            ) as MiaomaProjectFile;

            expect(updated).toMatchObject({
                id: 'project-4',
                title: 'After Rename',
                updatedAt: '2026-07-12T09:45:00.000Z'
            });
            expect(stored.title).toBe('After Rename');
            expect(stored.updatedAt).toBe('2026-07-12T09:45:00.000Z');
            expect(stored.document.children[0]).toMatchObject({
                id: 'project-4-frame',
                name: 'Updated Frame',
                x: 42
            });
        } finally {
            await cleanupTempDirectory(projectsDirectory);
        }
    });

    it('deletes an existing project file and reports whether anything was removed', async () => {
        const projectsDirectory = await createTempProjectsDirectory();

        try {
            const store = createProjectStore({
                projectsDirectory,
                now: () => new Date('2026-07-12T09:30:00.000Z'),
                createId: () => 'project-3'
            });

            await store.createProject({ title: 'Delete Me' });

            await expect(
                readFile(
                    path.join(
                        projectsDirectory,
                        `project-3${MIAOMA_PROJECT_FILE_EXTENSION}`
                    ),
                    'utf8'
                )
            ).resolves.toContain('Delete Me');

            await expect(store.deleteProject('project-3')).resolves.toBe(true);
            await expect(store.deleteProject('project-3')).resolves.toBe(false);
        } finally {
            await cleanupTempDirectory(projectsDirectory);
        }
    });
});
