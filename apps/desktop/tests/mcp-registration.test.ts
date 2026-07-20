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
    it('builds development and packaged macOS commands from runtime paths', () => {
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
