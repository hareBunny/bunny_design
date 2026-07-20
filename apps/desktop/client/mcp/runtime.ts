/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { BrowserWindow, WebContents } from 'electron';

import {
    createMiaomaMcpBridgeClient,
    createMiaomaMcpBridgeServer,
    startMiaomaMcpStdioServer
} from '@miaoma-design-ai/miaoma-mcp';

import { createMiaomaMcpAppService } from './appService';
import { createMiaomaMcpRendererBroker } from './rendererBroker';
import { createMiaomaMcpScreenshotCapture } from './screenshotCapture';

export const startMiaomaMcpStdioMode = async ({
    endpoint
}: {
    endpoint: string;
}) =>
    startMiaomaMcpStdioServer({
        appClient: createMiaomaMcpBridgeClient({ endpoint })
    });

export const createMiaomaDesktopMcpRuntime = async ({
    endpoint,
    getActiveEditorWebContents,
    getPreloadPath,
    loadCaptureRoute
}: {
    endpoint: string;
    getActiveEditorWebContents: () => WebContents | null;
    getPreloadPath: () => string;
    loadCaptureRoute: (captureWindow: BrowserWindow, captureId: string) => void;
}) => {
    const rendererBroker = createMiaomaMcpRendererBroker();
    const screenshotCapture = createMiaomaMcpScreenshotCapture({
        getPreloadPath,
        loadCaptureRoute
    });
    const appService = createMiaomaMcpAppService({
        getActiveEditorWebContents,
        rendererBroker,
        screenshotCapture
    });

    try {
        const bridgeServer = await createMiaomaMcpBridgeServer({
            endpoint,
            handleRequest: appService.handleRequest
        });

        return {
            close: async () => {
                rendererBroker.dispose();
                screenshotCapture.dispose();
                await bridgeServer.close();
            }
        };
    } catch (error) {
        rendererBroker.dispose();
        screenshotCapture.dispose();
        throw error;
    }
};
