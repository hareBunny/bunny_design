/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { createHash } from 'node:crypto';
import path from 'node:path';

const MIAOMA_MCP_SOCKET_NAME = 'miaomadesign-mcp.sock';

export const getMiaomaMcpBridgeEndpoint = ({
    platform,
    userDataPath
}: {
    platform: NodeJS.Platform;
    userDataPath: string;
}) => {
    if (platform === 'darwin') {
        return path.join(userDataPath, MIAOMA_MCP_SOCKET_NAME);
    }

    if (platform === 'win32') {
        const userScope = createHash('sha256')
            .update(userDataPath.toLowerCase())
            .digest('hex')
            .slice(0, 16);

        return `\\\\.\\pipe\\miaomadesign-mcp-${userScope}`;
    }

    return null;
};
