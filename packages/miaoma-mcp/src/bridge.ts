/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import net from 'node:net';

import {
    type MiaomaMcpAppClient,
    type MiaomaMcpAppRequest,
    type MiaomaMcpAppResult,
    type MiaomaMcpAppState,
    type MiaomaMcpAsset,
    type MiaomaMcpBridgeRequest,
    type MiaomaMcpBridgeResponse,
    MiaomaMcpError,
    type MiaomaMcpErrorCode,
    type MiaomaMcpNodeContext,
    type MiaomaMcpScreenshot
} from './types';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_MESSAGE_LENGTH = 64 * 1024 * 1024;

const toMiaomaMcpError = (error: unknown) =>
    error instanceof MiaomaMcpError
        ? error
        : new MiaomaMcpError(
              'INTERNAL_ERROR',
              error instanceof Error ? error.message : 'Unknown MCP error.'
          );

const parseBridgeResponse = (
    value: string,
    expectedId: string
): MiaomaMcpBridgeResponse => {
    const response = JSON.parse(value) as MiaomaMcpBridgeResponse;

    if (response.id !== expectedId) {
        throw new MiaomaMcpError(
            'INTERNAL_ERROR',
            'MCP bridge returned an unexpected response identifier.'
        );
    }

    return response;
};

const requestBridge = ({
    endpoint,
    request,
    timeoutMs
}: {
    endpoint: string;
    request: MiaomaMcpBridgeRequest;
    timeoutMs: number;
}) =>
    new Promise<MiaomaMcpAppResult>((resolve, reject) => {
        const socket = net.createConnection(endpoint);
        let settled = false;
        let responseBuffer = '';

        const settle = (callback: () => void) => {
            if (settled) {
                return;
            }

            settled = true;
            clearTimeout(timeout);
            socket.destroy();
            callback();
        };
        const timeout = setTimeout(() => {
            settle(() =>
                reject(
                    new MiaomaMcpError(
                        'RENDERER_UNAVAILABLE',
                        'Timed out waiting for the Miaoma desktop app.'
                    )
                )
            );
        }, timeoutMs);

        socket.setEncoding('utf8');
        socket.once('connect', () => {
            socket.write(`${JSON.stringify(request)}\n`);
        });
        socket.on('data', (chunk: string) => {
            responseBuffer += chunk;
            if (responseBuffer.length > MAX_MESSAGE_LENGTH) {
                settle(() =>
                    reject(
                        new MiaomaMcpError(
                            'INTERNAL_ERROR',
                            'MCP bridge response exceeded the size limit.'
                        )
                    )
                );
                return;
            }

            const lineEnd = responseBuffer.indexOf('\n');
            if (lineEnd < 0) {
                return;
            }

            try {
                const response = parseBridgeResponse(
                    responseBuffer.slice(0, lineEnd),
                    request.id
                );

                if (response.success === true) {
                    settle(() => resolve(response.result));
                    return;
                }

                settle(() =>
                    reject(
                        new MiaomaMcpError(
                            response.error.code,
                            response.error.message
                        )
                    )
                );
            } catch (error) {
                settle(() => reject(toMiaomaMcpError(error)));
            }
        });
        socket.once('error', (error) => {
            settle(() =>
                reject(
                    new MiaomaMcpError(
                        'APP_NOT_RUNNING',
                        `Miaoma desktop app is not available: ${error.message}`
                    )
                )
            );
        });
        socket.once('end', () => {
            settle(() =>
                reject(
                    new MiaomaMcpError(
                        'RENDERER_UNAVAILABLE',
                        'Miaoma desktop app closed the bridge connection.'
                    )
                )
            );
        });
    });

