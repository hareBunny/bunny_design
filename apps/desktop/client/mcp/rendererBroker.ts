/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { ipcMain, type IpcMainEvent, type WebContents } from 'electron';
import { randomUUID } from 'node:crypto';

import { MiaomaMcpError } from '@miaoma-design-ai/miaoma-mcp';

import {
    MIAOMA_MCP_IPC_CHANNELS,
    type MiaomaMcpRendererRequest,
    type MiaomaMcpRendererResponse,
    type MiaomaMcpRendererSnapshot
} from '../../shared/mcp';

const DEFAULT_RENDERER_TIMEOUT_MS = 5_000;

type PendingRendererRequest = {
    senderId: number;
    resolve: (snapshot: MiaomaMcpRendererSnapshot) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
};

export type MiaomaMcpRendererBroker = {
    requestSnapshot(
        sender: WebContents,
        options?: { measuredNodeId?: string }
    ): Promise<MiaomaMcpRendererSnapshot>;
    dispose(): void;
};

export const createMiaomaMcpRendererBroker = ({
    timeoutMs = DEFAULT_RENDERER_TIMEOUT_MS
}: {
    timeoutMs?: number;
} = {}): MiaomaMcpRendererBroker => {
    const pendingRequests = new Map<string, PendingRendererRequest>();

    const handleResponse = (
        event: IpcMainEvent,
        response: MiaomaMcpRendererResponse
    ) => {
        const pending = pendingRequests.get(response.requestId);

        if (!pending || event.sender.id !== pending.senderId) {
            return;
        }

        clearTimeout(pending.timeout);
        pendingRequests.delete(response.requestId);

        if (response.success === true) {
            pending.resolve(response.snapshot);
            return;
        }

        pending.reject(
            new MiaomaMcpError('RENDERER_UNAVAILABLE', response.error)
        );
    };

    ipcMain.on(MIAOMA_MCP_IPC_CHANNELS.rendererResponse, handleResponse);

    return {
        requestSnapshot: (sender, options = {}) =>
            new Promise((resolve, reject) => {
                if (sender.isDestroyed()) {
                    reject(
                        new MiaomaMcpError(
                            'RENDERER_UNAVAILABLE',
                            'The active Miaoma editor window is unavailable.'
                        )
                    );
                    return;
                }

                const requestId = randomUUID();
                const request: MiaomaMcpRendererRequest = {
                    requestId,
                    measuredNodeId: options.measuredNodeId
                };
                const timeout = setTimeout(() => {
                    pendingRequests.delete(requestId);
                    reject(
                        new MiaomaMcpError(
                            'RENDERER_UNAVAILABLE',
                            'Timed out reading the active Miaoma editor.'
                        )
                    );
                }, timeoutMs);

                pendingRequests.set(requestId, {
                    senderId: sender.id,
                    resolve,
                    reject,
                    timeout
                });
                sender.send(MIAOMA_MCP_IPC_CHANNELS.rendererRequest, request);
            }),
        dispose: () => {
            ipcMain.removeListener(
                MIAOMA_MCP_IPC_CHANNELS.rendererResponse,
                handleResponse
            );

            for (const pending of pendingRequests.values()) {
                clearTimeout(pending.timeout);
                pending.reject(
                    new MiaomaMcpError(
                        'RENDERER_UNAVAILABLE',
                        'The Miaoma MCP renderer bridge was closed.'
                    )
                );
            }
            pendingRequests.clear();
        }
    };
};
