/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { MiaomaEditorScreen } from '../renderer/pages/MiaomaEditorScreen';

const rendererFile = (relativePath: string) =>
    fileURLToPath(new URL(`../renderer/${relativePath}`, import.meta.url));

const rendererSource = (relativePath: string) =>
    readFileSync(rendererFile(relativePath), 'utf8');

describe('MiaomaEditorScreen', () => {
    it('renders the editor foundation from the Pencil layers base design', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);

        expect(markup).toContain('miaoma-magicut.miaomadesign — Edited');
        expect(markup).toContain('data-design-frame="tzVyN"');
        expect(markup).toContain('data-sidebar-width="300"');
        expect(markup).toContain('data-canvas-width="1352"');
        expect(markup).toContain('data-region="left-sidebar"');
        expect(markup).toContain('data-region="canvas-stage"');
        expect(markup).toContain('data-region="right-inspector"');
        expect(markup).not.toContain('Share');
        expect(markup).not.toContain('Present');
        expect(markup).not.toContain('Ask Miaoma');
    });

    it('keeps sidebar actions without custom window control lights', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);

        expect(markup).toContain('Toggle sidebar');
        expect(markup).toContain('Create item');
        expect(markup).not.toContain('editor-traffic-light');
    });

    it('reserves left toolbar space for system traffic lights', () => {
        const styles = rendererSource('index.css');
        const leftSidebarSource = rendererSource(
            'components/editor/LeftSidebar.tsx'
        );

        expect(styles).toContain('--editor-system-traffic-light-space: 72px;');
        expect(leftSidebarSource).toContain(
            '[padding-left:calc(var(--editor-system-traffic-light-space)+20px)]'
        );
    });

    it('keeps the left layer tree hierarchy from the Pencil frame', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);

        expect(markup).toContain('Content');
        expect(markup).toContain('Right Divider');
        expect(markup).toContain('Right Inspector');
        expect(markup).toContain('Chrome Bottom Divider');
        expect(markup).toContain('Main Right Region');
        expect(markup).toContain('Main Title Region');
        expect(markup).toContain('Document Title');
        expect(markup).toContain('Miaoma Editor Recreation');
        expect(markup).toContain('Sidebar Surface');
        expect(markup).toContain('data-depth="0"');
        expect(markup).toContain('data-depth="1"');
        expect(markup).toContain('data-selected="true"');
    });

    it('renders the detailed right inspector controls from the Pencil frame', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);

        expect(markup).toContain('alt="Miaoma logo"');
        expect(markup).toContain('妙笔 AI');
        expect(markup).toContain('miaomadesign');
        expect(markup).toContain('Miaoma Editor Recr');
        expect(markup).toContain('Create Component');
        expect(markup).toContain('Context');
        expect(markup).toContain('Alignment');
        expect(markup.match(/aria-label="Align /g)).toHaveLength(6);
        expect(markup).toContain('Position');
        expect(markup).toContain('>X</');
        expect(markup).toContain('>Y</');
        expect(markup).toContain('>R</');
        expect(markup).toContain('Layout');
        expect(markup).toContain('>W</');
        expect(markup).toContain('1920');
        expect(markup).toContain('>H</');
        expect(markup).toContain('1205');
        expect(markup).toContain('Fill Width');
        expect(markup).toContain('Fill Height');
        expect(markup).toContain('Clip Content');
        expect(markup).toContain('Appearance');
        expect(markup).toContain('% 100');
        expect(markup).toContain('Fill');
        expect(markup).toContain('#f3f4f6');
        expect(markup).toContain('100%');
        expect(markup).toContain('Stroke');
        expect(markup).toContain('Effects');
        expect(markup).toContain('2x');
        expect(markup).toContain('PNG');
        expect(markup).toContain('Export layer');
    });

    it('renders the canvas selection and prompt dock details', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);

        expect(markup).toContain('Frame 3');
        expect(markup).toContain('3898 × 2795');
        expect(markup).toContain('aria-label="Prompt"');
        expect(markup).toContain('editor-prompt-input');
        expect(markup).toContain('placeholder="Design anything..."');
        expect(markup).toContain('<textarea');
        expect(markup).toContain('⚡ 6x');
        expect(markup).toContain('GPT 5.5');
        expect(markup).toContain('15%');
    });

    it('places the frame prompt pill inside the prompt dock', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const promptDockStart = markup.indexOf('editor-prompt-dock');
        const promptDockEnd = markup.indexOf('</section>', promptDockStart);
        const framePill = markup.indexOf('editor-selection-pill');

        expect(promptDockStart).toBeGreaterThan(-1);
        expect(promptDockEnd).toBeGreaterThan(promptDockStart);
        expect(framePill).toBeGreaterThan(promptDockStart);
        expect(framePill).toBeLessThan(promptDockEnd);
    });

    it('matches the updated Sidebar Body and selected layer styling hooks', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const leftSidebarSource = rendererSource(
            'components/editor/LeftSidebar.tsx'
        );

        expect(markup).toContain('editor-sidebar-body');
        expect(markup).toContain('px-2');
        expect(markup).toContain('pb-6');
        expect(leftSidebarSource).toContain('h-9');
        expect(leftSidebarSource).toContain('rounded-[10px]');
        expect(leftSidebarSource).toContain('bg-[#d9dadd]');
        expect(leftSidebarSource).toContain('w-[46px]');
        expect(leftSidebarSource).toContain('h-[34px]');
        expect(leftSidebarSource).toContain('rounded-[9px]');
        expect(leftSidebarSource).toContain('shadow-[0_1px_4px_#00000012]');
    });

    it('renders Canvas Stage as an infinite canvas surface', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);

        expect(markup).toContain('aria-label="Infinite canvas"');
        expect(markup).toContain('editor-infinite-canvas');
        expect(markup).toContain('w-[4000px]');
        expect(markup).toContain('h-[3000px]');
    });

    it('keeps the editor implementation split by responsibility', () => {
        [
            'components/editor/MiaomaEditor.tsx',
            'components/editor/TopHeader.tsx',
            'components/editor/LeftSidebar.tsx',
            'components/editor/CanvasStage.tsx',
            'components/editor/RightInspector.tsx',
            'constants/editor.ts',
            'types/editor.ts',
            'utils/classNames.ts'
        ].forEach((relativePath) => {
            expect(existsSync(rendererFile(relativePath)), relativePath).toBe(
                true
            );
        });
    });

    it('uses the Tailwind v4 CSS-first editor styling path', () => {
        const styles = rendererSource('index.css');
        const topHeaderSource = rendererSource(
            'components/editor/TopHeader.tsx'
        );

        expect(styles).toContain("@import 'tailwindcss';");
        expect(styles).toContain('@theme');
        expect(styles).not.toContain('@layer components');
        expect(topHeaderSource).toContain('h-12');
        expect(topHeaderSource).toContain('px-3.5');
    });
});
