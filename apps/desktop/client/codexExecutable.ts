/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { existsSync } from 'node:fs';
import path from 'node:path';

export const getMiaomaCodexExecutable = () => {
    const configured = process.env.MIAOMA_CODEX_EXECUTABLE;
    const candidates = [
        configured,
        path.join(process.resourcesPath, 'codex'),
        '/Applications/ChatGPT.app/Contents/Resources/codex',
        'codex'
    ].filter((candidate): candidate is string => Boolean(candidate));

    return (
        candidates.find(
            (candidate) => candidate === 'codex' || existsSync(candidate)
        ) ?? 'codex'
    );
};