export const createMiaomaMcpBridgeClient = ({
    endpoint,
    timeoutMs = DEFAULT_TIMEOUT_MS
}: {
    endpoint: string;
    timeoutMs?: number;
}): MiaomaMcpAppClient => {
    const call = async (request: MiaomaMcpAppRequest) => {
        try {
            return await requestBridge({
                endpoint,
                request: {
                    id: randomUUID(),
                    request
                },
                timeoutMs
            });
        } catch (error) {
            if (
                request.method === 'get_app_state' &&
                error instanceof MiaomaMcpError &&
                error.code === 'APP_NOT_RUNNING'
            ) {
                return {
                    isRunning: false,
                    activeProject: null,
                    selectedNodeId: null,
                    documentVersion: null,
                    revision: null
                };
            }

            throw error;
        }
    };

    return {
        getAppState: () =>
            call({ method: 'get_app_state' }) as Promise<MiaomaMcpAppState>,
        getSelectedNode: () =>
            call({
                method: 'get_selected_node'
            }) as Promise<MiaomaMcpNodeContext>,
        getNodes: ({ nodeIds }) =>
            call({
                method: 'get_nodes',
                nodeIds
            }) as Promise<MiaomaMcpNodeContext>,
        getScreenshot: ({ nodeId }) =>
            call({
                method: 'get_screenshot',
                nodeId
            }) as Promise<MiaomaMcpScreenshot>,
        getAssets: ({ assetIds }) =>
            call({ method: 'get_assets', assetIds }) as Promise<
                MiaomaMcpAsset[]
            >
    };
};

const serializeBridgeError = (
    id: string,
    error: unknown
): MiaomaMcpBridgeResponse => {
    const normalizedError = toMiaomaMcpError(error);

    return {
        id,
        success: false,
        error: {
            code: normalizedError.code,
            message: normalizedError.message
        }
    };
};

const readBridgeRequest = (value: string): MiaomaMcpBridgeRequest =>
    JSON.parse(value) as MiaomaMcpBridgeRequest;

export type MiaomaMcpBridgeServer = {
    close(): Promise<void>;
};

export const createMiaomaMcpBridgeServer = async ({
    endpoint,
    handleRequest,
    removeStaleEndpoint
}: {
    endpoint: string;
    handleRequest: (
        request: MiaomaMcpAppRequest
    ) => Promise<MiaomaMcpAppResult>;
    removeStaleEndpoint?: boolean;
}): Promise<MiaomaMcpBridgeServer> => {
    const shouldRemoveStaleEndpoint =
        removeStaleEndpoint ?? !endpoint.startsWith('\\\\.\\pipe\\');

    if (shouldRemoveStaleEndpoint) {
        await rm(endpoint, { force: true });
    }

    const server = net.createServer((socket) => {
        socket.setEncoding('utf8');
        let requestBuffer = '';
        let handled = false;

        socket.on('data', (chunk: string) => {
            if (handled) {
                return;
            }

            requestBuffer += chunk;
            if (requestBuffer.length > MAX_MESSAGE_LENGTH) {
                handled = true;
                socket.destroy(
                    new Error('MCP bridge request exceeded the size limit.')
                );
                return;
            }

            const lineEnd = requestBuffer.indexOf('\n');
            if (lineEnd < 0) {
                return;
            }

            handled = true;
            let request: MiaomaMcpBridgeRequest;

            try {
                request = readBridgeRequest(requestBuffer.slice(0, lineEnd));
            } catch (error) {
                socket.end(
                    `${JSON.stringify(
                        serializeBridgeError(
                            'invalid-request',
                            new MiaomaMcpError(
                                'INTERNAL_ERROR',
                                error instanceof Error
                                    ? error.message
                                    : 'Invalid MCP bridge request.'
                            )
                        )
                    )}\n`
                );
                return;
            }

            void handleRequest(request.request)
                .then(
                    (result): MiaomaMcpBridgeResponse => ({
                        id: request.id,
                        success: true,
                        result
                    }),
                    (error): MiaomaMcpBridgeResponse =>
                        serializeBridgeError(request.id, error)
                )
                .then((response) => {
                    socket.end(`${JSON.stringify(response)}\n`);
                });
        });
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(endpoint, () => {
            server.off('error', reject);
            resolve();
        });
    });

    return {
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    void (
                        shouldRemoveStaleEndpoint
                            ? rm(endpoint, { force: true })
                            : Promise.resolve()
                    ).then(() => resolve(), reject);
                });
            })
    };
};

export const isMiaomaMcpErrorCode = (
    value: string
): value is MiaomaMcpErrorCode =>
    [
        'APP_NOT_RUNNING',
        'ASSET_NOT_FOUND',
        'INTERNAL_ERROR',
        'INVALID_NODE_TYPE',
        'NO_ACTIVE_EDITOR',
        'NO_SELECTION',
        'NODE_NOT_FOUND',
        'RENDERER_UNAVAILABLE',
        'SCREENSHOT_FAILED'
    ].includes(value);
