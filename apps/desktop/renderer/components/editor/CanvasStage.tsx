/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { ChevronDown } from 'lucide-react';

import { TOOL_BUTTONS } from '../../constants/editor';

import { EditorIconButton } from './EditorIconButton';

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

const PromptDock = () => (
    <section
        className="editor-prompt-dock absolute bottom-3.5 left-3 z-20 grid h-[116px] w-[min(507px,calc(100%_-_340px))] grid-rows-[1fr_24px] gap-[18px] rounded-[22px] border border-[#ececee] bg-white p-[18px] shadow-[0_6px_24px_#00000012] max-[1280px]:w-[min(420px,calc(100%_-_220px))] max-[980px]:w-[min(420px,calc(100%_-_180px))]"
        aria-label="AI prompt"
    >
        <div className="editor-selection-pill absolute -top-4 right-4 z-10 inline-flex h-[25px] w-[87px] items-center justify-center whitespace-nowrap rounded-[14px] border border-[#e7e7e9] bg-[#f6f6f6] px-4 py-1 text-[14px] leading-none font-medium text-[#6a6b72]">
            Frame 3
        </div>
        <textarea
            aria-label="Prompt"
            className="editor-prompt-input h-[41px] w-full min-w-0 resize-none border-0 bg-transparent p-0 text-[14px] leading-[1.25] text-[#6c6c72] outline-0 placeholder:text-[#6c6c72] placeholder:opacity-100"
            placeholder="Design anything..."
            rows={2}
        />
        <div className="editor-prompt-footer flex h-6 min-w-0 items-center justify-between">
            <span className="editor-prompt-boost text-[14px] leading-none font-medium text-[#ff8b1f]">
                ⚡ 6x
            </span>
            <div className="editor-prompt-right flex min-w-0 items-center gap-2">
                <button
                    className="editor-model-selector flex cursor-default items-center gap-1.5 border-0 bg-transparent p-0 text-[14px] leading-none font-medium text-[#5e5f67] [-webkit-app-region:no-drag]"
                    type="button"
                >
                    GPT 5.5
                    <ChevronDown
                        aria-hidden="true"
                        size={14}
                        strokeWidth={1.8}
                    />
                </button>
                <button
                    aria-label="Send prompt"
                    className="editor-send-button grid h-[22px] w-[22px] cursor-default place-items-center rounded-[11px] border-0 bg-[#f1f2f4] p-0 text-[14px] leading-none font-semibold text-[#b7b8bf]"
                    type="button"
                >
                    ↑
                </button>
            </div>
        </div>
    </section>
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
    />
);

const SelectionOverlay = () => (
    <div
        className="editor-selection absolute top-[168px] left-[clamp(140px,28.25%,382px)] z-10 w-[min(723px,calc(100%_-_430px))] min-w-[360px] text-[#3c8dff] max-[1280px]:left-[clamp(140px,28.25%,320px)] max-[1280px]:w-[min(620px,calc(100%_-_180px))] max-[1280px]:min-w-0 max-[980px]:left-[120px] max-[980px]:w-[min(560px,calc(100%_-_180px))] max-[980px]:min-w-[320px]"
        aria-label="Selected frame"
    >
        <span className="editor-selection-label block h-[21px] text-[17px] leading-[21px] font-medium text-[#3c8dff]">
            Frame 3
        </span>
        <div className="editor-selection-box relative aspect-[723/522] w-full border-[3px] border-[#4592ff] bg-white">
            <span className="editor-handle editor-handle--top-left absolute -top-2 -left-2 h-2.5 w-2.5 border-2 border-[#4592ff] bg-white" />
            <span className="editor-handle editor-handle--top-right absolute -top-2 -right-2 h-2.5 w-2.5 border-2 border-[#4592ff] bg-white" />
            <span className="editor-handle editor-handle--bottom-left absolute -bottom-2 -left-2 h-2.5 w-2.5 border-2 border-[#4592ff] bg-white" />
            <span className="editor-handle editor-handle--bottom-right absolute -right-2 -bottom-2 h-2.5 w-2.5 border-2 border-[#4592ff] bg-white" />
            <span className="editor-selection-badge absolute top-[13px] -right-[27px] grid h-[22px] w-[22px] place-items-center rounded-md bg-[#4592ff] text-[19px] leading-none font-semibold text-white">
                *
            </span>
        </div>
        <span className="editor-selection-size absolute -bottom-8 left-1/2 grid h-6 w-[103px] -translate-x-1/2 place-items-center rounded-[7px] bg-[#4592ff] text-[13px] leading-none font-semibold text-white">
            3898 × 2795
        </span>
    </div>
);

export const CanvasStage = () => (
    <main
        className="editor-canvas-stage relative col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden bg-[#f6f6f6]"
        data-region="canvas-stage"
    >
        <InfiniteCanvas />
        <ToolRail />
        <SelectionOverlay />
        <PromptDock />
        <ZoomControl />
        <div
            aria-hidden="true"
            className="editor-canvas-scrollbar absolute bottom-1.5 left-[min(49.85%,calc(100%_-_300px))] z-20 h-1.5 w-[276px] rounded-[3px] bg-[#bdbec3]"
        />
    </main>
);
