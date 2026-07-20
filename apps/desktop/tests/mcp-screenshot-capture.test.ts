/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MIAOMA_MCP_IPC_CHANNELS } from '../shared/mcp';

const electron = vi.hoisted(() => {
    const handlers = new Map<string, (...args: any[]) => unknown>();
    const image = {
        isEmpty: () => false,
        resize: vi.fn(() => image),
        getSize: () => ({ width: 320, height: 240 }),
        toPNG: () => Buffer.from('png')
    };
    const windows: FakeBrowserWindow[] = [];

    class FakeBrowserWindow {
        readonly options: Record<string, unknown>;
        readonly webContents = {
            id: 42,
            executeJavaScript: vi.fn(async () => undefined),
            capturePage: vi.fn(async () => image)
        };
        readonly setContentSize = vi.fn();
        readonly destroy = vi.fn();
        readonly isDestroyed = vi.fn(() => false);

        constructor(options: Record<string, unknown>) {
            this.options = options;
            windows.push(this);
        }
    }

    return {
        BrowserWindow: FakeBrowserWindow,
        handlers,
        image,
        ipcMain: {
            handle: vi.fn(
                (channel: string, handler: (...args: any[]) => unknown) => {
                    handlers.set(channel, handler);
                }
            ),
            removeHandler: vi.fn((channel: string) => {
                handlers.delete(channel);
            })
        },
        windows
    };
});

vi.mock('electron', () => ({
    BrowserWindow: electron.BrowserWindow,
    ipcMain: electron.ipcMain
}));

import { createMiaomaMcpScreenshotCapture } from '../client/mcp/screenshotCapture';

describe('Miaoma MCP screenshot capture', () => {
    beforeEach(() => {
        electron.handlers.clear();
        electron.windows.length = 0;
        vi.clearAllMocks();
    });

    it('renders an isolated frame and normalizes the PNG to design pixels', async () => {
        let capturedPayload: unknown;
        const capture = createMiaomaMcpScreenshotCapture({
            getPreloadPath: () => '/app/preload.js',
            loadCaptureRoute: (captureWindow, captureId) => {
                const event = {
                    sender: { id: captureWindow.webContents.id }
                };
                const payloadHandler = electron.handlers.get(
                    MIAOMA_MCP_IPC_CHANNELS.capturePayload
                );
                const readyHandler = electron.handlers.get(
                    MIAOMA_MCP_IPC_CHANNELS.captureReady
                );

                capturedPayload = payloadHandler?.(event, captureId);
                readyHandler?.(event, {
                    captureId,
                    width: 320,
                    height: 240
                });
            }
        });

        try {
            await expect(
                capture.capture({
                    document: {
                        version: '1.0.0',
                        children: []
                    },
                    node: {
                        id: 'frame-1',
                        type: 'frame',
                        x: 100,
                        y: 200,
                        width: 320,
                        height: 240,
                        children: []
                    }
                })
            ).resolves.toEqual({
                nodeId: 'frame-1',
                width: 320,
                height: 240,
                mimeType: 'image/png',
                data: Buffer.from('png').toString('base64')
            });
            expect(capturedPayload).toMatchObject({
                node: {
                    id: 'frame-1',
                    x: 0,
                    y: 0,
                    width: 320,
                    height: 240
                }
            });
            expect(electron.image.resize).toHaveBeenCalledWith({
                width: 320,
                height: 240,
                quality: 'best'
            });
            expect(electron.windows[0]?.options).toMatchObject({
                show: false,
                frame: false,
                transparent: true,
                webPreferences: {
                    preload: '/app/preload.js',
                    backgroundThrottling: false
                }
            });
        } finally {
            capture.dispose();
        }
    });
});
