/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    ChevronDown,
    Circle,
    DiamondPlus,
    Download,
    Frame,
    Image,
    PanelRight,
    Square,
    Type
} from 'lucide-react';
import { useEffect } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import type { EditorNode } from '@miaoma-design-ai/miaoma-editor-core';

import { ALIGNMENT_BUTTONS } from '../../../constants/editor';
import { EditorIconButton } from '../EditorIconButton';
import { useEditorSession } from '../state/useEditorSession';
import { useSelectedNode } from '../state/useSelectedNode';

import { AppearanceSectionFields } from './sections/AppearanceSectionFields';
import { EffectArraySection } from './sections/EffectArraySection';
import { FillArraySection } from './sections/FillArraySection';
import { FrameLayoutSectionFields } from './sections/FrameLayoutSectionFields';
import { PositionSectionFields } from './sections/PositionSectionFields';
import { StrokeArraySection } from './sections/StrokeArraySection';
import { TextSectionFields } from './sections/TextSectionFields';
import type { InspectorFormValues } from './formTypes';
import { formValuesToPatch } from './formValuesToPatch';
import {
    createEmptyInspectorFormValues,
    nodeToFormValues
} from './nodeToFormValues';

const NODE_ICON_BY_TYPE = {
    ellipse: Circle,
    frame: Frame,
    icon: Image,
    rectangle: Square,
    text: Type
} satisfies Record<EditorNode['type'], typeof Frame>;

const SelectedObjectBlock = ({
    nodeType
}: {
    nodeType: EditorNode['type'];
}) => {
    const name = useWatch<InspectorFormValues, 'name'>({ name: 'name' });
    const Icon = NODE_ICON_BY_TYPE[nodeType];

    return (
        <section className="editor-selected-object grid gap-2 border-b border-[#e8e8e8] px-3.5 py-3">
            <div className="editor-selected-object-row flex h-6 items-center justify-between font-semibold text-[#111111]">
                <span className="flex min-w-0 items-center gap-1.5 overflow-hidden overflow-ellipsis whitespace-nowrap">
                    <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
                    {name || 'Untitled'}
                </span>
                <PanelRight aria-hidden="true" size={13} strokeWidth={1.8} />
            </div>
            <div className="editor-create-component-row flex h-6 min-w-0 items-center gap-1.5 text-[12px] font-semibold text-[#111111]">
                <DiamondPlus aria-hidden="true" size={15} strokeWidth={1.8} />
                Create Component
            </div>
        </section>
    );
};

const AlignmentSection = () => (
    <section className="editor-inspector-section editor-inspector-section--alignment grid h-[83px] gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <header className="flex h-[22px] items-center text-[12px] leading-none font-semibold text-[#333333]">
            <span>Alignment</span>
        </header>
        <div className="editor-alignment-buttons flex h-8 items-center justify-between gap-1.5 [&_.editor-icon-button]:h-[30px] [&_.editor-icon-button]:w-[30px] [&_.editor-icon-button]:rounded-[5px] [&_.editor-icon-button]:border [&_.editor-icon-button]:border-[#e4e4e4] [&_.editor-icon-button]:bg-[#f7f7f7] [&_.editor-icon-button]:text-[#9ca3af]">
            {ALIGNMENT_BUTTONS.map((button) => (
                <EditorIconButton disabled key={button.label} {...button} />
            ))}
        </div>
    </section>
);

const ExportSection = () => (
    <section className="editor-inspector-section editor-export-section grid h-[122px] gap-2 border-b border-[#e9e9e9] px-3.5 py-2">
        <header className="flex h-[22px] items-center text-[12px] leading-none font-semibold text-[#333333]">
            <span>Export</span>
        </header>
        <div className="flex h-8 items-center gap-2">
            <button
                className="flex h-8 min-w-0 flex-1 cursor-default items-center justify-between rounded-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2 text-[#262626]"
                type="button"
            >
                <span className="text-[12px] leading-none font-medium">2x</span>
                <ChevronDown aria-hidden="true" size={12} strokeWidth={1.8} />
            </button>
            <button
                className="flex h-8 min-w-0 flex-1 cursor-default items-center justify-between rounded-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2 text-[#262626]"
                type="button"
            >
                <span className="text-[12px] leading-none font-medium">
                    PNG
                </span>
                <ChevronDown aria-hidden="true" size={12} strokeWidth={1.8} />
            </button>
        </div>
        <button
            className="flex h-[30px] cursor-default items-center justify-center gap-2 rounded-lg border-0 bg-[#111111] p-0 text-[12px] leading-none font-[650] text-white"
            type="button"
        >
            <Download aria-hidden="true" size={14} strokeWidth={1.9} />
            Export layer
        </button>
    </section>
);

export const RightInspectorFormBridge = () => {
    const session = useEditorSession();
    const selectedNode = useSelectedNode();
    const form = useForm<InspectorFormValues>({
        defaultValues: selectedNode
            ? nodeToFormValues(selectedNode)
            : createEmptyInspectorFormValues()
    });
    const watchedValues = useWatch({
        control: form.control
    }) as InspectorFormValues;

    useEffect(() => {
        form.reset(
            selectedNode
                ? nodeToFormValues(selectedNode)
                : createEmptyInspectorFormValues()
        );
    }, [form, selectedNode?.id]);

    useEffect(() => {
        if (!selectedNode || watchedValues.nodeId !== selectedNode.id) {
            return;
        }

        const patch = formValuesToPatch(selectedNode, watchedValues);

        if (Object.keys(patch).length === 0) {
            return;
        }

        session.patchNode(selectedNode.id, patch);
    }, [selectedNode, session, watchedValues]);

    if (!selectedNode) {
        return (
            <div className="grid gap-2 px-3.5 py-4 text-[12px] text-[#666666]">
                <p className="m-0 font-semibold text-[#333333]">No selection</p>
                <p className="m-0 leading-5">
                    Select a node on the canvas to edit its properties.
                </p>
            </div>
        );
    }

    return (
        <FormProvider {...form}>
            <SelectedObjectBlock nodeType={selectedNode.type} />
            <button
                className="editor-context-row flex h-11 w-full cursor-default items-center justify-between border-0 border-b border-[#e9e9e9] bg-white px-3.5 text-[12px] font-semibold text-[#111111]"
                type="button"
            >
                <span>Context</span>
                <ChevronDown aria-hidden="true" size={14} strokeWidth={1.8} />
            </button>
            <AlignmentSection />
            <PositionSectionFields />
            <FrameLayoutSectionFields
                showClip={selectedNode.type === 'frame'}
            />
            <AppearanceSectionFields />
            {selectedNode.type === 'text' ? <TextSectionFields /> : null}
            <FillArraySection nodeId={selectedNode.id} />
            <StrokeArraySection nodeId={selectedNode.id} />
            <EffectArraySection nodeId={selectedNode.id} />
            <ExportSection />
        </FormProvider>
    );
};
