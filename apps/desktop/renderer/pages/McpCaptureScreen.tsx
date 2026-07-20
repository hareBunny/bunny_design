/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useEffect, useMemo, useRef, useState } from 'react';

import type {
    MiaomaDesignNode,
    MiaomaFill
} from '@miaoma-design-ai/miaoma-design-schema';

import type { MiaomaMcpCapturePayload } from '../../shared/mcp';
import { resolveCanvasAsset } from '../components/document/canvasAssets';
import { CanvasDocumentRenderer } from '../components/document/CanvasDocumentRenderer';

const getCaptureId = () => {
    const [, search = ''] = window.location.hash.split('?');

    return new URLSearchParams(search).get('captureId');
};

const getImageUrls = (node: MiaomaDesignNode): string[] => {
    const values = <T,>(value: T | T[] | undefined): T[] =>
        value === undefined ? [] : Array.isArray(value) ? value : [value];
    const paintUrls = (paint: MiaomaFill | undefined) =>
        paint && typeof paint !== 'string' && paint.type === 'image'
            ? [resolveCanvasAsset(paint.url)]
            : [];

    return [
        ...values(node.fill).flatMap(paintUrls),
        ...values(node.stroke).flatMap((stroke) =>
            typeof stroke === 'string' ? [] : paintUrls(stroke)
        ),
        ...(node.type === 'frame'
            ? (node.children ?? []).flatMap(getImageUrls)
            : [])
    ];
};

const waitForImage = (url: string) =>
    new Promise<void>((resolve) => {
        const image = new Image();
        const finish = () => resolve();

        image.onload = finish;
        image.onerror = finish;
        image.src = url;

        if (image.complete) {
            finish();
        }
    });

const waitForPaint = () =>
    new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });

export const McpCaptureScreen = () => {
    const captureId = useMemo(getCaptureId, []);
    const [payload, setPayload] = useState<MiaomaMcpCapturePayload | null>(
        null
    );
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (!captureId) {
            return;
        }

        void window.miaomaAPI?.mcp
            ?.getCapturePayload(captureId)
            .then(setPayload);
    }, [captureId]);

    useEffect(() => {
        if (!captureId || !payload || notifiedRef.current) {
            return;
        }

        notifiedRef.current = true;

        const notifyReady = async () => {
            await Promise.all([
                document.fonts.ready,
                ...getImageUrls(payload.node).map(waitForImage)
            ]);
            await waitForPaint();

            const renderer = document.querySelector<HTMLElement>(
                '[data-document-renderer="true"]'
            );
            const rectangle = renderer?.getBoundingClientRect();

            if (!rectangle) {
                throw new Error('Miaoma capture renderer is unavailable.');
            }

            await window.miaomaAPI?.mcp?.notifyCaptureReady({
                captureId,
                width: Math.max(1, Math.ceil(rectangle.width)),
                height: Math.max(1, Math.ceil(rectangle.height))
            });
        };

        void notifyReady().catch(() => undefined);
    }, [captureId, payload]);

    if (!payload) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 bg-transparent">
            <CanvasDocumentRenderer
                document={{
                    version: payload.document.version,
                    fileToken: payload.document.fileToken,
                    variables: payload.document.variables,
                    children: [payload.node]
                }}
                renderSelectionOverlay={false}
                resolveAsset={resolveCanvasAsset}
            />
        </div>
    );
};
