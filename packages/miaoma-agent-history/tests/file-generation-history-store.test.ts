/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    createMiaomaGenerationRun,
    type MiaomaGenerationRun
} from '@miaoma-design-ai/miaoma-agent-core';

import { createFileGenerationHistoryStore } from '../src';

let historyRoot: string;

beforeEach(async () => {
    historyRoot = await mkdtemp(path.join(os.tmpdir(), 'miaoma-history-'));
});

afterEach(async () => {
    await rm(historyRoot, { force: true, recursive: true });
});

const createRun = ({
    runId,
    updatedAt = '2026-07-20T00:00:00.000Z'
}: {
    runId: string;
    updatedAt?: string;
}) => ({
    ...createMiaomaGenerationRun({
        runId,
        projectId: 'project-1',
        prompt: 'Create a CRM dashboard',
        createdAt: '2026-07-20T00:00:00.000Z'
    }),
    updatedAt
});

describe('file generation history store', () => {
    it('stores each run in its project history directory', async () => {
        const store = createFileGenerationHistoryStore({ historyRoot });
        const run = createRun({ runId: 'run-1' });

        await store.saveRun({ run });

        await expect(
            readFile(path.join(historyRoot, 'project-1', 'run-1.json'), 'utf8')
        ).resolves.toContain('"runId": "run-1"');
        await expect(
            store.loadRun({ projectId: 'project-1', runId: 'run-1' })
        ).resolves.toEqual(run);
    });

    it('serializes concurrent updates for the same run', async () => {
        const store = createFileGenerationHistoryStore({ historyRoot });
        const queued = createRun({ runId: 'run-1' });
        const preparing: MiaomaGenerationRun = {
            ...queued,
            status: 'preparing',
            updatedAt: '2026-07-20T00:01:00.000Z'
        };

        await Promise.all([
            store.saveRun({ run: queued }),
            store.saveRun({ run: preparing })
        ]);

        await expect(
            store.loadRun({ projectId: 'project-1', runId: 'run-1' })
        ).resolves.toMatchObject({ status: 'preparing' });
    });

    it('lists runs by their most recent update time', async () => {
        const store = createFileGenerationHistoryStore({ historyRoot });

        await store.saveRun({
            run: createRun({ runId: 'older' })
        });
        await store.saveRun({
            run: createRun({
                runId: 'newer',
                updatedAt: '2026-07-20T00:01:00.000Z'
            })
        });
        const runs = await store.listRuns({ projectId: 'project-1' });

        expect(runs.map(({ runId }) => runId)).toEqual(['newer', 'older']);
    });

    it('ignores damaged history files when listing runs', async () => {
        const store = createFileGenerationHistoryStore({ historyRoot });
        await store.saveRun({ run: createRun({ runId: 'valid' }) });
        await writeFile(
            path.join(historyRoot, 'project-1', 'damaged.json'),
            '{',
            'utf8'
        );

        await expect(
            store.listRuns({ projectId: 'project-1' })
        ).resolves.toEqual([expect.objectContaining({ runId: 'valid' })]);
    });

    it.each([
        { projectId: '../project-1', runId: 'run-1' },
        { projectId: 'project-1', runId: '../run-1' },
        { projectId: '', runId: 'run-1' }
    ])('rejects unsafe history ids', async ({ projectId, runId }) => {
        const store = createFileGenerationHistoryStore({ historyRoot });

        await expect(store.loadRun({ projectId, runId })).rejects.toThrow(
            'not safe for history storage'
        );
    });
});
