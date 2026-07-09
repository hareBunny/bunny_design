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
const preloadFile = fileURLToPath(
    new URL('../client/preload.ts', import.meta.url)
);

describe('desktop windows', () => {
    it('creates a Dashboard window as the default app surface', () => {
        const source = readFileSync(mainProcessFile, 'utf8');

        expect(source).toContain('const createDashboardWindow');
        expect(source).toMatch(/width:\s*1120/);
        expect(source).toMatch(/height:\s*760/);
        expect(source).toMatch(/minWidth:\s*960/);
        expect(source).toMatch(/minHeight:\s*640/);
        expect(source).toMatch(/frame:\s*false/);
        expect(source).toMatch(/titleBarStyle:\s*'hidden'/);
        expect(source).toMatch(/autoHideMenuBar:\s*true/);
        expect(source).toMatch(/backgroundColor:\s*'#00000000'/);
        expect(source).toMatch(/trafficLightPosition:\s*{/);
        expect(source).toMatch(/vibrancy:\s*'sidebar'/);
        expect(source).toMatch(/visualEffectState:\s*'active'/);
        expect(source).toMatch(/transparent:\s*true/);
        expect(source).toContain("hash: '/'");
    });

    it('creates independent Editor windows loaded through the editor hash route', () => {
        const source = readFileSync(mainProcessFile, 'utf8');

        expect(source).toContain('const createEditorWindow');
        expect(source).not.toContain('dashboardEditorWindows');
        expect(source).toContain('WINDOW_CASCADE_OFFSET');
        expect(source).toContain('editorWindowOpenCount');
        expect(source).toContain('dashboardBounds?.width ?? 1280');
        expect(source).toContain('dashboardBounds?.height ?? 800');
        expect(source).toMatch(/minWidth:\s*1280/);
        expect(source).toMatch(/minHeight:\s*800/);
        expect(source).toContain(
            '`/editor?projectId=${encodeURIComponent(projectId)}`'
        );
        expect(source).toContain('BrowserWindow.fromWebContents');
        expect(source).not.toContain('existingWindow');
    });

    it('registers project IPC handlers in the main process', () => {
        const source = readFileSync(mainProcessFile, 'utf8');

        expect(source).toContain('registerProjectIpcHandlers');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS.list');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS.create');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS.get');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS.open');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS.update');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS.delete');
        expect(source).not.toContain('miaoma-design-schema.json');
        expect(source).not.toContain('miaoma-design-design-schema.json');
        expect(source).not.toContain("template !== 'random'");
        expect(source).toContain('createProjectStore');
        expect(source).toContain("app.getPath('userData')");
    });

    it('exposes a narrow project API through preload', () => {
        const source = readFileSync(preloadFile, 'utf8');

        expect(source).toContain('ipcRenderer');
        expect(source).toContain('projects:');
        expect(source).toContain('list:');
        expect(source).toContain('create:');
        expect(source).toContain('get:');
        expect(source).toContain('open:');
        expect(source).toContain('update:');
        expect(source).toContain('delete:');
        expect(source).toContain('MIAOMA_PROJECT_IPC_CHANNELS');
    });
});
