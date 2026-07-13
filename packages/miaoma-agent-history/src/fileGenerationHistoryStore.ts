/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { randomUUID } from 'node:crypto';
import {
    mkdir,
    readdir,
    readFile,
    rename,
    rm,
    writeFile
} from 'node:fs/promises';
import path from 'node:path';

import {
    type MiaomaGenerationRun,
    parseMiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const isMissingFileError = (error: unknown) =>
    error instanceof Error && 'code' in error && error.code === 'ENOENT';

const assertSafeId = (value: string, label: string) => {
    if (!SAFE_ID_PATTERN.test(value)) {
        throw new Error(`${label} is not safe for history storage.`);
    }
};

export type MiaomaGenerationHistoryStore = {
    saveRun(input: { run: MiaomaGenerationRun }): Promise<void>;
    loadRun(input: {
        projectId: string;
        runId: string;
    }): Promise<MiaomaGenerationRun | null>;
    listRuns(input: { projectId: string }): Promise<MiaomaGenerationRun[]>;
};

export const createFileGenerationHistoryStore = ({
    historyRoot,
    createTemporaryId = randomUUID
}: {
    historyRoot: string;
    createTemporaryId?: () => string;
}): MiaomaGenerationHistoryStore => {
    const writeQueues = new Map<string, Promise<void>>();

    const projectDirectory = (projectId: string) => {
        assertSafeId(projectId, 'Project id');
        return path.join(historyRoot, projectId);
    };

    const runPath = (projectId: string, runId: string) => {
        assertSafeId(runId, 'Run id');
        return path.join(projectDirectory(projectId), `${runId}.json`);
    };

    const serializeProjectWrite = (
        projectId: string,
        operation: () => Promise<void>
    ) => {
        const current = (writeQueues.get(projectId) ?? Promise.resolve()).then(
            operation,
            operation
        );
        writeQueues.set(projectId, current);

        return current.finally(() => {
            if (writeQueues.get(projectId) === current) {
                writeQueues.delete(projectId);
            }
        });
    };

    const readStoredRun = async (filePath: string) => {
        try {
            return parseMiaomaGenerationRun(
                JSON.parse(await readFile(filePath, 'utf8'))
            );
        } catch (error) {
            if (isMissingFileError(error) || error instanceof SyntaxError) {
                return null;
            }

            throw error;
        }
    };

    return {
        async saveRun({ run }) {
            const parsedRun = parseMiaomaGenerationRun(run);
            if (!parsedRun) {
                throw new Error('Generation run is not valid.');
            }

            const directory = projectDirectory(run.projectId);
            const targetPath = runPath(run.projectId, run.runId);

            await serializeProjectWrite(run.projectId, async () => {
                const temporaryPath = path.join(
                    directory,
                    `${run.runId}.${createTemporaryId()}.tmp`
                );

                await mkdir(directory, { recursive: true });
                try {
                    await writeFile(
                        temporaryPath,
                        `${JSON.stringify(parsedRun, null, 2)}\n`,
                        'utf8'
                    );
                    await rename(temporaryPath, targetPath);
                } catch (error) {
                    await rm(temporaryPath, { force: true });
                    throw error;
                }
            });
        },
        async loadRun({ projectId, runId }) {
            const run = await readStoredRun(runPath(projectId, runId));

            return run?.projectId === projectId && run.runId === runId
                ? run
                : null;
        },
        async listRuns({ projectId }) {
            const directory = projectDirectory(projectId);
            let entries;

            try {
                entries = await readdir(directory, { withFileTypes: true });
            } catch (error) {
                if (isMissingFileError(error)) {
                    return [];
                }

                throw error;
            }

            const runs = await Promise.all(
                entries
                    .filter(
                        (entry) =>
                            entry.isFile() && entry.name.endsWith('.json')
                    )
                    .map((entry) =>
                        readStoredRun(path.join(directory, entry.name))
                    )
            );

            return runs
                .flatMap((run) => (run?.projectId === projectId ? [run] : []))
                .sort((left, right) =>
                    right.updatedAt.localeCompare(left.updatedAt)
                );
        }
    };
};
