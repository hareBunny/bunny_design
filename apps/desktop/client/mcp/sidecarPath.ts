/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readdir } from 'node:fs/promises';
import path from 'node:path';

const WINDOWS_MCP_SIDECAR_NAME = 'miaoma-mcp-win32-x64.exe';
const WINDOWS_MCP_SIDECAR_DEVELOPMENT_PREFIX = 'miaoma-mcp-win32-x64-';

const findLatestDevelopmentSidecar = async (directory: string) => {
    try {
        const files = await readdir(directory);
        const sidecars = files
            .filter(
                (file) =>
                    file.startsWith(WINDOWS_MCP_SIDECAR_DEVELOPMENT_PREFIX) &&
                    file.endsWith('.exe')
            )
            .sort();

        return sidecars.at(-1) ?? null;
    } catch {
        return null;
    }
};

export const getMiaomaMcpSidecarPath = async ({
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

    const directory = isPackaged
        ? path.win32.join(resourcesPath, 'bin')
        : path.win32.resolve(appPath, '../../packages/miaoma-mcp/bin');

    if (isPackaged) {
        return path.win32.join(directory, WINDOWS_MCP_SIDECAR_NAME);
    }

    const developmentSidecar = await findLatestDevelopmentSidecar(directory);

    return developmentSidecar
        ? path.win32.join(directory, developmentSidecar)
        : path.win32.join(directory, WINDOWS_MCP_SIDECAR_NAME);
};
