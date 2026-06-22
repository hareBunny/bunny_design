/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    ArrowDownFromLine,
    ArrowRightFromLine,
    Check,
    ChevronDown,
    DiamondPlus,
    Download,
    Frame,
    LayoutDashboard,
    LayoutGrid,
    type LucideIcon,
    Minus,
    PanelRight,
    Plus,
    Square
} from 'lucide-react';

import { ALIGNMENT_BUTTONS } from '../../constants/editor';
import type { InspectorControl } from '../../types/editor';
import { classNames } from '../../utils/classNames';

import { EditorIconButton } from './EditorIconButton';
import { TopHeader } from './TopHeader';

const InspectorSectionHeader = ({
    title,
    actionIcon: ActionIcon
}: {
    title: string;
    actionIcon?: LucideIcon;
}) => (
    <header className="editor-inspector-section-header flex h-[22px] items-center justify-between text-[12px] leading-none font-semibold text-[#333333] [&_svg]:text-[#888888]">
        <span>{title}</span>
        {ActionIcon ? (
            <ActionIcon aria-hidden="true" size={14} strokeWidth={1.8} />
        ) : null}
    </header>
);

const ValueControl = ({
    label,
    value,
    icon: Icon,
    swatch,
    checked,
    wide
}: InspectorControl) => (
    <div
        className={classNames(
            'editor-value-control flex h-8 min-w-0 items-center gap-1 overflow-hidden rounded-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2 text-[#262626] [&_svg]:shrink-0 [&_svg]:text-[#8a8a8a]',
            wide && 'max-w-[115px]'
        )}
    >
        {label ? (
            <span className="editor-control-label text-[11px] leading-none font-medium text-[#8a8a8a]">
                {label}
            </span>
        ) : null}
        {swatch ? (
            <span
                className="editor-fill-swatch h-3.5 w-3.5 shrink-0 rounded-[3px] border border-[#d1d5db]"
                style={{ background: swatch }}
            />
        ) : null}
        {Icon ? <Icon aria-hidden="true" size={14} strokeWidth={1.7} /> : null}
        {checked ? (
            <span className="editor-check-box editor-check-box--checked grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border border-[#111111] bg-[#111111] text-white">
                <Check aria-hidden="true" size={10} strokeWidth={2.2} />
            </span>
        ) : null}
        <strong className="min-w-0 overflow-hidden font-mono text-[12px] leading-none font-medium overflow-ellipsis whitespace-nowrap text-[#262626]">
            {value}
        </strong>
    </div>
);

const CheckboxControl = ({
    label,
    checked
}: {
    label: string;
    checked?: boolean;
}) => (
    <span className="editor-checkbox-control flex min-w-0 items-center gap-2 text-[11px] leading-none font-medium text-[#333333]">
        <span
            className={classNames(
                'editor-check-box grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border border-[#d1d5db] bg-white',
                checked &&
                    'editor-check-box--checked border-[#111111] bg-[#111111] text-white'
            )}
        >
            {checked ? (
                <Check aria-hidden="true" size={10} strokeWidth={2.2} />
            ) : null}
        </span>
        {label}
    </span>
);

const DropdownControl = ({
    value,
    icon: Icon
}: {
    value: string;
    icon?: LucideIcon;
}) => (
    <button
        className="editor-dropdown-control flex h-8 min-w-0 flex-1 cursor-default items-center justify-between rounded-lg border border-[#e3e3e3] bg-[#f8f8f8] px-2 text-[#262626] [&_svg]:shrink-0 [&_svg]:text-[#7a7a7a]"
        type="button"
    >
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] leading-none font-medium text-[#262626]">
            {Icon ? (
                <Icon aria-hidden="true" size={14} strokeWidth={1.7} />
            ) : null}
            {value}
        </span>
        <ChevronDown aria-hidden="true" size={12} strokeWidth={1.8} />
    </button>
);

const SelectedObjectBlock = () => (
    <section className="editor-selected-object grid gap-2 border-b border-[#e8e8e8] px-3.5 py-3">
        <div className="editor-selected-object-row flex h-6 items-center justify-between font-semibold text-[#111111]">
            <span className="flex min-w-0 items-center gap-1.5 overflow-hidden overflow-ellipsis whitespace-nowrap">
                <Frame aria-hidden="true" size={14} strokeWidth={1.8} />
                Miaoma Editor Recr
            </span>
            <PanelRight aria-hidden="true" size={13} strokeWidth={1.8} />
        </div>
        <div className="editor-create-component-row flex h-6 min-w-0 items-center gap-1.5 text-[12px] font-semibold text-[#111111]">
            <DiamondPlus aria-hidden="true" size={15} strokeWidth={1.8} />
            Create Component
        </div>
    </section>
);

const AlignmentSection = () => (
    <section className="editor-inspector-section editor-inspector-section--alignment grid h-[83px] gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title="Alignment" />
        <div className="editor-alignment-buttons flex h-8 items-center justify-between gap-1.5 [&_.editor-icon-button]:h-[30px] [&_.editor-icon-button]:w-[30px] [&_.editor-icon-button]:rounded-[5px] [&_.editor-icon-button]:border [&_.editor-icon-button]:border-[#e4e4e4] [&_.editor-icon-button]:bg-[#f7f7f7] [&_.editor-icon-button]:text-[#9ca3af]">
            {ALIGNMENT_BUTTONS.map((button) => (
                <EditorIconButton key={button.label} {...button} />
            ))}
        </div>
    </section>
);

