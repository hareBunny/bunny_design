/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { WebContents } from 'electron';
import { describe, expect, it, vi } from 'vitest';

import { createMiaomaMcpAppService } from '../client/mcp/appService';
import type { MiaomaMcpRendererBroker } from '../client/mcp/rendererBroker';
import type { MiaomaMcpScreenshotCapture } from '../client/mcp/screenshotCapture';
import type { MiaomaMcpRendererSnapshot } from '../shared/mcp';

const IMAGE_DATA = Buffer.from('miaoma-image').toString('base64');

const SNAPSHOT: MiaomaMcpRendererSnapshot = {
    project: {
        id: 'project-1',
        title: 'Landing page'
    },
    revision: 7,
    selectedNodeId: 'frame-1',
    document: {
        version: '1.0.0',
        children: [
            {
                id: 'frame-1',
                type: 'frame',
                width: 320,
                height: 240,
                fill: {
                    type: 'image',
                    url: `data:image/png;base64,${IMAGE_DATA}`,
                    mode: 'fill'
                },
                children: [
                    {
                        id: 'text-1',
                        type: 'text',
                        content: 'Hello'
                    }
                ]
            }
        ]
    },
    measuredNodeSize: {
        width: 320,
        height: 240
    }
};

const createService = () => {
    const sender = {
        isDestroyed: () => false
    } as WebContents;
    const rendererBroker = {
        requestSnapshot: vi.fn(async () => SNAPSHOT),
        dispose: vi.fn()
    } satisfies MiaomaMcpRendererBroker;
    const screenshotCapture = {
        capture: vi.fn(async () => ({
            nodeId: 'frame-1',
            width: 320,
            height: 240,
            mimeType: 'image/png',
            data: Buffer.from('png').toString('base64')
        })),
        dispose: vi.fn()
    } satisfies MiaomaMcpScreenshotCapture;
    const service = createMiaomaMcpAppService({
        getActiveEditorWebContents: () => sender,
        rendererBroker,
        screenshotCapture
    });

    return { service, rendererBroker, screenshotCapture };
};

describe('Miaoma MCP app service', () => {
    it('returns canonical recursive node JSON with lightweight asset URLs', async () => {
        const { service } = createService();
        const result = await service.handleRequest({
            method: 'get_selected_node'
        });

        expect(result).toMatchObject({
            documentVersion: '1.0.0',
            revision: 7,
            selectedNodeId: 'frame-1',
            nodes: [
                {
                    id: 'frame-1',
                    type: 'frame',
                    fill: {
                        type: 'image',
                        url: expect.stringMatching(
                            /^miaoma-asset:\/\/[a-f0-9]{64}$/
                        )
                    },
                    children: [{ id: 'text-1', type: 'text' }]
                }
            ]
        });
    });

    it('renders screenshots only through the dedicated frame capture', async () => {
        const { service, rendererBroker, screenshotCapture } = createService();

        await expect(
            service.handleRequest({ method: 'get_screenshot' })
        ).resolves.toMatchObject({
            nodeId: 'frame-1',
            mimeType: 'image/png'
        });
        expect(rendererBroker.requestSnapshot).toHaveBeenCalledWith(
            expect.anything(),
            { measuredNodeId: undefined }
        );
        expect(screenshotCapture.capture).toHaveBeenCalledWith(
            expect.objectContaining({
                node: expect.objectContaining({
                    id: 'frame-1',
                    type: 'frame'
                }),
                measuredSize: {
                    width: 320,
                    height: 240
                }
            })
        );
    });
});
