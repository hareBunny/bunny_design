/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import * as z from 'zod/v4';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type {
    CallToolResult,
    ToolAnnotations
} from '@modelcontextprotocol/sdk/types.js';

import {
    MIAOMA_MCP_CONFIG_NAME,
    MIAOMA_MCP_SERVER_VERSION,
    type MiaomaMcpAppClient,
    MiaomaMcpError
} from './types';

const READ_ONLY_TOOL_ANNOTATIONS: ToolAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
};

const SERVER_INSTRUCTIONS =
    'Read the selected Miaoma frame JSON before implementing code. Use get_assets only for referenced miaoma-asset URLs. Use get_screenshot after implementation as the design-side visual reference for verification. All tools are read-only and scoped to the active Miaoma project.';
const ASSET_URI_PREFIX = 'miaoma-asset://';

const normalizeAssetId = (value: string) =>
    value.startsWith(ASSET_URI_PREFIX)
        ? value.slice(ASSET_URI_PREFIX.length)
        : value;

const jsonContent = (value: unknown): CallToolResult => ({
    content: [
        {
            type: 'text',
            text: JSON.stringify(value, null, 2)
        }
    ]
});

const errorContent = (error: unknown): CallToolResult => {
    const normalizedError =
        error instanceof MiaomaMcpError
            ? error
            : new MiaomaMcpError(
                  'INTERNAL_ERROR',
                  error instanceof Error
                      ? error.message
                      : 'Unknown Miaoma MCP error.'
              );

    return {
        isError: true,
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    error: {
                        code: normalizedError.code,
                        message: normalizedError.message
                    }
                })
            }
        ]
    };
};

const withToolErrors =
    <TInput>(handler: (input: TInput) => Promise<CallToolResult>) =>
    async (input: TInput): Promise<CallToolResult> => {
        try {
            return await handler(input);
        } catch (error) {
            return errorContent(error);
        }
    };

export const createMiaomaMcpServer = ({
    appClient
}: {
    appClient: MiaomaMcpAppClient;
}) => {
    const server = new McpServer(
        {
            name: MIAOMA_MCP_CONFIG_NAME,
            version: MIAOMA_MCP_SERVER_VERSION
        },
        {
            instructions: SERVER_INSTRUCTIONS
        }
    );

    server.registerTool(
        'get_app_state',
        {
            title: 'Get Miaoma app state',
            description:
                'Get whether Miaoma is running and the active project and selection context.',
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        withToolErrors(async () => jsonContent(await appClient.getAppState()))
    );

    server.registerTool(
        'get_selected_node',
        {
            title: 'Get selected Miaoma node',
            description:
                'Get the selected node as canonical MiaomaDesignNode JSON, including the complete descendant tree.',
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        withToolErrors(async () =>
            jsonContent(await appClient.getSelectedNode())
        )
    );

    server.registerTool(
        'get_nodes',
        {
            title: 'Get Miaoma nodes',
            description:
                'Get multiple nodes from the active project as canonical MiaomaDesignNode JSON, including each complete descendant tree.',
            inputSchema: {
                nodeIds: z
                    .array(z.string().min(1))
                    .min(1)
                    .max(100)
                    .describe(
                        'Node identifiers from the active Miaoma project.'
                    )
            },
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        withToolErrors(async ({ nodeIds }) =>
            jsonContent(
                await appClient.getNodes({
                    nodeIds: [...new Set(nodeIds)]
                })
            )
        )
    );

    server.registerTool(
        'get_screenshot',
        {
            title: 'Get Miaoma frame screenshot',
            description:
                'Render a frame at 1:1 design pixels without editor chrome. Defaults to the selected frame.',
            inputSchema: {
                nodeId: z
                    .string()
                    .min(1)
                    .optional()
                    .describe(
                        'Optional frame node identifier. Defaults to the current selection.'
                    )
            },
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        withToolErrors(async ({ nodeId }) => {
            const screenshot = await appClient.getScreenshot({
                nodeId
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            nodeId: screenshot.nodeId,
                            width: screenshot.width,
                            height: screenshot.height
                        })
                    },
                    {
                        type: 'image',
                        data: screenshot.data,
                        mimeType: screenshot.mimeType
                    }
                ]
            };
        })
    );

    server.registerTool(
        'get_assets',
        {
            title: 'Get Miaoma image assets',
            description:
                'Resolve miaoma-asset URLs returned by node tools into binary image content.',
            inputSchema: {
                assetIds: z
                    .array(z.string().min(1))
                    .min(1)
                    .max(20)
                    .describe(
                        'Asset identifiers from miaoma-asset URLs in node JSON.'
                    )
            },
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        withToolErrors(async ({ assetIds }) => {
            const assets = await appClient.getAssets({
                assetIds: [...new Set(assetIds.map(normalizeAssetId))]
            });

            return {
                content: assets.flatMap((asset) => [
                    {
                        type: 'text' as const,
                        text: JSON.stringify({
                            assetId: asset.assetId,
                            mimeType: asset.mimeType
                        })
                    },
                    {
                        type: 'image' as const,
                        data: asset.data,
                        mimeType: asset.mimeType
                    }
                ])
            };
        })
    );

    return server;
};

export const startMiaomaMcpStdioServer = async ({
    appClient
}: {
    appClient: MiaomaMcpAppClient;
}) => {
    const server = createMiaomaMcpServer({ appClient });
    const transport = new StdioServerTransport();

    await server.connect(transport);

    return server;
};
