/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it, vi } from 'vitest';

import {
    buildMiaomaMcpStdioRegistration,
    type MiaomaMcpCommandRunner,
    synchronizeMiaomaMcpRegistration
} from '../client/mcp/registration';

describe('Miaoma MCP registration', () => {
    it('builds development and packaged commands from platform runtime paths', () => {
        expect(
            buildMiaomaMcpStdioRegistration({
                appPath: '/workspace/apps/desktop',
                executablePath: '/workspace/node_modules/electron/Electron',
                isPackaged: false,
                platform: 'darwin'
            })
        ).toEqual({
            command: '/workspace/node_modules/electron/Electron',
            args: ['/workspace/apps/desktop', '--mcp-stdio', '--app', 'desktop']
        });
        expect(
            buildMiaomaMcpStdioRegistration({
                appPath: '/Applications/Miaoma.app/Contents/Resources/app.asar',
                executablePath:
                    '/Applications/Miaoma.app/Contents/MacOS/Miaoma',
                isPackaged: true,
                platform: 'darwin'
            })
        ).toEqual({
            command: '/Applications/Miaoma.app/Contents/MacOS/Miaoma',
            args: ['--mcp-stdio', '--app', 'desktop']
        });
        expect(
            buildMiaomaMcpStdioRegistration({
                appPath: 'C:\\workspace\\apps\\desktop',
                bridgeEndpoint:
                    '\\\\.\\pipe\\miaomadesign-mcp-0123456789abcdef',
                executablePath:
                    'C:\\workspace\\node_modules\\electron\\dist\\electron.exe',
                isPackaged: false,
                platform: 'win32',
                sidecarPath:
                    'C:\\workspace\\packages\\miaoma-mcp\\bin\\miaoma-mcp-win32-x64.exe'
            })
        ).toEqual({
            command:
                'C:\\workspace\\packages\\miaoma-mcp\\bin\\miaoma-mcp-win32-x64.exe',
            args: [
                '--app',
                'desktop',
                '--bridge-endpoint',
                '\\\\.\\pipe\\miaomadesign-mcp-0123456789abcdef'
            ]
        });
        expect(
            buildMiaomaMcpStdioRegistration({
                appPath: 'C:\\Program Files\\Miaoma\\resources\\app',
                bridgeEndpoint:
                    '\\\\.\\pipe\\miaomadesign-mcp-0123456789abcdef',
                executablePath: 'C:\\Program Files\\Miaoma\\Miaoma.exe',
                isPackaged: true,
                platform: 'win32',
                sidecarPath:
                    'C:\\Program Files\\Miaoma\\resources\\bin\\miaoma-mcp-win32-x64.exe'
            })
        ).toEqual({
            command:
                'C:\\Program Files\\Miaoma\\resources\\bin\\miaoma-mcp-win32-x64.exe',
            args: [
                '--app',
                'desktop',
                '--bridge-endpoint',
                '\\\\.\\pipe\\miaomadesign-mcp-0123456789abcdef'
            ]
        });
        expect(
            buildMiaomaMcpStdioRegistration({
                appPath: '/workspace/apps/desktop',
                executablePath: '/workspace/electron',
                isPackaged: false,
                platform: 'linux'
            })
        ).toBeNull();
    });

    it('leaves an exact registration unchanged', async () => {
        const registration = {
            command: '/Applications/Miaoma.app/Contents/MacOS/Miaoma',
            args: ['--mcp-stdio', '--app', 'desktop']
        };
        const runCommand = vi.fn<MiaomaMcpCommandRunner>(async () => ({
            exitCode: 0,
            stdout: JSON.stringify([
                {
                    name: 'miaomadesign',
                    enabled: true,
                    transport: {
                        type: 'stdio',
                        command: registration.command,
                        args: registration.args
                    }
                }
            ]),
            stderr: ''
        }));

        await expect(
            synchronizeMiaomaMcpRegistration({
                codexExecutable: '/usr/local/bin/codex',
                registration,
                runCommand
            })
        ).resolves.toBe('unchanged');
        expect(runCommand).toHaveBeenCalledTimes(1);
    });

    it('replaces a stale registration with the current absolute path', async () => {
        const calls: string[][] = [];
        const runCommand: MiaomaMcpCommandRunner = async ({ args }) => {
            calls.push(args);

            return {
                exitCode: 0,
                stdout: args.includes('list')
                    ? JSON.stringify([
                          {
                              name: 'miaomadesign',
                              enabled: true,
                              transport: {
                                  type: 'stdio',
                                  command: '/old/Miaoma',
                                  args: ['--app', 'desktop']
                              }
                          }
                      ])
                    : '',
                stderr: ''
            };
        };

        await expect(
            synchronizeMiaomaMcpRegistration({
                codexExecutable: 'codex',
                registration: {
                    command: '/Applications/Miaoma',
                    args: ['--mcp-stdio', '--app', 'desktop']
                },
                runCommand
            })
        ).resolves.toBe('registered');
        expect(calls).toEqual([
            ['mcp', 'list', '--json'],
            ['mcp', 'remove', 'miaomadesign'],
            [
                'mcp',
                'add',
                'miaomadesign',
                '--',
                '/Applications/Miaoma',
                '--mcp-stdio',
                '--app',
                'desktop'
            ]
        ]);
    });
});
