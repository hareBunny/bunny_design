/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { BrowserWindow, ipcMain } from 'electron';
import { randomUUID } from 'node:crypto';

import type {
    MiaomaDesignDocument,
    MiaomaFrameNode
} from '@miaoma-design-ai/miaoma-design-schema';
import {
    MiaomaMcpError,
    type MiaomaMcpScreenshot
} from '@miaoma-design-ai/miaoma-mcp';

import {
    MIAOMA_MCP_IPC_CHANNELS,
    type MiaomaMcpCapturePayload,
    type MiaomaMcpCaptureReadyInput,
    type MiaomaMcpMeasuredNodeSize
} from '../../shared/mcp';

const CAPTURE_READY_TIMEOUT_MS = 10_000;
const MAX_CAPTURE_DIMENSION = 16_384;

type PendingCapture = {
    payload: MiaomaMcpCapturePayload;
    webContentsId: number;
    resolveReady: (size: MiaomaMcpMeasuredNodeSize) => void;
    rejectReady: (error: Error) => void;
    ready: Promise<MiaomaMcpMeasuredNodeSize>;
};

export type MiaomaMcpScreenshotCapture = {
    capture(input: {
        document: MiaomaDesignDocument;
        node: MiaomaFrameNode;
        measuredSize?: MiaomaMcpMeasuredNodeSize;
    }): Promise<MiaomaMcpScreenshot>;
    dispose(): void;
};

const toNumericDimension = (
    value: MiaomaFrameNode['width'],
    measuredValue: number | undefined
) => (typeof value === 'number' ? value : measuredValue);

const normalizeFrameForCapture = ({
    node,
    measuredSize
}: {
    node: MiaomaFrameNode;
    measuredSize?: MiaomaMcpMeasuredNodeSize;
}): MiaomaFrameNode => {
    const width = toNumericDimension(node.width, measuredSize?.width);
    const height = toNumericDimension(node.height, measuredSize?.height);

    if (!width || !height || width <= 0 || height <= 0) {
        throw new MiaomaMcpError(
            'SCREENSHOT_FAILED',
            'The selected frame does not have measurable dimensions.'
        );
    }

    return {
        ...node,
        x: 0,
        y: 0,
        width,
        height
    };
};

const validateCaptureSize = ({ width, height }: MiaomaMcpMeasuredNodeSize) => {
    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0 ||
        width > MAX_CAPTURE_DIMENSION ||
        height > MAX_CAPTURE_DIMENSION
    ) {
        throw new MiaomaMcpError(
            'SCREENSHOT_FAILED',
            `Frame capture size ${width}x${height} is unsupported.`
        );
    }
};

export const createMiaomaMcpScreenshotCapture = ({
    getPreloadPath,
    loadCaptureRoute
}: {
    getPreloadPath: () => string;
    loadCaptureRoute: (captureWindow: BrowserWindow, captureId: string) => void;
}): MiaomaMcpScreenshotCapture => {
    const pendingCaptures = new Map<string, PendingCapture>();

    ipcMain.handle(
        MIAOMA_MCP_IPC_CHANNELS.capturePayload,
        (event, captureId: string) => {
            const pending = pendingCaptures.get(captureId);

            return pending?.webContentsId === event.sender.id
                ? pending.payload
                : null;
        }
    );
    ipcMain.handle(
        MIAOMA_MCP_IPC_CHANNELS.captureReady,
        (event, input: MiaomaMcpCaptureReadyInput) => {
            const pending = pendingCaptures.get(input.captureId);

            if (!pending || pending.webContentsId !== event.sender.id) {
                return false;
            }

            pending.resolveReady({
                width: input.width,
                height: input.height
            });

            return true;
        }
    );

    return {
        async capture({ document, node, measuredSize }) {
            const captureId = randomUUID();
            const captureNode = normalizeFrameForCapture({
                node,
                measuredSize
            });
            const captureWindow = new BrowserWindow({
                width: Math.max(
                    1,
                    Math.ceil(
                        typeof captureNode.width === 'number'
                            ? captureNode.width
                            : 800
                    )
                ),
                height: Math.max(
                    1,
                    Math.ceil(
                        typeof captureNode.height === 'number'
                            ? captureNode.height
                            : 600
                    )
                ),
                show: false,
                frame: false,
                transparent: true,
                backgroundColor: '#00000000',
                enableLargerThanScreen: true,
                webPreferences: {
                    preload: getPreloadPath(),
                    backgroundThrottling: false
                }
            });
            let resolveReady!: (size: MiaomaMcpMeasuredNodeSize) => void;
            let rejectReady!: (error: Error) => void;
            const ready = new Promise<MiaomaMcpMeasuredNodeSize>(
                (resolve, reject) => {
                    resolveReady = resolve;
                    rejectReady = reject;
                }
            );
            const payload: MiaomaMcpCapturePayload = {
                captureId,
                document,
                node: captureNode
            };
            const timeout = setTimeout(() => {
                rejectReady(
                    new MiaomaMcpError(
                        'SCREENSHOT_FAILED',
                        'Timed out rendering the selected Miaoma frame.'
                    )
                );
            }, CAPTURE_READY_TIMEOUT_MS);

            pendingCaptures.set(captureId, {
                payload,
                webContentsId: captureWindow.webContents.id,
                resolveReady,
                rejectReady,
                ready
            });

            try {
                loadCaptureRoute(captureWindow, captureId);

                const size = await ready;
                clearTimeout(timeout);
                validateCaptureSize(size);
                captureWindow.setContentSize(
                    Math.ceil(size.width),
                    Math.ceil(size.height),
                    false
                );
                await captureWindow.webContents.executeJavaScript(
                    'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))'
                );

                const image = await captureWindow.webContents.capturePage({
                    x: 0,
                    y: 0,
                    width: Math.ceil(size.width),
                    height: Math.ceil(size.height)
                });
                if (image.isEmpty()) {
                    throw new MiaomaMcpError(
                        'SCREENSHOT_FAILED',
                        'Electron returned an empty frame screenshot.'
                    );
                }

                const normalizedImage = image.resize({
                    width: Math.ceil(size.width),
                    height: Math.ceil(size.height),
                    quality: 'best'
                });
                const imageSize = normalizedImage.getSize();

                return {
                    nodeId: node.id,
                    width: imageSize.width,
                    height: imageSize.height,
                    mimeType: 'image/png',
                    data: normalizedImage.toPNG().toString('base64')
                };
            } finally {
                clearTimeout(timeout);
                pendingCaptures.delete(captureId);
                if (!captureWindow.isDestroyed()) {
                    captureWindow.destroy();
                }
            }
        },
        dispose: () => {
            ipcMain.removeHandler(MIAOMA_MCP_IPC_CHANNELS.capturePayload);
            ipcMain.removeHandler(MIAOMA_MCP_IPC_CHANNELS.captureReady);
            for (const pending of pendingCaptures.values()) {
                pending.rejectReady(
                    new MiaomaMcpError(
                        'SCREENSHOT_FAILED',
                        'Miaoma frame capture was stopped.'
                    )
                );
            }
            pendingCaptures.clear();
        }
    };
};
