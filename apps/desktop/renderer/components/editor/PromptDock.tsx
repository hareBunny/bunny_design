/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { ArrowUp, ImagePlus, Square, X } from 'lucide-react';
import { useEffect, useRef, useState, type ClipboardEvent } from 'react';

import type { MiaomaGenerationReferenceImage } from '../../../shared/generation';

import { classNames } from '../../utils/classNames';

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
    isRunning?: boolean;
    onCancel?: () => Promise<void> | void;
    onReferenceImageSelect?: () =>
        | Promise<MiaomaGenerationReferenceImage | null>
        | MiaomaGenerationReferenceImage
        | null;
    onReferenceImagePaste?: (input: {
        bytes: Uint8Array;
        extension: 'png' | 'jpg' | 'jpeg' | 'webp';
    }) => Promise<MiaomaGenerationReferenceImage | null>;
    onValueChange?: (value: string) => void;
    onSubmit?: (
        prompt: string,
        referenceImagePath?: string
    ) => Promise<void> | void;
    value?: string;
};

const AGENT_PROMPT_MAX_DOCK_HEIGHT = 400;
const AGENT_PROMPT_MIN_TEXTAREA_HEIGHT = 32;
const AGENT_PROMPT_MAX_TEXTAREA_HEIGHT = 324;

