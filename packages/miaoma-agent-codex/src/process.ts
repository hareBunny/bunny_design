/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { spawn } from 'node:child_process';

export type MiaomaCodexProcessExit = {
    code: number | null;
    signal: string | null;
};

export type MiaomaCodexSpawnInput = {
    command: string;
    args: string[];
    cwd: string;
    stdin: string;
};

export type MiaomaCodexProcess = {
    processId?: number;
    stdout: AsyncIterable<string | Uint8Array>;
    stderr: AsyncIterable<string | Uint8Array>;
    waitForExit(): Promise<MiaomaCodexProcessExit>;
    terminate(signal: 'SIGKILL' | 'SIGTERM'): boolean;
};

export type MiaomaCodexProcessSpawner = (
    input: MiaomaCodexSpawnInput
) => MiaomaCodexProcess;

export const spawnMiaomaCodexProcess: MiaomaCodexProcessSpawner = ({
    command,
    args,
    cwd,
    stdin
}) => {
    const child = spawn(command, args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    // An early CLI exit is surfaced by waitForExit; ignore its duplicate pipe error.
    child.stdin.on('error', () => undefined);
    child.stdin.end(stdin);

    return {
        processId: child.pid,
        stdout: child.stdout,
        stderr: child.stderr,
        waitForExit: () =>
            new Promise((resolve, reject) => {
                child.once('error', reject);
                child.once('close', (code, signal) => {
                    resolve({ code, signal });
                });
            }),
        terminate: (signal) => child.kill(signal)
    };
};
