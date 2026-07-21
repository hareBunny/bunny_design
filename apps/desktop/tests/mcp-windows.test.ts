/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import { resolveMiaomaCodexExecutable } from '../client/codexExecutable';
import { getMiaomaMcpBridgeEndpoint } from '../client/mcp/endpoint';
import { getMiaomaMcpSidecarPath } from '../client/mcp/sidecarPath';

describe('Miaoma MCP Windows support', () => {
    it('uses a stable per-user Windows named pipe', () => {
        const endpoint = getMiaomaMcpBridgeEndpoint({
            platform: 'win32',
            userDataPath: 'C:\\Users\\Alice\\AppData\\Roaming\\Miaoma'
        });
        const sameUserEndpoint = getMiaomaMcpBridgeEndpoint({
            platform: 'win32',
            userDataPath: 'c:\\users\\alice\\appdata\\roaming\\miaoma'
        });
        const otherUserEndpoint = getMiaomaMcpBridgeEndpoint({
            platform: 'win32',
            userDataPath: 'C:\\Users\\Bob\\AppData\\Roaming\\Miaoma'
        });

        expect(endpoint).toMatch(
            /^\\\\\.\\pipe\\miaomadesign-mcp-[a-f0-9]{16}$/
        );
        expect(sameUserEndpoint).toBe(endpoint);
        expect(otherUserEndpoint).not.toBe(endpoint);
    });

    it('resolves an installed Windows Codex executable before PATH fallback', () => {
        const installedCodex =
            'C:\\Users\\Alice\\AppData\\Local\\Programs\\ChatGPT\\resources\\codex.exe';

        expect(
            resolveMiaomaCodexExecutable({
                environment: {
                    LOCALAPPDATA: 'C:\\Users\\Alice\\AppData\\Local'
                },
                fileExists: (candidate) => candidate === installedCodex,
                platform: 'win32',
                resourcesPath: 'C:\\Program Files\\Miaoma\\resources'
            })
        ).toBe(installedCodex);
        expect(
            resolveMiaomaCodexExecutable({
                environment: {},
                fileExists: () => false,
                platform: 'win32',
                resourcesPath: 'C:\\Program Files\\Miaoma\\resources'
            })
        ).toBe('codex.exe');
    });

    it('resolves development and packaged sidecar paths', () => {
        expect(
            getMiaomaMcpSidecarPath({
                appPath: 'C:\\workspace\\apps\\desktop',
                isPackaged: false,
                platform: 'win32',
                resourcesPath: 'C:\\workspace\\apps\\desktop\\resources'
            })
        ).toBe(
            'C:\\workspace\\packages\\miaoma-mcp\\bin\\miaoma-mcp-win32-x64.exe'
        );
        expect(
            getMiaomaMcpSidecarPath({
                appPath: 'C:\\Program Files\\Miaoma\\resources\\app',
                isPackaged: true,
                platform: 'win32',
                resourcesPath: 'C:\\Program Files\\Miaoma\\resources'
            })
        ).toBe(
            'C:\\Program Files\\Miaoma\\resources\\bin\\miaoma-mcp-win32-x64.exe'
        );
    });
});
