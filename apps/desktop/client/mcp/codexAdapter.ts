/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    synchronizeMiaomaMcpRegistration,
    type MiaomaMcpCommandRunner,
    type MiaomaMcpStdioRegistration
} from './registration';

export type MiaomaCodexAdapterStatus =
    | { kind: 'configured'; changed: boolean }
    | { kind: 'not-installed' }
    | { kind: 'unsupported' }
    | { kind: 'failed'; error: Error };

const isExecutableUnavailable = (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT';

/**
 * Codex is an optional consumer of the local MCP bridge. Its absence must not
 * change the desktop application's own MCP availability.
 */
export const synchronizeMiaomaCodexAdapter = async ({
    codexExecutable,
    registration,
    runCommand
}: {
    codexExecutable: string;
    registration: MiaomaMcpStdioRegistration | null;
    runCommand?: MiaomaMcpCommandRunner;
}): Promise<MiaomaCodexAdapterStatus> => {
    try {
        const result = await synchronizeMiaomaMcpRegistration({
            codexExecutable,
            registration,
            runCommand
        });

        if (result === 'unsupported') {
            return { kind: 'unsupported' };
        }

        return {
            kind: 'configured',
            changed: result === 'registered'
        };
    } catch (error) {
        if (isExecutableUnavailable(error)) {
            return { kind: 'not-installed' };
        }

        return {
            kind: 'failed',
            error:
                error instanceof Error
                    ? error
                    : new Error('Unable to configure Codex MCP.')
        };
    }
};
