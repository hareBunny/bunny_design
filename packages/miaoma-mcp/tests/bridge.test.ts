/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    createMiaomaMcpBridgeClient,
    createMiaomaMcpBridgeServer
} from '../src/bridge';

describe('Miaoma MCP bridge', () => {
    it('round-trips real requests over a Unix socket', async () => {
        const directory = await mkdtemp(
            path.join(tmpdir(), 'miaoma-mcp-bridge-')
        );
        const endpoint = path.join(directory, 'bridge.sock');
        const bridge = await createMiaomaMcpBridgeServer({
            endpoint,
            handleRequest: async () => ({
                isRunning: true,
                activeProject: {
                    id: 'project-1',
                    title: 'Landing page'
                },
                selectedNodeId: 'frame-1',
                documentVersion: '1.0.0',
                revision: 3
            })
        });

        try {
            const client = createMiaomaMcpBridgeClient({ endpoint });

            await expect(client.getAppState()).resolves.toMatchObject({
                isRunning: true,
                selectedNodeId: 'frame-1',
                revision: 3
            });
        } finally {
            await bridge.close();
            await rm(directory, { recursive: true, force: true });
        }
    });

    it('reports the app as stopped when the bridge does not exist', async () => {
        const client = createMiaomaMcpBridgeClient({
            endpoint: path.join(
                tmpdir(),
                `miaoma-missing-${process.pid}-${Date.now()}.sock`
            )
        });

        await expect(client.getAppState()).resolves.toEqual({
            isRunning: false,
            activeProject: null,
            selectedNodeId: null,
            documentVersion: null,
            revision: null
        });
        await expect(client.getSelectedNode()).rejects.toMatchObject({
            code: 'APP_NOT_RUNNING'
        });
    });
});
