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
    type MiaomaDesignRepairBatch,
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

const upsertRegionInTarget = (
    node: MiaomaDesignNode,
    targetNodeId: string,
    region: MiaomaDesignNode,
    bounds?: MiaomaGenerationAssignment['region']['bounds']
): AppendResult => {
    if (node.id === targetNodeId) {
        if (node.type !== 'frame') {
            return { status: 'not-frame', node };
        }

        const existingChildren = node.children ?? [];
        const hasRegion = existingChildren.some(({ id }) => id === region.id);

        return {
            status: 'updated',
            node: {
                ...node,
                width:
                    bounds && typeof node.width === 'number'
                        ? Math.max(node.width, bounds.x + bounds.width)
                        : node.width,
                height:
                    bounds && typeof node.height === 'number'
                        ? Math.max(node.height, bounds.y + bounds.height)
                        : node.height,
                children: hasRegion
                    ? existingChildren.map((child) =>
                          child.id === region.id ? region : child
                      )
                    : [...existingChildren, region]
            }
        };
    }

    if (node.type !== 'frame' || !node.children) {
        return { status: 'not-found', node };
    }

    let status: AppendResult['status'] = 'not-found';
    const children = node.children.map((child) => {
        if (status !== 'not-found') {
            return child;
        }

        const result = upsertRegionInTarget(
            child,
            targetNodeId,
            region,
            bounds
        );
        status = result.status;
        return result.node;
    });

    return status === 'not-found'
        ? { status, node }
        : { status, node: { ...node, children } };
};

export const placeMiaomaDesignRegionScaffolds = ({
    state,
    expectedRevision,
    assignments
}: {
    state: MiaomaDesignDocumentState;
    expectedRevision: number;
    assignments: readonly MiaomaGenerationAssignment[];
}): MiaomaDesignDocumentState => {
    assertRevision(state, expectedRevision);
    let children = state.document.children;

    for (const assignment of assignments) {
        const targetNodeIds = assignment.region.targetNodeIds;
        if (!targetNodeIds || targetNodeIds.length !== 1) {
            throw new MiaomaDesignGenerationError({
                code: 'target-not-found',
                message: 'Assignment must identify one target frame.'
            });
        }

        const bounds = assignment.region.bounds;
        const scaffold: MiaomaDesignNode = {
            id: assignment.region.regionId,
            type: 'frame',
            name: assignment.region.label,
            ...(bounds
                ? {
                      x: bounds.x,
                      y: bounds.y,
                      width: bounds.width,
                      height: bounds.height
                  }
                : { width: 'fill_container' as const, height: 160 }),
            clip: true,
            layout: 'none',
            children: []
        };
        let status: AppendResult['status'] = 'not-found';

        children = children.map((node) => {
            if (status !== 'not-found') {
                return node;
            }
            const result = upsertRegionInTarget(
                node,
                targetNodeIds[0],
                scaffold,
                bounds
            );
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
    }

    return {
        document: validateDocument({ ...state.document, children }),
        revision: state.revision + 1
    };
};

const appendToTarget = (
    node: MiaomaDesignNode,
    targetNodeId: string,
    nodes: MiaomaDesignNode[],
    bounds?: MiaomaGenerationAssignment['region']['bounds']
): AppendResult => {
    if (node.id === targetNodeId) {
        return node.type === 'frame'
            ? {
                  status: 'updated',
                  node: {
                      ...node,
                      width:
                          bounds && typeof node.width === 'number'
                              ? Math.max(node.width, bounds.x + bounds.width)
                              : node.width,
                      height:
                          bounds && typeof node.height === 'number'
                              ? Math.max(node.height, bounds.y + bounds.height)
                              : node.height,
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

        const result = appendToTarget(child, targetNodeId, nodes, bounds);
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
    const bounds = assignment.region.bounds;
    const fragmentNodes = bounds
        ? fragment.nodes.map((node) => ({
              ...node,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height
          }))
        : fragment.nodes;
    const fragmentNodeIds = collectNodeIds(fragmentNodes);
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

        const result = appendToTarget(
            node,
            targetNodeIds[0],
            fragmentNodes,
            bounds
        );
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

const replaceNodes = (
    node: MiaomaDesignNode,
    replacements: ReadonlyMap<string, MiaomaDesignNode>
): { node: MiaomaDesignNode; found: Set<string> } => {
    const replacement = replacements.get(node.id);
    if (replacement) {
        return { node: replacement, found: new Set([node.id]) };
    }

    if (node.type !== 'frame' || !node.children) {
        return { node, found: new Set() };
    }

    const found = new Set<string>();
    const children = node.children.map((child) => {
        const result = replaceNodes(child, replacements);
        result.found.forEach((id) => found.add(id));
        return result.node;
    });

    return { node: { ...node, children }, found };
};

export const replaceMiaomaDesignRegionFragment = ({
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

    const region = fragment.nodes[0];
    if (!region || region.id !== assignment.region.regionId) {
        throw new MiaomaDesignGenerationError({
            code: 'assignment-mismatch',
            message: `Design fragment must replace region ${assignment.region.regionId}.`
        });
    }

    const bounds = assignment.region.bounds;
    const replacement = bounds
        ? {
              ...region,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height
          }
        : region;
    const replacements = new Map([[replacement.id, replacement]]);
    const found = new Set<string>();
    const children = state.document.children.map((node) => {
        const result = replaceNodes(node, replacements);
        result.found.forEach((id) => found.add(id));
        return result.node;
    });

    if (!found.has(replacement.id)) {
        throw new MiaomaDesignGenerationError({
            code: 'target-not-found',
            message: `Planned region was not found: ${replacement.id}.`
        });
    }

    return {
        document: validateDocument({ ...state.document, children }),
        revision: state.revision + 1
    };
};

export const replaceMiaomaDesignRepairs = ({
    state,
    expectedRevision,
    batch
}: {
    state: MiaomaDesignDocumentState;
    expectedRevision: number;
    batch: MiaomaDesignRepairBatch;
}): MiaomaDesignDocumentState => {
    assertRevision(state, expectedRevision);
    const replacements = new Map<string, MiaomaDesignNode>();
    batch.repairs.forEach((repair) =>
        repair.nodes.forEach((node) => replacements.set(node.id, node))
    );

    const found = new Set<string>();
    const children = state.document.children.map((node) => {
        const result = replaceNodes(node, replacements);
        result.found.forEach((id) => found.add(id));
        return result.node;
    });
    const missing = [...replacements.keys()].filter((id) => !found.has(id));
    if (missing.length > 0) {
        throw new MiaomaDesignGenerationError({
            code: 'target-not-found',
            message: `Repair target was not found: ${missing[0]}.`
        });
    }

    return {
        document: validateDocument({ ...state.document, children }),
        revision: state.revision + 1
    };
};
