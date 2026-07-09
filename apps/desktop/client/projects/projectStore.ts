/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';
import { strictValidateDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import {
    isSafeMiaomaProjectId,
    MIAOMA_PROJECT_FILE_EXTENSION,
    MIAOMA_PROJECT_FORMAT_VERSION,
    type MiaomaProjectCreateInput,
    type MiaomaProjectFile,
    type MiaomaProjectSummary,
    type MiaomaProjectUpdateInput
} from '../../shared/projects';

type ProjectStoreOptions = {
    projectsDirectory: string;
    now?: () => Date;
    createId?: () => string;
};

export type ProjectStore = {
    listProjects(): Promise<MiaomaProjectSummary[]>;
    createProject(
        input?: MiaomaProjectCreateInput
    ): Promise<MiaomaProjectSummary>;
    getProject(projectId: string): Promise<MiaomaProjectSummary | null>;
    updateProject(
        projectId: string,
        input: MiaomaProjectUpdateInput
    ): Promise<MiaomaProjectSummary | null>;
    deleteProject(projectId: string): Promise<boolean>;
};

const DEFAULT_PROJECT_TITLE = 'Untitled';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const toProjectPath = (projectsDirectory: string, projectId: string) =>
    path.join(
        projectsDirectory,
        `${projectId}${MIAOMA_PROJECT_FILE_EXTENSION}`
    );

const toProjectSummary = (
    project: MiaomaProjectFile
): MiaomaProjectSummary => ({
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    document: project.document
});

const parseProjectFile = (input: unknown): MiaomaProjectFile | null => {
    if (!isRecord(input)) {
        return null;
    }

    if (input.formatVersion !== MIAOMA_PROJECT_FORMAT_VERSION) {
        return null;
    }

    if (
        typeof input.id !== 'string' ||
        !isSafeMiaomaProjectId(input.id) ||
        typeof input.title !== 'string' ||
        typeof input.createdAt !== 'string' ||
        typeof input.updatedAt !== 'string'
    ) {
        return null;
    }

    const validation = strictValidateDesignDocument(input.document);

    if (!validation.success) {
        return null;
    }

    return {
        formatVersion: MIAOMA_PROJECT_FORMAT_VERSION,
        id: input.id,
        title: input.title,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
        document: validation.document
    };
};

const createBlankDesignDocument = ({
    projectId,
    title
}: {
    projectId: string;
    title: string;
}): MiaomaDesignDocument => ({
    version: '2.14',
    fileToken: projectId,
    children: [
        {
            id: `${projectId}-root`,
            type: 'frame',
            name: title,
            x: 0,
            y: 0,
            width: 1440,
            height: 900,
            clip: true,
            layout: 'none',
            fill: {
                type: 'color',
                color: '#ffffffff'
            },
            children: []
        }
    ]
});

const toProjectDocument = ({
    document,
    projectId
}: {
    document: MiaomaDesignDocument;
    projectId: string;
}): MiaomaDesignDocument => ({
    ...document,
    fileToken: projectId
});

export const createProjectStore = ({
    projectsDirectory,
    now = () => new Date(),
    createId = randomUUID
}: ProjectStoreOptions): ProjectStore => {
    const ensureProjectsDirectory = () =>
        mkdir(projectsDirectory, { recursive: true });

    const writeProjectFile = (project: MiaomaProjectFile) =>
        writeFile(
            toProjectPath(projectsDirectory, project.id),
            `${JSON.stringify(project, null, 2)}\n`,
            'utf8'
        );

    const readProjectFile = async (
        filePath: string
    ): Promise<MiaomaProjectFile | null> => {
        try {
            return parseProjectFile(
                JSON.parse(await readFile(filePath, 'utf8'))
            );
        } catch {
            return null;
        }
    };

    return {
        async listProjects() {
            await ensureProjectsDirectory();

            const entries = await readdir(projectsDirectory);
            const projectFiles = entries.filter((entry) =>
                entry.endsWith(MIAOMA_PROJECT_FILE_EXTENSION)
            );
            const projects = await Promise.all(
                projectFiles.map((entry) =>
                    readProjectFile(path.join(projectsDirectory, entry))
                )
            );

            return projects
                .flatMap((project) =>
                    project === null ? [] : [toProjectSummary(project)]
                )
                .sort((left, right) =>
                    right.updatedAt.localeCompare(left.updatedAt)
                );
        },
        async createProject(input = {}) {
            await ensureProjectsDirectory();

            const projectId = createId();

            if (!isSafeMiaomaProjectId(projectId)) {
                throw new Error(
                    'Generated project id is not safe for storage.'
                );
            }

            const timestamp = now().toISOString();
            let document = createBlankDesignDocument({
                projectId,
                title: input.title?.trim() || DEFAULT_PROJECT_TITLE
            });

            if (input.document) {
                const validation = strictValidateDesignDocument(input.document);

                if (!validation.success) {
                    throw new Error('Project document is not valid.');
                }

                document = toProjectDocument({
                    document: validation.document,
                    projectId
                });
            }

            const title =
                input.title?.trim() ||
                document.children[0]?.name ||
                DEFAULT_PROJECT_TITLE;
            const project: MiaomaProjectFile = {
                formatVersion: MIAOMA_PROJECT_FORMAT_VERSION,
                id: projectId,
                title,
                createdAt: timestamp,
                updatedAt: timestamp,
                document
            };

            await writeProjectFile(project);

            return toProjectSummary(project);
        },
        async getProject(projectId) {
            if (!isSafeMiaomaProjectId(projectId)) {
                return null;
            }

            await ensureProjectsDirectory();

            const project = await readProjectFile(
                toProjectPath(projectsDirectory, projectId)
            );

            return project === null ? null : toProjectSummary(project);
        },
        async updateProject(projectId, input) {
            if (!isSafeMiaomaProjectId(projectId)) {
                return null;
            }

            await ensureProjectsDirectory();

            const project = await readProjectFile(
                toProjectPath(projectsDirectory, projectId)
            );

            if (project === null) {
                return null;
            }

            const title =
                input.title === undefined
                    ? project.title
                    : input.title.trim() || DEFAULT_PROJECT_TITLE;
            let nextDocument = project.document;

            if (input.document !== undefined) {
                const validation = strictValidateDesignDocument(input.document);

                if (!validation.success) {
                    throw new Error('Project document is not valid.');
                }

                nextDocument = validation.document;
            }

            const nextProject: MiaomaProjectFile = {
                ...project,
                title,
                updatedAt: now().toISOString(),
                document: nextDocument
            };

            await writeProjectFile(nextProject);

            return toProjectSummary(nextProject);
        },
        async deleteProject(projectId) {
            if (!isSafeMiaomaProjectId(projectId)) {
                return false;
            }

            await ensureProjectsDirectory();

            try {
                await rm(toProjectPath(projectsDirectory, projectId));
                return true;
            } catch (error) {
                if (
                    error instanceof Error &&
                    'code' in error &&
                    error.code === 'ENOENT'
                ) {
                    return false;
                }

                throw error;
            }
        }
    };
};
