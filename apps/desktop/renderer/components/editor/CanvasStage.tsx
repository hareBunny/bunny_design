/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    createRenderTree,
    parseDesignDocument
} from '@miaoma-design-ai/document';

import coverImageUrl from '../../assets/dSqyy.png';
import { TOOL_BUTTONS } from '../../constants/editor';
import { COVER_DOCUMENT_FIXTURE } from '../../fixtures/coverDocument';
import type { SidebarTab } from '../../types/editor';
import { CanvasDocumentRenderer } from '../document/CanvasDocumentRenderer';

import { EditorIconButton } from './EditorIconButton';
import { PromptDock } from './PromptDock';

const parsedCoverDocument = parseDesignDocument(COVER_DOCUMENT_FIXTURE);
const coverRenderTree = createRenderTree(parsedCoverDocument.document);
const coverAssets: Record<string, string> = {
    'image-import.png': coverImageUrl
};
const resolveCoverAsset = (url: string) => coverAssets[url] ?? url;

const ToolRail = () => (
    <nav
        aria-label="Canvas tools"
        className="editor-tool-rail absolute top-1 left-3 z-20 grid w-11 gap-1.5 rounded-2xl bg-white px-2 py-1.5 shadow-[0_3px_18px_#00000014]"
    >
        {TOOL_BUTTONS.map((tool) => (
            <EditorIconButton key={tool.label} {...tool} />
        ))}
    </nav>
);

const ZoomControl = () => (
    <div
        className="editor-zoom-control absolute right-8 bottom-3.5 z-20 grid h-10 w-[143px] grid-cols-[28px_1fr_28px] items-center rounded-[14px] border border-[#ececee] bg-white px-[18px] text-[14px] font-medium text-[#575a62] shadow-[0_4px_18px_#00000010]"
        aria-label="Zoom controls"
    >
        <button
            aria-label="Zoom out"
            className="grid h-7 w-7 cursor-default place-items-center border-0 bg-transparent p-0 text-[22px] leading-none text-[#666971]"
            type="button"
        >
            −
        </button>
        <span className="text-center">15%</span>
        <button
            aria-label="Zoom in"
            className="grid h-7 w-7 cursor-default place-items-center border-0 bg-transparent p-0 text-[22px] leading-none text-[#666971]"
            type="button"
        >
            +
        </button>
    </div>
);

const InfiniteCanvas = () => (
    <div
        aria-label="Infinite canvas"
        className="editor-infinite-canvas absolute top-1/2 left-1/2 h-[3000px] w-[4000px] -translate-x-1/2 -translate-y-1/2 bg-[#f6f6f6]"
        role="region"
    >
        <CanvasDocumentRenderer
            className="absolute top-1/2 left-1/2 z-[12] -translate-x-1/2 -translate-y-1/2 shadow-[0_18px_60px_#00000020]"
            document={coverRenderTree}
            resolveAsset={resolveCoverAsset}
        />
    </div>
);

type CanvasStageProps = {
    activeSidebarTab: SidebarTab;
};

export const CanvasStage = ({ activeSidebarTab }: CanvasStageProps) => (
    <main
        className="editor-canvas-stage relative col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden bg-[#f6f6f6]"
        data-region="canvas-stage"
    >
        <InfiniteCanvas />
        <ToolRail />
        {activeSidebarTab === 'layers' ? <PromptDock variant="canvas" /> : null}
        <ZoomControl />
        <div
            aria-hidden="true"
            className="editor-canvas-scrollbar absolute bottom-1.5 left-[min(49.85%,calc(100%_-_300px))] z-20 h-1.5 w-[276px] rounded-[3px] bg-[#bdbec3]"
        />
    </main>
);
