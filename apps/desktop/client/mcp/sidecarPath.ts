/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import path from 'node:path';

const WINDOWS_MCP_SIDECAR_NAME = 'miaoma-mcp-win32-x64.exe';

export const getMiaomaMcpSidecarPath = ({
    appPath,
    isPackaged,
    platform,
    resourcesPath
}: {
    appPath: string;
    isPackaged: boolean;
    platform: NodeJS.Platform;
    resourcesPath: string;
}) => {
    if (platform !== 'win32') {
        return null;
    }

    return isPackaged
        ? path.win32.join(resourcesPath, 'bin', WINDOWS_MCP_SIDECAR_NAME)
        : path.win32.resolve(
              appPath,
              '../../packages/miaoma-mcp/bin',
              WINDOWS_MCP_SIDECAR_NAME
          );
};
