/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { spawn } from 'node:child_process';

import { MIAOMA_MCP_CONFIG_NAME } from '@miaoma-design-ai/miaoma-mcp';

type CommandResult = {
    exitCode: number | null;
    stdout: string;
    stderr: string;
};

export type MiaomaMcpCommandRunner = (input: {
    command: string;
    args: string[];
}) => Promise<CommandResult>;

export type MiaomaMcpStdioRegistration = {
    command: string;
    args: string[];
};

type CodexMcpListEntry = {
    name?: unknown;
    enabled?: unknown;
    transport?: {
        type?: unknown;
        command?: unknown;
        args?: unknown;
    };
};

export const runMiaomaMcpCommand: MiaomaMcpCommandRunner = ({
    command,
    args
}) =>
    new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk: string) => {
            stdout += chunk;
        });
        child.stderr.on('data', (chunk: string) => {
            stderr += chunk;
        });
        child.once('error', reject);
        child.once('close', (exitCode) => {
            resolve({ exitCode, stdout, stderr });
        });
    });

export const buildMiaomaMcpStdioRegistration = ({
    appPath,
    executablePath,
    isPackaged,
    platform
}: {
    appPath: string;
    executablePath: string;
    isPackaged: boolean;
    platform: NodeJS.Platform;
}): MiaomaMcpStdioRegistration | null => {
    if (platform !== 'darwin') {
        return null;
    }

    return {
        command: executablePath,
        args: [
            ...(isPackaged ? [] : [appPath]),
            '--mcp-stdio',
            '--app',
            'desktop'
        ]
    };
};

const parseMcpList = (stdout: string): CodexMcpListEntry[] => {
    const value = JSON.parse(stdout) as unknown;

    if (!Array.isArray(value)) {
        throw new Error('Codex returned an invalid MCP server list.');
    }

    return value as CodexMcpListEntry[];
};

const isSameRegistration = (
    entry: CodexMcpListEntry,
    registration: MiaomaMcpStdioRegistration
) =>
    entry.enabled === true &&
    entry.transport?.type === 'stdio' &&
    entry.transport.command === registration.command &&
    Array.isArray(entry.transport.args) &&
    entry.transport.args.length === registration.args.length &&
    entry.transport.args.every(
        (value, index) => value === registration.args[index]
    );

const requireSuccessfulCommand = (result: CommandResult, operation: string) => {
    if (result.exitCode === 0) {
        return;
    }

    throw new Error(
        `${operation} failed${result.stderr.trim() ? `: ${result.stderr.trim()}` : '.'}`
    );
};

export const synchronizeMiaomaMcpRegistration = async ({
    codexExecutable,
    registration,
    runCommand = runMiaomaMcpCommand
}: {
    codexExecutable: string;
    registration: MiaomaMcpStdioRegistration | null;
    runCommand?: MiaomaMcpCommandRunner;
}): Promise<'registered' | 'unchanged' | 'unsupported'> => {
    if (!registration) {
        return 'unsupported';
    }

    const listResult = await runCommand({
        command: codexExecutable,
        args: ['mcp', 'list', '--json']
    });
    requireSuccessfulCommand(listResult, 'Reading Codex MCP configuration');

    const existing = parseMcpList(listResult.stdout).find(
        ({ name }) => name === MIAOMA_MCP_CONFIG_NAME
    );

    if (existing && isSameRegistration(existing, registration)) {
        return 'unchanged';
    }

    if (existing) {
        const removeResult = await runCommand({
            command: codexExecutable,
            args: ['mcp', 'remove', MIAOMA_MCP_CONFIG_NAME]
        });
        requireSuccessfulCommand(
            removeResult,
            'Removing stale Miaoma MCP configuration'
        );
    }

    const addResult = await runCommand({
        command: codexExecutable,
        args: [
            'mcp',
            'add',
            MIAOMA_MCP_CONFIG_NAME,
            '--',
            registration.command,
            ...registration.args
        ]
    });
    requireSuccessfulCommand(addResult, 'Registering Miaoma MCP server');

    return 'registered';
};
