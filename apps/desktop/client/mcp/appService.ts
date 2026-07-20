/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { WebContents } from 'electron';

import type { MiaomaDesignNode } from '@miaoma-design-ai/miaoma-design-schema';
import {
    createMiaomaAssetCatalog,
    type MiaomaMcpAppRequest,
    type MiaomaMcpAppResult,
    MiaomaMcpError,
    type MiaomaMcpNodeContext
} from '@miaoma-design-ai/miaoma-mcp';

import type { MiaomaMcpRendererSnapshot } from '../../shared/mcp';

import type { MiaomaMcpRendererBroker } from './rendererBroker';
import type { MiaomaMcpScreenshotCapture } from './screenshotCapture';

const findNodeById = (
    nodes: MiaomaDesignNode[],
    nodeId: string
): MiaomaDesignNode | null => {
    for (const node of nodes) {
        if (node.id === nodeId) {
            return node;
        }

        if (node.type === 'frame') {
            const child = findNodeById(node.children ?? [], nodeId);
            if (child) {
                return child;
            }
        }
    }

    return null;
};

const requireSelection = (snapshot: MiaomaMcpRendererSnapshot) => {
    if (!snapshot.selectedNodeId) {
        throw new MiaomaMcpError(
            'NO_SELECTION',
            'No node is selected in the active Miaoma project.'
        );
    }

    return snapshot.selectedNodeId;
};

const getNodeContext = ({
    snapshot,
    nodeIds
}: {
    snapshot: MiaomaMcpRendererSnapshot;
    nodeIds: string[];
}): MiaomaMcpNodeContext => {
    const nodes = nodeIds.map((nodeId) => {
        const node = findNodeById(snapshot.document.children, nodeId);

        if (!node) {
            throw new MiaomaMcpError(
                'NODE_NOT_FOUND',
                `Node ${nodeId} does not exist in the active Miaoma project.`
            );
        }

        return node;
    });
    const catalog = createMiaomaAssetCatalog(nodes);

    return {
        project: snapshot.project,
        documentVersion: snapshot.document.version,
        revision: snapshot.revision,
        variables: snapshot.document.variables,
        selectedNodeId: snapshot.selectedNodeId,
        nodes: catalog.nodes
    };
};

export const createMiaomaMcpAppService = ({
    getActiveEditorWebContents,
    rendererBroker,
    screenshotCapture
}: {
    getActiveEditorWebContents: () => WebContents | null;
    rendererBroker: MiaomaMcpRendererBroker;
    screenshotCapture: MiaomaMcpScreenshotCapture;
}) => {
    const getActiveEditor = () => {
        const sender = getActiveEditorWebContents();

        if (!sender || sender.isDestroyed()) {
            throw new MiaomaMcpError(
                'NO_ACTIVE_EDITOR',
                'No Miaoma editor project is currently active.'
            );
        }

        return sender;
    };

    const getSnapshot = (options?: { measuredNodeId?: string }) =>
        rendererBroker.requestSnapshot(getActiveEditor(), options);

    return {
        async handleRequest(
            request: MiaomaMcpAppRequest
        ): Promise<MiaomaMcpAppResult> {
            if (request.method === 'get_app_state') {
                const sender = getActiveEditorWebContents();

                if (!sender || sender.isDestroyed()) {
                    return {
                        isRunning: true,
                        activeProject: null,
                        selectedNodeId: null,
                        documentVersion: null,
                        revision: null
                    };
                }

                const snapshot = await rendererBroker.requestSnapshot(sender);

                return {
                    isRunning: true,
                    activeProject: snapshot.project,
                    selectedNodeId: snapshot.selectedNodeId,
                    documentVersion: snapshot.document.version,
                    revision: snapshot.revision
                };
            }

            if (request.method === 'get_selected_node') {
                const snapshot = await getSnapshot();

                return getNodeContext({
                    snapshot,
                    nodeIds: [requireSelection(snapshot)]
                });
            }

            if (request.method === 'get_nodes') {
                return getNodeContext({
                    snapshot: await getSnapshot(),
                    nodeIds: request.nodeIds
                });
            }

            if (request.method === 'get_assets') {
                const snapshot = await getSnapshot();
                const catalog = createMiaomaAssetCatalog(
                    snapshot.document.children
                );

                return request.assetIds.map((assetId) => {
                    const asset = catalog.assets.get(assetId);

                    if (!asset) {
                        throw new MiaomaMcpError(
                            'ASSET_NOT_FOUND',
                            `Asset ${assetId} does not exist in the active Miaoma project.`
                        );
                    }

                    return asset;
                });
            }

            const snapshot = await getSnapshot({
                measuredNodeId: request.nodeId
            });
            const nodeId = request.nodeId ?? requireSelection(snapshot);
            const node = findNodeById(snapshot.document.children, nodeId);

            if (!node) {
                throw new MiaomaMcpError(
                    'NODE_NOT_FOUND',
                    `Node ${nodeId} does not exist in the active Miaoma project.`
                );
            }
            if (node.type !== 'frame') {
                throw new MiaomaMcpError(
                    'INVALID_NODE_TYPE',
                    `Node ${nodeId} is ${node.type}; get_screenshot requires a frame.`
                );
            }

            return screenshotCapture.capture({
                document: snapshot.document,
                node,
                measuredSize: snapshot.measuredNodeSize
            });
        }
    };
};