const PROMPT_DOCK_CONFIG: Record<PromptDockVariant, PromptDockConfig> = {
    agent: {
        rootClassName:
            'editor-agent-prompt-dock flex min-h-[104px] max-h-[400px] w-full shrink-0 flex-col gap-[18px] overflow-hidden rounded-[10px] border border-[#ececee] bg-white px-[18px] pt-[18px] pb-[14px] shadow-[0_6px_24px_#00000012] max-[980px]:w-full',
        inputClassName:
            'min-h-8 w-full min-w-0 shrink-0 resize-none overflow-y-auto border-0 bg-transparent p-0 text-[14px]/[normal] font-normal text-[#202328] outline-none placeholder:text-[#6c6c72]',
        footerClassName: 'flex h-6 w-full items-center justify-between',
        boostClassName: 'text-[14px]/[normal] font-medium text-[#ff8b1f]',
        modelClassName:
            'flex cursor-default items-center gap-1.5 border-0 bg-transparent p-0 text-xs text-[#5e5f67]',
        sendClassName:
            'grid h-[22px] w-[22px] cursor-default place-items-center rounded-[11px] border-0 p-0 text-sm/[normal]',
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

const getSendClassName = (variant: PromptDockVariant, isRunning: boolean) => {
    if (variant === 'agent') {
        return classNames(
            PROMPT_DOCK_CONFIG[variant].sendClassName,
            isRunning
                ? 'bg-[#f1f2f4] text-[#b7b8bf]'
                : 'bg-[#202328] text-white'
        );
    }

    return PROMPT_DOCK_CONFIG[variant].sendClassName;
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

export const PromptDock = ({
    isRunning = false,
    onCancel,
    onReferenceImageSelect,
    onReferenceImagePaste,
    onValueChange,
    onSubmit,
    value,
    variant
}: PromptDockProps) => {
    const config = PROMPT_DOCK_CONFIG[variant];
    const [internalPromptValue, setInternalPromptValue] = useState('');
    const [referenceImage, setReferenceImage] =
        useState<MiaomaGenerationReferenceImage | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const promptValue = value ?? internalPromptValue;
    const updatePromptValue = (nextValue: string) => {
        if (value === undefined) {
            setInternalPromptValue(nextValue);
        }
        onValueChange?.(nextValue);
    };

    useEffect(() => {
        if (variant !== 'agent') {
            return;
        }

        const textareaElement = textareaRef.current;

        if (!textareaElement) {
            return;
        }

        textareaElement.style.height = '0px';

        const nextHeight = Math.min(
            Math.max(
                textareaElement.scrollHeight,
                AGENT_PROMPT_MIN_TEXTAREA_HEIGHT
            ),
            AGENT_PROMPT_MAX_TEXTAREA_HEIGHT
        );

        textareaElement.style.height = `${nextHeight}px`;
        textareaElement.style.maxHeight = `${AGENT_PROMPT_MAX_TEXTAREA_HEIGHT}px`;
        textareaElement.style.overflowY =
            textareaElement.scrollHeight > AGENT_PROMPT_MAX_TEXTAREA_HEIGHT
                ? 'auto'
                : 'hidden';
    }, [promptValue, variant]);

    const attachPastedImage = (event: ClipboardEvent<HTMLTextAreaElement>) => {
        const imageFile = [...event.clipboardData.files].find((file) =>
            ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
        );
        if (!imageFile || !onReferenceImagePaste) {
            return;
        }

        const extension =
            imageFile.type === 'image/png'
                ? 'png'
                : imageFile.type === 'image/webp'
                  ? 'webp'
                  : 'jpg';
        event.preventDefault();
        void imageFile.arrayBuffer().then((buffer) =>
            onReferenceImagePaste({
                bytes: new Uint8Array(buffer),
                extension
            }).then((image) => {
                if (image) {
                    setReferenceImage(image);
                }
            })
        );
    };

    const submitPrompt = () => {
        const normalizedPrompt = promptValue.trim();
        if (!normalizedPrompt || !onSubmit) {
            return;
        }

        updatePromptValue('');
        const imagePath = referenceImage?.path;
        setReferenceImage(null);
        if (imagePath) {
            void onSubmit(normalizedPrompt, imagePath);
            return;
        }
        void onSubmit(normalizedPrompt);
    };

    return (
        <section
            aria-label={config.sectionAriaLabel}
            className={config.rootClassName}
            style={
                variant === 'agent'
                    ? { maxHeight: `${AGENT_PROMPT_MAX_DOCK_HEIGHT}px` }
                    : undefined
            }
        >
            {variant === 'agent' && referenceImage ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[#ececee] bg-[#f6f6f6]">
                    <img
                        alt="待转换的 UI 截图"
                        className="h-full w-full object-cover"
                        src={referenceImage.previewUrl}
                    />
                    <button
                        aria-label="移除截图"
                        className="absolute right-0.5 top-0.5 grid h-4 w-4 place-items-center rounded-full border-0 bg-[#202328cc] p-0 text-white"
                        onClick={() => setReferenceImage(null)}
                        type="button"
                    >
                        <X aria-hidden="true" size={10} />
                    </button>
                </div>
            ) : null}
            <textarea
                aria-label={config.inputAriaLabel}
                className={config.inputClassName}
                onChange={(event) => {
                    updatePromptValue(event.target.value);
                }}
                onPaste={attachPastedImage}
                onKeyDown={(event) => {
                    if (
                        event.key !== 'Enter' ||
                        event.shiftKey ||
                        event.nativeEvent.isComposing ||
                        variant !== 'agent' ||
                        isRunning
                    ) {
                        return;
                    }

                    event.preventDefault();
                    submitPrompt();
                }}
                placeholder="Design anything..."
                ref={textareaRef}
                rows={1}
                value={promptValue}
            />
            <footer className={config.footerClassName}>
                <div className="flex min-w-0 items-center gap-2">
                    <span className={config.boostClassName}>⚡ 6x</span>
                    {variant === 'agent' && onReferenceImageSelect ? (
                        <button
                            aria-label="截图转 UI 图"
                            className="flex h-6 min-w-0 cursor-default items-center gap-1 rounded-md border-0 bg-transparent px-1 text-[12px] text-[#5e5f67] hover:bg-[#f3f4f6]"
                            onClick={() => {
                                void Promise.resolve(onReferenceImageSelect()).then(
                                    (image) => {
                                        if (image) {
                                            setReferenceImage(image);
                                        }
                                    }
                                );
                            }}
                            type="button"
                        >
                            <ImagePlus aria-hidden="true" size={14} />
                            <span className="truncate">
                                {referenceImage ? '已添加截图' : '截图转 UI'}
                            </span>
                            {referenceImage ? (
                                <X
                                    aria-label="移除截图"
                                    className="shrink-0"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setReferenceImage(null);
                                    }}
                                    size={12}
                                />
                            ) : null}
                        </button>
                    ) : null}
                </div>
                <div className="flex items-center gap-2">
                    <button className={config.modelClassName} type="button">
                        GPT 5.5
                        <PromptChevronIcon />
                    </button>
                    {variant === 'agent' && isRunning ? (
                        <button
                            aria-label="Cancel agent generation"
                            className={getSendClassName(variant, isRunning)}
                            onClick={() => {
                                void onCancel?.();
                            }}
                            type="button"
                        >
                            <Square aria-hidden="true" size={10} />
                        </button>
                    ) : (
                        <button
                            aria-label={config.sendAriaLabel}
                            className={getSendClassName(variant, isRunning)}
                            disabled={
                                variant === 'agent' && !promptValue.trim()
                            }
                            onClick={submitPrompt}
                            type="button"
                        >
                            <ArrowUp aria-hidden="true" size={14} />
                        </button>
                    )}
                </div>
            </footer>
        </section>
    );
};
