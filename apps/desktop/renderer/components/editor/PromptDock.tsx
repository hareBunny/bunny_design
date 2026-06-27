/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

type PromptDockVariant = 'agent' | 'canvas';

type PromptDockConfig = {
    rootClassName: string;
    inputClassName: string;
    footerClassName: string;
    boostClassName: string;
    modelClassName: string;
    sendClassName: string;
    inputAriaLabel: string;
    sendAriaLabel: string;
    sectionAriaLabel: string;
};

type PromptDockProps = {
    variant: PromptDockVariant;
};

const PROMPT_DOCK_CONFIG: Record<PromptDockVariant, PromptDockConfig> = {
    agent: {
        rootClassName:
            'editor-agent-prompt-dock flex h-[104px] w-[277px] shrink-0 flex-col gap-[18px] overflow-hidden rounded-[10px] border border-[#ececee] bg-white p-[18px] shadow-[0_6px_24px_#00000012] max-[980px]:w-full',
        inputClassName:
            'h-8 w-[137px] shrink-0 resize-none border-0 bg-transparent p-0 text-[14px]/[normal] font-normal text-[#202328] outline-none placeholder:text-[#6c6c72]',
        footerClassName: 'flex h-6 w-full items-center justify-between',
        boostClassName: 'text-[14px]/[normal] font-medium text-[#ff8b1f]',
        modelClassName:
            'flex cursor-default items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-[#5e5f67]',
        sendClassName:
            'grid h-[22px] w-[22px] cursor-default place-items-center rounded-[11px] border-0 bg-[#f1f2f4] p-0 text-sm/[normal] text-[#b7b8bf]',
        inputAriaLabel: 'Agent prompt',
        sendAriaLabel: 'Send agent prompt',
        sectionAriaLabel: 'Agent prompt dock'
    },
    canvas: {
        rootClassName:
            'editor-prompt-dock pointer-events-auto absolute bottom-3.5 left-3 z-20 grid h-[101px] w-[507px] max-w-[calc(100%_-_340px)] grid-rows-[35px_24px] gap-[18px] rounded-[10px] border border-[#ececee] bg-white px-[18px] pt-[18px] pb-1.5 shadow-[0_6px_24px_0_#00000012] max-[1280px]:w-[420px] max-[1280px]:max-w-[calc(100%_-_220px)] max-[980px]:max-w-[calc(100%_-_180px)]',
        inputClassName:
            'editor-prompt-input h-[35px] w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent p-0 text-sm/[normal] font-normal text-[#6c6c72] outline-0 placeholder:text-[#6c6c72] placeholder:opacity-100',
        footerClassName:
            'editor-prompt-footer flex h-[24px] min-w-0 items-center justify-between',
        boostClassName:
            'editor-prompt-boost text-[14px]/[normal] font-medium text-[#ff8b1f]',
        modelClassName:
            'editor-model-selector flex cursor-default items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-[#5e5f67] [-webkit-app-region:no-drag]',
        sendClassName:
            'editor-send-button grid h-[22px] w-[22px] cursor-default place-items-center rounded-[11px] border-0 bg-[#f1f2f4] p-0 text-sm/[normal] text-[#b7b8bf]',
        inputAriaLabel: 'Prompt',
        sendAriaLabel: 'Send prompt',
        sectionAriaLabel: 'AI prompt'
    }
};

const PromptChevronIcon = () => (
    <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 14 14"
    >
        <path
            d="M3.34619 4.68945q-0.25293 0.08545-0.37939 0.30762-0.04102 0.08545-0.04102 0.25293 0 0.16748 0.04785 0.25977 0.05127 0.08887 1.8628 1.9038 1.81494 1.81152 1.9038 1.8628 0.09229 0.04785 0.25977 0.04785 0.16748 0 0.25635-0.04785 0.09229-0.05127 1.90381-1.8628 1.81494-1.81494 1.86279-1.9038 0.05127-0.09229 0.05127-0.25977 0-0.16748-0.04102-0.25293-0.09912-0.16748-0.28027-0.2666-0.05811-0.02734-0.09912-0.04102-0.04102-0.01367-0.15381-0.01367-0.11279 0-0.15381 0.01367-0.04101 0.01367-0.11279 0.04102-0.09912 0.05811-1.66455 1.62695l-1.56885 1.56543-2.82666-2.81299q-0.31104-0.29395-0.42041-0.37939-0.08545-0.05469-0.19824-0.05469l-0.02735 0q-0.14014 0-0.18115 0.01367z"
            fill="#5D5E66"
        />
    </svg>
);

export const PromptDock = ({ variant }: PromptDockProps) => {
    const config = PROMPT_DOCK_CONFIG[variant];

    return (
        <section
            aria-label={config.sectionAriaLabel}
            className={config.rootClassName}
        >
            <textarea
                aria-label={config.inputAriaLabel}
                className={config.inputClassName}
                placeholder="Design anything..."
                rows={1}
            />
            <footer className={config.footerClassName}>
                <span className={config.boostClassName}>⚡ 6x</span>
                <div className="flex items-center gap-2">
                    <button className={config.modelClassName} type="button">
                        GPT 5.5
                        <PromptChevronIcon />
                    </button>
                    <button
                        aria-label={config.sendAriaLabel}
                        className={config.sendClassName}
                        type="button"
                    >
                        ↑
                    </button>
                </div>
            </footer>
        </section>
    );
};
