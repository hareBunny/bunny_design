/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { createMiaomaMcpServer } from '../src/server';
import type { MiaomaMcpAppClient } from '../src/types';

const createAppClient = (): MiaomaMcpAppClient => ({
    getAppState: async () => ({
        isRunning: true,
        activeProject: {
            id: 'project-1',
            title: 'Landing page'
        },
        selectedNodeId: 'frame-1',
        documentVersion: '1.0.0',
        revision: 4
    }),
    getSelectedNode: async () => ({
        project: {
            id: 'project-1',
            title: 'Landing page'
        },
        documentVersion: '1.0.0',
        revision: 4,
        selectedNodeId: 'frame-1',
        nodes: [
            {
                id: 'frame-1',
                type: 'frame',
                width: 320,
                height: 240,
                children: []
            }
        ]
    }),
    getNodes: async () => createAppClient().getSelectedNode(),
    getScreenshot: async ({ nodeId }) => ({
        nodeId: nodeId ?? 'frame-1',
        width: 320,
        height: 240,
        mimeType: 'image/png',
        data: Buffer.from('png').toString('base64')
    }),
    getAssets: async ({ assetIds }) =>
        assetIds.map((assetId) => ({
            assetId,
            mimeType: 'image/png',
            data: Buffer.from(assetId).toString('base64')
        }))
});

describe('Miaoma MCP server', () => {
    it('exposes the five read-only tools over the real MCP protocol', async () => {
        const server = createMiaomaMcpServer({
            appClient: createAppClient()
        });
        const client = new Client({
            name: 'miaoma-mcp-test',
            version: '1.0.0'
        });
        const [clientTransport, serverTransport] =
            InMemoryTransport.createLinkedPair();

        await Promise.all([
            server.connect(serverTransport),
            client.connect(clientTransport)
        ]);

        try {
            const tools = await client.listTools();

            expect(tools.tools.map(({ name }) => name)).toEqual([
                'get_app_state',
                'get_selected_node',
                'get_nodes',
                'get_screenshot',
                'get_assets'
            ]);
            expect(
                tools.tools.every(
                    ({ annotations }) => annotations?.readOnlyHint === true
                )
            ).toBe(true);

            const nodeResult = CallToolResultSchema.parse(
                await client.callTool({
                    name: 'get_selected_node',
                    arguments: {}
                })
            );
            const nodeText = nodeResult.content[0];

            expect(nodeText?.type).toBe('text');
            expect(nodeText?.type === 'text' ? nodeText.text : '').toContain(
                'frame-1'
            );

            const screenshotResult = CallToolResultSchema.parse(
                await client.callTool({
                    name: 'get_screenshot',
                    arguments: {}
                })
            );

            expect(screenshotResult.content[1]).toMatchObject({
                type: 'image',
                mimeType: 'image/png'
            });
        } finally {
            await Promise.all([client.close(), server.close()]);
        }
    });
});
