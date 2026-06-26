/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    ChevronDown,
    DiamondPlus,
    Download,
    Frame,
    type LucideIcon,
    PanelRight,
    Plus,
    Square
} from 'lucide-react';

import { ALIGNMENT_BUTTONS } from '../../constants/editor';

import { EditorIconButton } from './EditorIconButton';
import { FillControl } from './FillControl';
import { FlexLayoutSection } from './FlexLayoutSection';
import {
    FRAME_INSPECTOR_PROPERTIES,
    getFrameInspectorGroup
} from './inspectorSchema';
import { InspectorValueInput } from './InspectorValueInput';
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

const PositionSection = () => {
    const positionGroup = getFrameInspectorGroup('position');
    const { x, y, rotation } = FRAME_INSPECTOR_PROPERTIES;

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group={positionGroup.id}
        >
            <InspectorSectionHeader title={positionGroup.label} />
            <div className="editor-control-grid grid grid-cols-2 gap-2">
                <div data-schema-path={x.path}>
                    <InspectorValueInput
                        ariaLabel="X position"
                        label={x.label}
                        value="0"
                    />
                </div>
                <div data-schema-path={y.path}>
                    <InspectorValueInput
                        ariaLabel="Y position"
                        label={y.label}
                        value="0"
                    />
                </div>
                <div data-schema-path={rotation.path}>
                    <InspectorValueInput
                        ariaLabel="Rotation"
                        label={rotation.label}
                        unit={rotation.unit}
                        value="0"
                    />
                </div>
            </div>
        </section>
    );
};

const AppearanceSection = () => {
    const appearanceGroup = getFrameInspectorGroup('appearance');
    const { cornerRadius } = FRAME_INSPECTOR_PROPERTIES;

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group={appearanceGroup.id}
        >
            <InspectorSectionHeader title={appearanceGroup.label} />
            <div className="editor-control-grid grid grid-cols-2 gap-2">
                <InspectorValueInput ariaLabel="Opacity" unit="%" value="100" />
                <div data-schema-path={cornerRadius.path}>
                    <InspectorValueInput
                        ariaLabel="Corner radius"
                        startIcon={Square}
                        value="24"
                    />
                </div>
            </div>
        </section>
    );
};

const FillSection = () => {
    const fillGroup = getFrameInspectorGroup('fill');
    const { fill } = FRAME_INSPECTOR_PROPERTIES;

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group={fillGroup.id}
            data-schema-path={fill.path}
        >
            <InspectorSectionHeader title={fillGroup.label} actionIcon={Plus} />
            <FillControl />
        </section>
    );
};

const CompactSection = ({
    title,
    schemaGroup,
    schemaPath
}: {
    title: string;
    schemaGroup?: string;
    schemaPath?: string;
}) => (
    <section
        className="editor-inspector-section editor-inspector-section--compact grid h-[38px] gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
        data-schema-group={schemaGroup}
        data-schema-path={schemaPath}
    >
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
        className="editor-inspector col-start-2 row-span-2 row-start-1 grid h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l border-[#eaeaea] bg-white text-[12px] text-[#262626] max-[980px]:hidden"
        data-region="right-inspector"
    >
        <TopHeader />
        <div className="editor-inspector-body min-h-0 overflow-y-auto overflow-x-hidden">
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
            <FlexLayoutSection />
            <AppearanceSection />
            <FillSection />
            <CompactSection
                schemaGroup="stroke"
                schemaPath={FRAME_INSPECTOR_PROPERTIES.stroke.path}
                title={getFrameInspectorGroup('stroke').label}
            />
            <CompactSection
                schemaGroup="effects"
                schemaPath={FRAME_INSPECTOR_PROPERTIES.effect.path}
                title={getFrameInspectorGroup('effects').label}
            />
            <ExportSection />
        </div>
    </aside>
);
