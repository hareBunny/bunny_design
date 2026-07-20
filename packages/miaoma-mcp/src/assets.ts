/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createHash } from 'node:crypto';

import type {
    MiaomaDesignNode,
    MiaomaFill,
    MiaomaStroke
} from '@miaoma-design-ai/miaoma-design-schema';

import type { MiaomaMcpAsset } from './types';

const ASSET_URI_PREFIX = 'miaoma-asset://';

const toArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
};

const restoreCardinality = <T>(
    original: T | T[] | undefined,
    values: T[]
): T | T[] | undefined => {
    if (original === undefined) {
        return undefined;
    }

    return Array.isArray(original) ? values : values[0];
};

const parseDataUrl = (url: string): MiaomaMcpAsset | null => {
    if (!url.startsWith('data:')) {
        return null;
    }

    const separatorIndex = url.indexOf(',');
    if (separatorIndex < 0) {
        return null;
    }

    const metadata = url.slice('data:'.length, separatorIndex);
    const [mimeType = 'application/octet-stream', ...parameters] =
        metadata.split(';');
    const encodedData = url.slice(separatorIndex + 1);
    const isBase64 = parameters.includes('base64');
    let data: Buffer;

    try {
        data = isBase64
            ? Buffer.from(encodedData, 'base64')
            : Buffer.from(decodeURIComponent(encodedData), 'utf8');
    } catch {
        return null;
    }

    const assetId = createHash('sha256').update(data).digest('hex');

    return {
        assetId,
        mimeType,
        data: data.toString('base64')
    };
};

export type MiaomaAssetCatalog = {
    nodes: MiaomaDesignNode[];
    assets: ReadonlyMap<string, MiaomaMcpAsset>;
};

export const createMiaomaAssetCatalog = (
    nodes: MiaomaDesignNode[]
): MiaomaAssetCatalog => {
    const assets = new Map<string, MiaomaMcpAsset>();

    const replaceFill = (fill: MiaomaFill): MiaomaFill => {
        if (typeof fill === 'string' || fill.type !== 'image') {
            return fill;
        }

        const asset = parseDataUrl(fill.url);
        if (!asset) {
            return fill;
        }

        assets.set(asset.assetId, asset);

        return {
            ...fill,
            url: `${ASSET_URI_PREFIX}${asset.assetId}`
        };
    };

    const replaceStroke = (stroke: MiaomaStroke): MiaomaStroke => {
        if (typeof stroke === 'string' || stroke.type !== 'image') {
            return stroke;
        }

        const asset = parseDataUrl(stroke.url);
        if (!asset) {
            return stroke;
        }

        assets.set(asset.assetId, asset);

        return {
            ...stroke,
            url: `${ASSET_URI_PREFIX}${asset.assetId}`
        };
    };

    const replaceNodeAssets = (node: MiaomaDesignNode): MiaomaDesignNode => {
        const fill = restoreCardinality(
            node.fill,
            toArray(node.fill).map(replaceFill)
        );
        const stroke = restoreCardinality(
            node.stroke,
            toArray(node.stroke).map(replaceStroke)
        );
        const shared = {
            ...node,
            fill,
            stroke
        };

        return node.type === 'frame'
            ? {
                  ...shared,
                  type: 'frame',
                  children: node.children?.map(replaceNodeAssets)
              }
            : shared;
    };

    return {
        nodes: nodes.map(replaceNodeAssets),
        assets
    };
};
