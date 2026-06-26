/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignDocument } from '../schema/document';
import type { MiaomaDesignNode, MiaomaFrameNode } from '../schema/node';

const childReliesOnFlowPositioning = (child: MiaomaDesignNode) => {
    const usesImplicitPosition = child.x === undefined && child.y === undefined;

    if (usesImplicitPosition) {
        return true;
    }

    if (!('width' in child) && !('height' in child)) {
        return false;
    }

    return (
        child.width === 'fill_container' || child.height === 'fill_container'
    );
};

const inferFrameLayout = (node: MiaomaFrameNode) => {
    if (node.layout !== undefined) {
        return node.layout;
    }

    const hasFlowSignals =
        node.justifyContent !== undefined ||
        node.alignItems !== undefined ||
        node.gap !== undefined ||
        node.padding !== undefined;

    if (!hasFlowSignals || !node.children?.some(childReliesOnFlowPositioning)) {
        return node.layout;
    }

    return 'horizontal';
};

const normalizeDesignNode = (node: MiaomaDesignNode): MiaomaDesignNode => {
    if (node.type !== 'frame') {
        return node;
    }

    const children = node.children?.map(normalizeDesignNode);

    return {
        ...node,
        layout: inferFrameLayout({
            ...node,
            children
        }),
        children
    };
};

export const normalizeDesignDocument = (
    document: MiaomaDesignDocument
): MiaomaDesignDocument => ({
    version: document.version,
    fileToken: document.fileToken,
    children: document.children.map(normalizeDesignNode)
});
