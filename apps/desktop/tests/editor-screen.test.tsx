/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CanvasStage } from '../renderer/components/editor/CanvasStage';
import { LayoutConfigurationContent } from '../renderer/components/editor/FlexLayoutSection';
import { SidebarContent } from '../renderer/components/editor/LeftSidebar';
import { RightInspector } from '../renderer/components/editor/RightInspector';
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

    it('expands the native window drag region across the main top header', () => {
        const editorSource = rendererSource(
            'components/editor/MiaomaEditor.tsx'
        );

        expect(editorSource).toContain('editor-main-header');
        expect(editorSource).toContain('[-webkit-app-region:drag]');
        expect(editorSource).toContain('editor-agent-control');
        expect(editorSource).toContain('[-webkit-app-region:no-drag]');
    });

    it('renders the Layers tab from the current canvas JSON tree', () => {
        const markup = renderToStaticMarkup(
            <SidebarContent activeTab="layers" />
        );

        expect(markup).toContain('Miaoma Editor Recreation Course');
        expect(markup).toContain('Window Chrome');
        expect(markup).toContain('Prompt Dock Course');
        expect(markup).toContain('01-cover');
        expect(markup).toContain('MIAOMAEDU');
        expect(markup).toContain('AI 大前端 全栈架构师训练营');
        expect(markup).toContain('data-layer-node-type="frame"');
        expect(markup).toContain('data-layer-node-type="text"');
        expect(markup).toContain('data-depth="0"');
        expect(markup).toContain('data-depth="1"');
        expect(markup).toContain('data-depth="2"');
        expect(markup).toContain('data-selected="true"');
    });

    it('forces light appearance for macOS and renderer color scheme', () => {
        const mainSource = readFileSync(
            fileURLToPath(new URL('../client/main.ts', import.meta.url)),
            'utf8'
        );
        const styles = rendererSource('index.css');
        const html = readFileSync(
            fileURLToPath(new URL('../index.html', import.meta.url)),
            'utf8'
        );

        expect(mainSource).toContain("nativeTheme.themeSource = 'light'");
        expect(styles).toContain('color-scheme: light;');
        expect(html).toContain('name="color-scheme"');
        expect(html).toContain('content="light"');
    });

    it('renders the Sidebar Surface Agent frame as the default left sidebar tab', () => {
        const markup = renderToStaticMarkup(
            <SidebarContent activeTab="agent" />
        );
        const editorSource = rendererSource(
            'components/editor/MiaomaEditor.tsx'
        );

        expect(markup).toContain('editor-agent-panel');
        expect(markup).toContain('妙码学院 crm 系统');
        expect(markup).toContain(
            '正在检查 /Users/heyi/Downloads/miaoma-crm.pen'
        );
        expect(markup).toContain('Checked guidelines');
        expect(markup).toContain('Read variables');
        expect(markup).toContain('Read objects');
        expect(markup).toContain('Set variables');
        expect(markup).toContain('项激活后，请优化修改');
        expect(markup).toContain('Newton');
        expect(markup).toContain('Design anything...');
        expect(markup).toContain('GPT 5.5');
        expect(markup).toContain('editor-agent-prompt-dock');
        expect(markup).not.toContain('Sidebar Surface</span>');
        expect(editorSource).toContain('useState<SidebarTab>');
        expect(editorSource).toContain("useState<SidebarTab>('agent')");
        expect(editorSource).toContain('activeSidebarTab');
        expect(editorSource).toContain('onSelectTab={setActiveSidebarTab}');
    });

    it('matches the Left Sidebar Agent frame typography and sizing details', () => {
        const leftSidebarSource = rendererSource(
            'components/editor/LeftSidebar.tsx'
        );
        const agentPanelSource = rendererSource(
            'components/editor/SidebarAgentPanel.tsx'
        );
        const promptDockSource = rendererSource(
            'components/editor/PromptDock.tsx'
        );
        const styles = rendererSource('index.css');

        expect(leftSidebarSource).toContain('grid-rows-[30px_minmax(0,1fr)]');
        expect(leftSidebarSource).toContain('editor-tabs-row flex h-[30px]');
        expect(styles).toContain('--font-cn:');
        expect(agentPanelSource).toContain('font-cn');
        expect(agentPanelSource).toContain('text-[12px]/[normal]');
        expect(agentPanelSource).toContain('text-[12.5px]/[19px]');
        expect(promptDockSource).toContain('editor-agent-prompt-dock');
        expect(promptDockSource).toContain('h-[104px]');
        expect(promptDockSource).toContain('w-[277px]');
        expect(promptDockSource).toContain('text-[14px]/[normal]');
        expect(promptDockSource).toContain('text-xs text-[#5e5f67]');
    });

    it('keeps overflowing sidebar tab content scrollable on the y axis', () => {
        const agentMarkup = renderToStaticMarkup(
            <SidebarContent activeTab="agent" />
        );
        const layersMarkup = renderToStaticMarkup(
            <SidebarContent activeTab="layers" />
        );
        const agentPanelSource = rendererSource(
            'components/editor/SidebarAgentPanel.tsx'
        );

        expect(agentMarkup).toContain('editor-agent-timeline');
        expect(agentMarkup).toContain('overflow-y-auto');
        expect(agentMarkup).toContain('overflow-x-hidden');
        expect(agentPanelSource).toContain('flex-1');
        expect(agentPanelSource).toContain('shrink-0');
        expect(layersMarkup).toContain('editor-sidebar-body');
        expect(layersMarkup).toContain('overflow-y-auto');
        expect(layersMarkup).toContain('overflow-x-hidden');
    });

    it('renders the detailed right inspector controls from the Pencil frame', () => {
        const markup = renderToStaticMarkup(<RightInspector />);

        expect(markup).toContain('alt="Miaoma logo"');
        expect(markup).toContain('妙笔 AI');
        expect(markup).toContain('miaomadesign');
        expect(markup).toContain('Miaoma Editor Recr');
        expect(markup).toContain('Create Component');
        expect(markup).toContain('Context');
        expect(markup).toContain('editor-inspector-body');
        expect(markup).toContain('overflow-y-auto');
        expect(markup).toContain('Alignment');
        expect(markup.match(/aria-label="Align /g)).toHaveLength(6);
        expect(markup).toContain('Position');
        expect(markup).toContain('>X</');
        expect(markup).toContain('>Y</');
        expect(markup).toContain('>R</');
        expect(markup).toContain('Flex Layout');
        expect(markup).toContain('aria-label="Grid layout"');
        expect(markup).toContain('aria-label="Vertical layout"');
        expect(markup).toContain('aria-pressed="true"');
        expect(markup).toContain('Alignment');
        expect(markup).toContain('Gap');
        expect(markup).toContain('Space Between');
        expect(markup).toContain('Space Around');
        expect(markup).toContain('Padding');
        expect(markup).toContain('Dimensions');
        expect(markup).toContain('>W</');
        expect(markup).toContain('404');
        expect(markup).toContain('>H</');
        expect(markup).toContain('1205');
        expect(markup).toContain('Fill Width');
        expect(markup).toContain('Fill Height');
        expect(markup).toContain('Hug Width');
        expect(markup).toContain('Hug Height');
        expect(markup).toContain('Clip Content');
        expect(markup).not.toContain('1920');
        expect(markup).toContain('Appearance');
        expect(markup).toContain('aria-label="Opacity"');
        expect(markup).toContain('aria-label="Corner radius"');
        expect(markup).toContain('Fill');
        expect(markup).toContain('#f3f4f6');
        expect(markup).toContain('aria-label="Fill opacity"');
        expect(markup).toContain('Stroke');
        expect(markup).toContain('Effects');
        expect(markup).toContain('data-schema-group="position"');
        expect(markup).toContain('data-schema-path="x"');
        expect(markup).toContain('data-schema-path="y"');
        expect(markup).toContain('data-schema-path="rotation"');
        expect(markup).toContain('data-schema-group="layout"');
        expect(markup).toContain('data-schema-path="width"');
        expect(markup).toContain('data-schema-path="height"');
        expect(markup).toContain('data-schema-path="clip"');
        expect(markup).toContain('data-schema-path="cornerRadius"');
        expect(markup).toContain('data-schema-path="fill"');
        expect(markup).toContain('data-schema-path="stroke"');
        expect(markup).toContain('data-schema-path="effect"');
        expect(markup).not.toContain('data-schema-path="opacity"');
        expect(markup).toContain('2x');
        expect(markup).toContain('PNG');
        expect(markup).toContain('Export layer');
    });

    it('declares the schema workspace dependency for the renderer', () => {
        const packageJson = JSON.parse(
            readFileSync(
                fileURLToPath(new URL('../package.json', import.meta.url)),
                'utf8'
            )
        );

        expect(
            packageJson.dependencies['@miaoma-design-ai/miaoma-design-schema']
        ).toBe('workspace:*');
    });

    it('hides the canvas prompt dock while the Agent sidebar tab is active', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const canvasStageSource = rendererSource(
            'components/editor/CanvasStage.tsx'
        );
        const promptDockSource = rendererSource(
            'components/editor/PromptDock.tsx'
        );

        expect(markup).toContain('editor-agent-prompt-dock');
        expect(markup).not.toContain('editor-prompt-dock');
        expect(markup).toContain('15%');
        expect(markup).not.toContain('3898 × 2795');
        expect(markup).not.toContain('editor-selection');
        expect(markup).not.toContain('editor-selection-pill');
        expect(canvasStageSource).toContain("activeSidebarTab === 'layers'");
        expect(promptDockSource).toContain('h-[101px]');
        expect(promptDockSource).toContain('grid-rows-[35px_24px]');
        expect(promptDockSource).toContain('h-[35px]');
        expect(promptDockSource).toContain('h-[24px]');
        expect(promptDockSource).toContain('w-[507px]');
        expect(promptDockSource).toContain('shadow-[0_6px_24px_0_#00000012]');
    });

    it('shows the canvas prompt dock when the Layers sidebar tab is active', () => {
        const markup = renderToStaticMarkup(
            <CanvasStage activeSidebarTab="layers" />
        );
        const promptDockStart = markup.indexOf('editor-prompt-dock');
        const promptDockEnd = markup.indexOf('</section>', promptDockStart);

        expect(promptDockStart).toBeGreaterThan(-1);
        expect(promptDockEnd).toBeGreaterThan(promptDockStart);
        expect(markup).toContain('aria-label="Prompt"');
        expect(markup).toContain('editor-prompt-input');
        expect(markup).toContain('placeholder="Design anything..."');
        expect(markup).toContain('<textarea');
        expect(markup).toContain('⚡ 6x');
        expect(markup).toContain('GPT 5.5');
        expect(markup.slice(promptDockStart, promptDockEnd)).not.toContain(
            'Frame 3'
        );
        expect(markup.slice(promptDockStart, promptDockEnd)).not.toContain(
            'editor-selection-pill'
        );
    });

    it('reuses one PromptDock component for canvas and agent prompt docks', () => {
        const canvasStageSource = rendererSource(
            'components/editor/CanvasStage.tsx'
        );
        const agentPanelSource = rendererSource(
            'components/editor/SidebarAgentPanel.tsx'
        );
        const promptDockSource = rendererSource(
            'components/editor/PromptDock.tsx'
        );

        expect(
            existsSync(rendererFile('components/editor/PromptDock.tsx'))
        ).toBe(true);
        expect(canvasStageSource).toContain('import { PromptDock }');
        expect(canvasStageSource).toContain('<PromptDock variant="canvas" />');
        expect(canvasStageSource).not.toContain('const PromptDock');
        expect(agentPanelSource).toContain('import { PromptDock }');
        expect(agentPanelSource).toContain('<PromptDock variant="agent" />');
        expect(agentPanelSource).not.toContain('const AgentPromptDock');
        expect(promptDockSource).toContain(
            "type PromptDockVariant = 'agent' | 'canvas'"
        );
        expect(promptDockSource).toContain('editor-prompt-dock');
        expect(promptDockSource).toContain('editor-agent-prompt-dock');
    });

    it('matches the updated Sidebar Body and selected layer styling hooks', () => {
        const markup = renderToStaticMarkup(
            <SidebarContent activeTab="layers" />
        );
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
        expect(markup).toContain('data-document-renderer="true"');
        expect(markup).toContain(
            'data-design-node-name="Miaoma Editor Recreation Course"'
        );
        expect(markup).toContain('data-design-node-name="01-cover"');
        expect(markup).toContain('left:2100px');
        expect(markup).toContain('top:181.5px');
        expect(markup).toContain('MIAOMAEDU');
        expect(markup).toContain('AI 大前端');
        expect(markup).toContain('w-[4000px]');
        expect(markup).toContain('h-[3000px]');
    });

    it('keeps the editor implementation split by responsibility', () => {
        [
            'components/editor/MiaomaEditor.tsx',
            'components/editor/TopHeader.tsx',
            'components/editor/LeftSidebar.tsx',
            'components/editor/SidebarAgentPanel.tsx',
            'components/editor/CanvasStage.tsx',
            'components/document/CanvasDocumentRenderer.tsx',
            'components/editor/RightInspector.tsx',
            'components/editor/FlexLayoutSection.tsx',
            'components/editor/FillControl.tsx',
            'components/editor/InspectorCheckbox.tsx',
            'components/editor/InspectorValueInput.tsx',
            'constants/editor.ts',
            'types/editor.ts',
            'utils/classNames.ts'
        ].forEach((relativePath) => {
            expect(existsSync(rendererFile(relativePath)), relativePath).toBe(
                true
            );
        });
    });

    it('reuses the inspector value input primitive for fixed icon-value-unit controls', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const rightInspectorSource = rendererSource(
            'components/editor/RightInspector.tsx'
        );
        const valueInputSource = rendererSource(
            'components/editor/InspectorValueInput.tsx'
        );

        expect(rightInspectorSource).toContain('InspectorValueInput');
        expect(valueInputSource).toContain('startIcon');
        expect(valueInputSource).toContain('unit');
        expect(
            markup.match(/editor-inspector-value-input/g)?.length ?? 0
        ).toBeGreaterThanOrEqual(8);
    });

    it('keeps Fill as a dedicated inspector control instead of overloading the value input primitive', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const rightInspectorSource = rendererSource(
            'components/editor/RightInspector.tsx'
        );
        const fillControlSource = rendererSource(
            'components/editor/FillControl.tsx'
        );

        expect(rightInspectorSource).toContain('FillControl');
        expect(fillControlSource).not.toContain('InspectorValueInput');
        expect(markup).toContain('editor-fill-control');
        expect(markup).toContain('editor-fill-color-field');
        expect(markup).toContain('aria-label="Fill color"');
        expect(markup).toContain('aria-label="Fill opacity"');
        expect(fillControlSource).toContain('w-[221px]');
        expect(fillControlSource).toContain('w-[144px]');
        expect(fillControlSource).toContain('w-[73px]');
        expect(fillControlSource).not.toContain('justify-between gap-2');
        expect(fillControlSource).not.toContain(
            'editor-fill-opacity-field flex h-8 min-w-0 flex-1'
        );
    });

    it('makes the flex layout segmented control switchable by click state', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const flexLayoutSource = rendererSource(
            'components/editor/FlexLayoutSection.tsx'
        );

        expect(markup).toContain('aria-label="Vertical layout"');
        expect(markup).toContain('aria-pressed="true"');
        expect(flexLayoutSource).toContain('useState<LayoutMode>');
        expect(flexLayoutSource).toContain('onClick={() => selectLayoutMode');
        expect(flexLayoutSource).toMatch(
            /aria-pressed=\{\s*activeMode === mode \? 'true' : 'false'\s*\}/
        );
    });

    it('switches the layout configuration content by selected segment', () => {
        const gridMarkup = renderToStaticMarkup(
            <LayoutConfigurationContent activeMode="grid" />
        );
        const verticalMarkup = renderToStaticMarkup(
            <LayoutConfigurationContent activeMode="vertical" />
        );
        const rightMarkup = renderToStaticMarkup(
            <LayoutConfigurationContent activeMode="right" />
        );
        const flexLayoutSource = rendererSource(
            'components/editor/FlexLayoutSection.tsx'
        );

        expect(gridMarkup).toContain('editor-static-layout-controls');
        expect(gridMarkup).toContain('1920');
        expect(gridMarkup).toContain('Fill Width');
        expect(gridMarkup).toContain('Fill Height');
        expect(gridMarkup).not.toContain('Padding');
        expect(gridMarkup).not.toContain('Space Between');

        [verticalMarkup, rightMarkup].forEach((markup) => {
            expect(markup).toContain('editor-flex-layout-controls');
            expect(markup).toContain('Padding');
            expect(markup).toContain('Space Between');
            expect(markup).toContain('Hug Width');
            expect(markup).toContain('404');
            expect(markup).not.toContain('1920');
        });

        expect(flexLayoutSource).toContain(
            '<LayoutConfigurationContent activeMode={activeMode} />'
        );
    });

    it('matches the Layout Section header action and checkbox column geometry', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const flexLayoutSource = rendererSource(
            'components/editor/FlexLayoutSection.tsx'
        );

        expect(markup).toContain('aria-label="Switch to layout"');
        expect(flexLayoutSource).toContain('LayoutDashboard');
        expect(flexLayoutSource).toContain('toggleLayoutMode');
        expect(flexLayoutSource).toContain('useState<FlexDirectionMode>');
        expect(flexLayoutSource).toContain('setLastFlexMode(mode)');
        expect(flexLayoutSource).toContain('setActiveMode(lastFlexMode)');
        expect(flexLayoutSource).toContain('onClick={toggleLayoutMode}');
        expect(flexLayoutSource).toContain('grid-cols-[minmax(0,1fr)_116px]');
        expect(flexLayoutSource).toContain('size={14}');
        expect(flexLayoutSource).not.toContain('<Plus');
        expect(flexLayoutSource).not.toContain('Add layout setting');
        expect(flexLayoutSource).not.toMatch(
            /flex h-\[[^\]]+px\] items-center justify-between gap-5/
        );
    });

    it('matches the latest Alignment and Gap Row matrix behavior', () => {
        const markup = renderToStaticMarkup(<MiaomaEditorScreen />);
        const flexLayoutSource = rendererSource(
            'components/editor/FlexLayoutSection.tsx'
        );

        expect(markup.match(/editor-alignment-cell/g)).toHaveLength(9);
        expect(markup).toContain('data-preview-mode="fixed"');
        expect(markup).toContain('aria-label="Alignment top left"');
        expect(markup).toContain('aria-label="Alignment middle center"');
        expect(markup).toContain('aria-label="Fixed gap mode"');
        expect(markup).toContain('aria-label="Space between gap mode"');
        expect(markup).toContain('aria-label="Space around gap mode"');
        expect(flexLayoutSource).toContain('h-[69px] w-[100px]');
        expect(flexLayoutSource).toContain('grid-rows-[23px_23px_23px]');
        expect(flexLayoutSource).toContain('grid-cols-[23px_23px_23px]');
        expect(flexLayoutSource).toContain('hover:bg-[#eeeeee]');
        expect(flexLayoutSource).toContain("activeMode === 'right'");
        expect(flexLayoutSource).toContain("? 'row' : 'column'");
        expect(flexLayoutSource).toContain('cell.row === activeRow');
        expect(flexLayoutSource).toContain('cell.column === activeColumn');
        expect(flexLayoutSource).toContain('h-4 w-1 rounded-full');
        expect(flexLayoutSource).toContain('h-1 w-4 rounded-full');
        expect(flexLayoutSource).not.toContain('hover:border');
        expect(flexLayoutSource).not.toContain('hover:shadow');
        expect(flexLayoutSource).not.toContain('absolute flex w-[60px]');
        expect(flexLayoutSource).toContain(
            'onSelect={() => setActiveGapMode(option.mode)}'
        );
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