const PositionSection = () => (
    <section className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title="Position" />
        <div className="editor-control-grid grid grid-cols-2 gap-2">
            <ValueControl label="X" value="0" />
            <ValueControl label="Y" value="0" />
            <ValueControl label="R" value="0" />
        </div>
    </section>
);

const LayoutSection = () => (
    <section className="editor-inspector-section editor-inspector-section--layout grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title="Layout" actionIcon={LayoutDashboard} />
        <div className="editor-layout-mode-control grid h-[34px] grid-cols-3 rounded-lg bg-[#f2f2f2] p-px">
            <button
                className="editor-layout-mode-button editor-layout-mode-button--active grid h-full min-w-0 cursor-default place-items-center rounded-lg border-0 bg-white p-0 text-[#4a4a4a]"
                type="button"
            >
                <LayoutGrid aria-hidden="true" size={15} strokeWidth={1.7} />
            </button>
            <button
                className="editor-layout-mode-button grid h-full min-w-0 cursor-default place-items-center border-0 bg-[#f2f2f2] p-0 text-[#5a5a5a]"
                type="button"
            >
                <ArrowDownFromLine
                    aria-hidden="true"
                    size={15}
                    strokeWidth={1.7}
                />
            </button>
            <button
                className="editor-layout-mode-button grid h-full min-w-0 cursor-default place-items-center rounded-r-[9px] border-0 bg-[#f2f2f2] p-0 text-[#5a5a5a]"
                type="button"
            >
                <ArrowRightFromLine
                    aria-hidden="true"
                    size={15}
                    strokeWidth={1.7}
                />
            </button>
        </div>
        <div className="editor-control-grid grid grid-cols-2 gap-2">
            <ValueControl label="W" value="1920" />
            <ValueControl label="H" value="1205" />
        </div>
        <div className="editor-checkbox-row flex min-h-[22px] items-center justify-between gap-5">
            <CheckboxControl label="Fill Width" />
            <CheckboxControl label="Fill Height" />
        </div>
        <div className="editor-checkbox-row editor-checkbox-row--single flex min-h-7 items-center justify-start gap-5">
            <CheckboxControl label="Clip Content" checked />
        </div>
    </section>
);

const AppearanceSection = () => (
    <section className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title="Appearance" />
        <div className="editor-control-grid grid grid-cols-2 gap-2">
            <ValueControl value="% 100" />
            <ValueControl icon={Square} value="24" />
        </div>
    </section>
);

const FillSection = () => (
    <section className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title="Fill" actionIcon={Plus} />
        <div className="editor-fill-row flex h-[34px] items-center justify-between gap-2 text-[#8a8a8a]">
            <div className="editor-fill-control flex h-[34px] min-w-0 flex-auto overflow-hidden rounded-lg bg-white [&_.editor-value-control:first-child]:w-36 [&_.editor-value-control:first-child]:rounded-l-lg [&_.editor-value-control:first-child]:rounded-r-none [&_.editor-value-control:last-child]:flex-auto [&_.editor-value-control:last-child]:justify-center [&_.editor-value-control:last-child]:rounded-l-none [&_.editor-value-control:last-child]:rounded-r-lg [&_.editor-value-control]:h-8 [&_.editor-value-control]:rounded-none">
                <ValueControl swatch="#f3f4f6" value="#f3f4f6" />
                <ValueControl value="100%" />
            </div>
            <Minus aria-hidden="true" size={14} strokeWidth={1.8} />
        </div>
    </section>
);

const CompactSection = ({ title }: { title: string }) => (
    <section className="editor-inspector-section editor-inspector-section--compact grid h-[38px] gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title={title} actionIcon={Plus} />
    </section>
);

const ExportSection = () => (
    <section className="editor-inspector-section editor-export-section grid h-[122px] gap-2 border-b border-[#e9e9e9] px-3.5 py-2">
        <InspectorSectionHeader title="Export" />
        <div className="editor-export-settings flex h-8 items-center gap-2">
            <DropdownControl value="2x" />
            <DropdownControl value="PNG" />
        </div>
        <button
            className="editor-export-button flex h-[30px] cursor-default items-center justify-center gap-2 rounded-lg border-0 bg-[#111111] p-0 text-[12px] leading-none font-[650] text-white"
            type="button"
        >
            <Download aria-hidden="true" size={14} strokeWidth={1.9} />
            Export layer
        </button>
    </section>
);

export const RightInspector = () => (
    <aside
        className="editor-inspector col-start-2 row-span-2 row-start-1 h-full min-w-0 overflow-hidden border-l border-[#eaeaea] bg-white text-[12px] text-[#262626] max-[980px]:hidden"
        data-region="right-inspector"
    >
        <TopHeader />
        <SelectedObjectBlock />
        <button
            className="editor-context-row flex h-11 w-full cursor-default items-center justify-between border-0 border-b border-[#e9e9e9] bg-white px-3.5 text-[12px] font-semibold text-[#111111]"
            type="button"
        >
            <span>Context</span>
            <ChevronDown aria-hidden="true" size={14} strokeWidth={1.8} />
        </button>
        <AlignmentSection />
        <PositionSection />
        <LayoutSection />
        <AppearanceSection />
        <FillSection />
        <CompactSection title="Stroke" />
        <CompactSection title="Effects" />
        <ExportSection />
    </aside>
);
