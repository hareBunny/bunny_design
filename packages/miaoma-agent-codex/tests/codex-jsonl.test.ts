/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import { parseMiaomaCodexJsonlEvent } from '../src';

describe('Codex JSONL events', () => {
    it.each([
        {
            source: {
                type: 'thread.started',
                thread_id: 'thread-1'
            },
            expected: { type: 'thread-started', threadId: 'thread-1' }
        },
        {
            source: {
                type: 'item.started',
                item: {
                    id: 'item-1',
                    type: 'command_execution',
                    command: '/bin/zsh -lc pwd'
                }
            },
            expected: {
                type: 'activity',
                activity: {
                    sourceItemId: 'item-1',
                    kind: 'bash',
                    status: 'running',
                    input: { command: '/bin/zsh -lc pwd' }
                }
            }
        },
        {
            source: {
                type: 'item.completed',
                item: {
                    id: 'item-1',
                    type: 'command_execution',
                    command: '/bin/zsh -lc pwd',
                    status: 'completed',
                    exit_code: 0,
                    aggregated_output: '/workspace/project\n'
                }
            },
            expected: {
                type: 'activity',
                activity: {
                    sourceItemId: 'item-1',
                    kind: 'bash',
                    status: 'completed',
                    input: { command: '/bin/zsh -lc pwd' },
                    output: { summary: '/workspace/project' }
                }
            }
        },
        {
            source: {
                type: 'item.completed',
                item: {
                    id: 'item-2',
                    type: 'command_execution',
                    command: '/bin/zsh -lc false',
                    status: 'failed',
                    exit_code: 1
                }
            },
            expected: {
                type: 'activity',
                activity: {
                    sourceItemId: 'item-2',
                    kind: 'bash',
                    status: 'failed',
                    input: { command: '/bin/zsh -lc false' },
                    output: { summary: 'Command failed.' },
                    error: {
                        code: 'CODEX_COMMAND_FAILED',
                        message: 'Command exited with code 1.'
                    }
                }
            }
        },
        {
            source: {
                type: 'item.completed',
                item: {
                    id: 'item-3',
                    type: 'agent_message',
                    text: 'OK'
                }
            },
            expected: { type: 'message', text: 'OK' }
        }
    ])('maps $source.type', ({ source, expected }) => {
        expect(parseMiaomaCodexJsonlEvent(JSON.stringify(source))).toEqual(
            expected
        );
    });

    it('ignores unknown events', () => {
        expect(
            parseMiaomaCodexJsonlEvent(
                JSON.stringify({ type: 'item.updated', item: {} })
            )
        ).toBeNull();
    });
});
