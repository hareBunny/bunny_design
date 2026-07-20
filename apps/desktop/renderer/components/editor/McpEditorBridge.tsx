/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useEffect, useRef } from 'react';

import { editorDocumentToRenderable } from '@miaoma-design-ai/miaoma-editor-core';

import type {
    MiaomaMcpMeasuredNodeSize,
    MiaomaMcpRendererResponse
} from '../../../shared/mcp';

import { useEditorSnapshot } from './state/useEditorSnapshot';

const measureNode = (
    nodeId: string | undefined
): MiaomaMcpMeasuredNodeSize | undefined => {
    if (!nodeId) {
        return undefined;
    }

    const element = [
        ...document.querySelectorAll<HTMLElement>('[data-design-node-id]')
    ].find((candidate) => candidate.dataset.designNodeId === nodeId);

    if (!element) {
        return undefined;
    }

    return {
        width: element.offsetWidth,
        height: element.offsetHeight
    };
};

export const McpEditorBridge = ({
    projectId,
    projectTitle
}: {
    projectId?: string;
    projectTitle: string;
}): null => {
    const snapshot = useEditorSnapshot();
    const documentRevisionRef = useRef(0);
    const previousDocumentRef = useRef(snapshot.document);
    const latestStateRef = useRef({
        document: snapshot.document,
        selectedNodeId: snapshot.selection.selectedNodeId,
        projectId,
        projectTitle
    });

    if (previousDocumentRef.current !== snapshot.document) {
        previousDocumentRef.current = snapshot.document;
        documentRevisionRef.current += 1;
    }

    latestStateRef.current = {
        document: snapshot.document,
        selectedNodeId: snapshot.selection.selectedNodeId,
        projectId,
        projectTitle
    };

    useEffect(() => {
        const mcp = window.miaomaAPI?.mcp;

        if (!mcp) {
            return;
        }

        return mcp.subscribeRendererRequests((request) => {
            try {
                const current = latestStateRef.current;
                const response: MiaomaMcpRendererResponse = {
                    requestId: request.requestId,
                    success: true,
                    snapshot: {
                        project: {
                            id: current.projectId ?? null,
                            title: current.projectTitle
                        },
                        revision: documentRevisionRef.current,
                        selectedNodeId: current.selectedNodeId,
                        document: editorDocumentToRenderable(current.document),
                        measuredNodeSize: measureNode(
                            request.measuredNodeId ??
                                current.selectedNodeId ??
                                undefined
                        )
                    }
                };

                mcp.respondToRendererRequest(response);
            } catch (error) {
                mcp.respondToRendererRequest({
                    requestId: request.requestId,
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unable to read the Miaoma editor.'
                });
            }
        });
    }, []);

    return null;
};
