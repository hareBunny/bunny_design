/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const mainProcessFile = fileURLToPath(
    new URL('../client/main.ts', import.meta.url)
);

describe('main window options', () => {
    it('hides the native title toolbar using app window options', () => {
        const source = readFileSync(mainProcessFile, 'utf8');

        expect(source).toMatch(/width:\s*1280/);
        expect(source).toMatch(/height:\s*800/);
        expect(source).toMatch(/minWidth:\s*1280/);
        expect(source).toMatch(/minHeight:\s*720/);
        expect(source).toMatch(/frame:\s*false/);
        expect(source).toMatch(/titleBarStyle:\s*'hidden'/);
        expect(source).toMatch(/autoHideMenuBar:\s*true/);
        expect(source).toMatch(/backgroundColor:\s*'#00000000'/);
        expect(source).toMatch(/trafficLightPosition:\s*{/);
        expect(source).toMatch(/vibrancy:\s*'sidebar'/);
        expect(source).toMatch(/visualEffectState:\s*'active'/);
        expect(source).toMatch(/transparent:\s*true/);
    });
});
