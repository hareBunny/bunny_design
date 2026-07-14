/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaGenerationAssignment } from '@miaoma-design-ai/miaoma-agent-core';
import {
    type MiaomaDesignNode,
    strictValidateDesignDocument
} from '@miaoma-design-ai/miaoma-design-schema';

import {
    type MiaomaDesignDocumentState,
    type MiaomaDesignFragment,
    MiaomaDesignGenerationError,
    type MiaomaDesignVariablesDraft
} from './types';

const assertRevision = (
    state: MiaomaDesignDocumentState,
    expectedRevision: number
) => {
    if (state.revision !== expectedRevision) {
        throw new MiaomaDesignGenerationError({
            code: 'revision-conflict',
            message: `Expected document revision ${expectedRevision}, received ${state.revision}.`
        });
    }
};

const collectNodeIds = (
    nodes: readonly MiaomaDesignNode[],
    ids = new Set<string>()
) => {
    for (const node of nodes) {
        if (ids.has(node.id)) {
            throw new MiaomaDesignGenerationError({
                code: 'duplicate-node-id',
                message: `Duplicate document node id: ${node.id}.`
            });
        }
        ids.add(node.id);
        if (node.type === 'frame' && node.children) {
            collectNodeIds(node.children, ids);
        }
    }

    return ids;
};

const validateDocument = (document: MiaomaDesignDocumentState['document']) => {
    const validation = strictValidateDesignDocument(document);
    if (!validation.success) {
        throw new MiaomaDesignGenerationError({
            code: 'invalid-document',
            message: 'Updated design document is invalid.',
            diagnostics: validation.diagnostics
        });
    }
    collectNodeIds(validation.document.children);

    return validation.document;
};

export const applyMiaomaDesignVariables = ({
    state,
    expectedRevision,
    draft
}: {
    state: MiaomaDesignDocumentState;
    expectedRevision: number;
    draft: MiaomaDesignVariablesDraft;
}): MiaomaDesignDocumentState => {
    assertRevision(state, expectedRevision);

    return {
        document: validateDocument({
            ...state.document,
            variables: {
                ...state.document.variables,
                ...draft.variables
            }
        }),
        revision: state.revision + 1
    };
};

type AppendResult =
    | { status: 'not-found'; node: MiaomaDesignNode }
    | { status: 'not-frame'; node: MiaomaDesignNode }
    | { status: 'updated'; node: MiaomaDesignNode };

const appendToTarget = (
    node: MiaomaDesignNode,
    targetNodeId: string,
    nodes: MiaomaDesignNode[]
): AppendResult => {
    if (node.id === targetNodeId) {
        return node.type === 'frame'
            ? {
                  status: 'updated',
                  node: {
                      ...node,
                      children: [...(node.children ?? []), ...nodes]
                  }
              }
            : { status: 'not-frame', node };
    }

    if (node.type !== 'frame' || !node.children) {
        return { status: 'not-found', node };
    }

    let status: AppendResult['status'] = 'not-found';
    const children = node.children.map((child) => {
        if (status !== 'not-found') {
            return child;
        }

        const result = appendToTarget(child, targetNodeId, nodes);
        status = result.status;
        return result.node;
    });

    return status === 'not-found'
        ? { status, node }
        : { status, node: { ...node, children } };
};

export const appendMiaomaDesignFragment = ({
    state,
    expectedRevision,
    assignment,
    fragment
}: {
    state: MiaomaDesignDocumentState;
    expectedRevision: number;
    assignment: MiaomaGenerationAssignment;
    fragment: MiaomaDesignFragment;
}): MiaomaDesignDocumentState => {
    assertRevision(state, expectedRevision);
    if (fragment.assignmentId !== assignment.assignmentId) {
        throw new MiaomaDesignGenerationError({
            code: 'assignment-mismatch',
            message: 'Design fragment does not match its assignment.'
        });
    }

    const targetNodeIds = assignment.region.targetNodeIds;
    if (!targetNodeIds || targetNodeIds.length !== 1) {
        throw new MiaomaDesignGenerationError({
            code: 'target-not-found',
            message: 'Assignment must identify one target frame.'
        });
    }

    const documentNodeIds = collectNodeIds(state.document.children);
    const fragmentNodeIds = collectNodeIds(fragment.nodes);
    const collision = [...fragmentNodeIds].find((id) =>
        documentNodeIds.has(id)
    );
    if (collision) {
        throw new MiaomaDesignGenerationError({
            code: 'duplicate-node-id',
            message: `Generated node id already exists: ${collision}.`
        });
    }

    let status: AppendResult['status'] = 'not-found';
    const children = state.document.children.map((node) => {
        if (status !== 'not-found') {
            return node;
        }

        const result = appendToTarget(node, targetNodeIds[0], fragment.nodes);
        status = result.status;
        return result.node;
    });

    if (status === 'not-found') {
        throw new MiaomaDesignGenerationError({
            code: 'target-not-found',
            message: `Target node was not found: ${targetNodeIds[0]}.`
        });
    }
    if (status === 'not-frame') {
        throw new MiaomaDesignGenerationError({
            code: 'target-not-frame',
            message: `Target node is not a frame: ${targetNodeIds[0]}.`
        });
    }

    return {
        document: validateDocument({ ...state.document, children }),
        revision: state.revision + 1
    };
};
