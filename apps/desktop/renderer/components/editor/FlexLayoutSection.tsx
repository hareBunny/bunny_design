/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    ArrowDown,
    ArrowRight,
    LayoutDashboard,
    LayoutGrid,
    type LucideIcon,
    PanelLeft,
    PanelTop,
    Settings
} from 'lucide-react';
import { useState } from 'react';

import { classNames } from '../../utils/classNames';

import { InspectorCheckbox } from './InspectorCheckbox';
import { FRAME_INSPECTOR_PROPERTIES } from './inspectorSchema';
import { InspectorValueInput } from './InspectorValueInput';

export type LayoutMode = 'grid' | 'vertical' | 'right';

export type LayoutGapMode = 'fixed' | 'between' | 'around';
export type LayoutAlignmentId =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'middle-left'
    | 'middle-center'
    | 'middle-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
export type DimensionMode = 'fixed' | 'fill' | 'hug';

type GapMode = LayoutGapMode;
type FlexDirectionMode = Exclude<LayoutMode, 'grid'>;

type FlexLayoutSectionProps = {
    activeMode?: LayoutMode;
    defaultActiveMode?: LayoutMode;
    onActiveModeChange?: (mode: LayoutMode) => void;
    activeAlignment?: LayoutAlignmentId;
    defaultActiveAlignment?: LayoutAlignmentId;
    onAlignmentChange?: (alignment: LayoutAlignmentId) => void;
    gapMode?: LayoutGapMode;
    defaultGapMode?: LayoutGapMode;
    gapValue?: string;
    defaultGapValue?: string;
    onGapModeChange?: (mode: LayoutGapMode) => void;
    onGapValueChange?: (value: string) => void;
    widthValue?: string;
    widthMode?: DimensionMode;
    heightValue?: string;
    heightMode?: DimensionMode;
    clipChecked?: boolean;
    showClip?: boolean;
    disableAdvancedControls?: boolean;
    onWidthChange?: (value: string) => void;
    onWidthModeChange?: (mode: DimensionMode) => void;
    onHeightChange?: (value: string) => void;
    onHeightModeChange?: (mode: DimensionMode) => void;
    paddingHorizontalValue?: string;
    paddingVerticalValue?: string;
    defaultPaddingHorizontalValue?: string;
    defaultPaddingVerticalValue?: string;
    onPaddingHorizontalChange?: (value: string) => void;
    onPaddingVerticalChange?: (value: string) => void;
    onClipChange?: (checked: boolean) => void;
};

type LayoutConfigurationContentProps = Omit<
    FlexLayoutSectionProps,
    'defaultActiveMode' | 'onActiveModeChange'
> & {
    activeMode: LayoutMode;
};

const ALIGNMENT_CELLS = [
    { id: 'top-left', label: 'Alignment top left', column: 0, row: 0 },
    { id: 'top-center', label: 'Alignment top center', column: 1, row: 0 },
    { id: 'top-right', label: 'Alignment top right', column: 2, row: 0 },
    { id: 'middle-left', label: 'Alignment middle left', column: 0, row: 1 },
    {
        id: 'middle-center',
        label: 'Alignment middle center',
        column: 1,
        row: 1
    },
    { id: 'middle-right', label: 'Alignment middle right', column: 2, row: 1 },
    { id: 'bottom-left', label: 'Alignment bottom left', column: 0, row: 2 },
    {
        id: 'bottom-center',
        label: 'Alignment bottom center',
        column: 1,
        row: 2
    },
    { id: 'bottom-right', label: 'Alignment bottom right', column: 2, row: 2 }
] as const;

type AlignmentCellId = (typeof ALIGNMENT_CELLS)[number]['id'];

const ALIGNMENT_GRID_CLASS_BY_GAP_MODE: Record<GapMode, string> = {
    fixed: 'grid-cols-[23px_23px_23px] justify-between',
    between: 'grid-cols-[23px_23px_23px] justify-between',
    around: 'grid-cols-[23px_23px_23px] justify-around'
};

const GAP_MODE_OPTIONS: {
    mode: GapMode;
    label: string;
    ariaLabel: string;
    value?: string;
}[] = [
    { mode: 'fixed', label: 'Gap', ariaLabel: 'Fixed gap mode', value: '0' },
    {
        mode: 'between',
        label: 'Space Between',
        ariaLabel: 'Space between gap mode'
    },
    {
        mode: 'around',
        label: 'Space Around',
        ariaLabel: 'Space around gap mode'
    }
];

const LAYOUT_MODE_OPTIONS: {
    mode: LayoutMode;
    label: string;
    icon: LucideIcon;
    edge?: 'left' | 'right';
}[] = [
    { mode: 'grid', label: 'Grid layout', icon: LayoutGrid, edge: 'left' },
    { mode: 'vertical', label: 'Vertical layout', icon: ArrowDown },
    {
        mode: 'right',
        label: 'Horizontal layout',
        icon: ArrowRight,
        edge: 'right'
    }
];

const AlignmentMatrix = ({
    activeAlignment,
    activeGapMode,
    activeMode,
    disabled,
    onSelectAlignment
}: {
    activeAlignment: AlignmentCellId;
    activeGapMode: GapMode;
    activeMode: LayoutMode;
    disabled?: boolean;
    onSelectAlignment: (cellId: AlignmentCellId) => void;
}) => {
    const activeCell = ALIGNMENT_CELLS.find(
        (cell) => cell.id === activeAlignment
    );
    const activeColumn = activeCell?.column ?? 0;
    const activeRow = activeCell?.row ?? 0;
    const distributedPreviewAxis = activeMode === 'right' ? 'row' : 'column';

    return (
        <div
            aria-label="Alignment matrix"
            className={classNames(
                'editor-alignment-matrix h-[69px] w-[100px] rounded-lg border border-[#e3e3e3] bg-[#f8f8f8]',
                disabled && 'opacity-60'
            )}
            data-preview-mode={activeGapMode}
            role="group"
        >
            <div
                className={classNames(
                    'editor-alignment-preview-grid grid h-full grid-rows-[23px_23px_23px]',
                    ALIGNMENT_GRID_CLASS_BY_GAP_MODE[activeGapMode]
                )}
            >
                {ALIGNMENT_CELLS.map((cell) => {
                    const isSelected = activeAlignment === cell.id;
                    const isDistributedPreview =
                        activeGapMode !== 'fixed' &&
                        (distributedPreviewAxis === 'row'
                            ? cell.row === activeRow
                            : cell.column === activeColumn);
                    const markerVariant = isDistributedPreview
                        ? 'distributed'
                        : isSelected
                          ? 'selected'
                          : 'idle';
                    const distributedMarkerClass =
                        distributedPreviewAxis === 'row'
                            ? 'h-4 w-1 rounded-full bg-[#4094ff]'
                            : 'h-1 w-4 rounded-full bg-[#4094ff]';

                    return (
                        <button
                            aria-label={cell.label}
                            aria-pressed={isSelected ? 'true' : 'false'}
                            className="editor-alignment-cell grid h-[23px] w-[23px] cursor-default place-items-center border-0 bg-transparent p-0 transition-colors hover:bg-[#eeeeee]"
                            disabled={disabled}
                            key={cell.id}
                            onClick={() => onSelectAlignment(cell.id)}
                            type="button"
                        >
                            <span
                                className={classNames(
                                    'pointer-events-none block',
                                    markerVariant === 'distributed' &&
                                        distributedMarkerClass,
                                    markerVariant === 'selected' &&
                                        'h-1.5 w-1.5 rounded-[1px] bg-[#0066ff]',
                                    markerVariant === 'idle' &&
                                        'h-0.5 w-0.5 rounded-full bg-[#c9cdd3]'
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const GapRadioRow = ({
    option,
    disabled,
    onSelect,
    onValueChange,
    selected,
    value
}: {
    option: (typeof GAP_MODE_OPTIONS)[number];
    disabled?: boolean;
    onSelect: () => void;
    onValueChange?: (value: string) => void;
    selected?: boolean;
    value?: string;
}) => (
    <div
        className={classNames(
            'editor-gap-radio-row flex min-w-0 items-center gap-2',
            disabled && 'opacity-60'
        )}
    >
        <button
            aria-label={option.ariaLabel}
            aria-pressed={selected ? 'true' : 'false'}
            className={classNames(
                'group flex h-5 min-w-0 cursor-default items-center gap-2 border-0 bg-transparent p-0 text-left',
                !option.value && 'flex-1',
                selected ? 'text-[#111111]' : 'text-[#333333]'
            )}
            disabled={disabled}
            onClick={onSelect}
            type="button"
        >
            <span
                aria-hidden="true"
                className={classNames(
                    'h-3.5 w-3.5 shrink-0 rounded-full',
                    selected
                        ? 'border-2 border-white bg-[#0066ff] shadow-[0_0_0_1px_#0066ff]'
                        : 'border border-[#c8c8c8] bg-white'
                )}
            />
            {option.value ? null : (
                <span className="min-w-0 truncate text-[11px] leading-none font-medium">
                    {option.label}
                </span>
            )}
        </button>
        {option.value ? (
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.gap.path}>
                <InspectorValueInput
                    ariaLabel="Gap value"
                    className="w-[42px] bg-white px-2"
                    disabled={disabled}
                    inputClassName="text-center"
                    onValueChange={onValueChange}
                    size="compact"
                    value={value ?? option.value}
                />
            </div>
        ) : null}
    </div>
);

const AlignmentAndGapControls = ({
    activeAlignment,
    activeGapMode,
    activeMode,
    disabled,
    gapValue,
    onGapModeChange,
    onGapValueChange,
    onSelectAlignment
}: {
    activeAlignment: AlignmentCellId;
    activeGapMode: GapMode;
    activeMode: LayoutMode;
    disabled?: boolean;
    gapValue?: string;
    onGapModeChange: (mode: GapMode) => void;
    onGapValueChange?: (value: string) => void;
    onSelectAlignment: (cellId: AlignmentCellId) => void;
}) => {
    return (
        <div className="editor-flex-alignment-gap-row grid h-[90px] grid-cols-[104px_minmax(0,1fr)] gap-3">
            <div
                className="editor-flex-alignment-column grid content-start gap-2"
                data-schema-path={FRAME_INSPECTOR_PROPERTIES.alignItems.path}
            >
                <span className="text-[11px] leading-none font-medium text-[#666666]">
                    Alignment
                </span>
                <AlignmentMatrix
                    activeAlignment={activeAlignment}
                    activeGapMode={activeGapMode}
                    activeMode={activeMode}
                    disabled={disabled}
                    onSelectAlignment={onSelectAlignment}
                />
            </div>
            <div
                className="editor-flex-gap-column grid content-start gap-2"
                data-schema-path={
                    FRAME_INSPECTOR_PROPERTIES.justifyContent.path
                }
            >
                <span className="text-[11px] leading-none font-medium text-[#666666]">
                    Gap
                </span>
                {GAP_MODE_OPTIONS.map((option) => (
                    <GapRadioRow
                        disabled={disabled}
                        key={option.mode}
                        onSelect={() => onGapModeChange(option.mode)}
                        onValueChange={onGapValueChange}
                        option={option}
                        selected={activeGapMode === option.mode}
                        value={gapValue}
                    />
                ))}
            </div>
        </div>
    );
};

const LayoutSubsectionHeader = ({
    title,
    withSettings
}: {
    title: string;
    withSettings?: boolean;
}) => (
    <header className="flex h-[22px] items-center justify-between text-[12px] leading-none font-semibold text-[#333333]">
        <span>{title}</span>
        {withSettings ? (
            <Settings
                aria-hidden="true"
                className="text-[#8a8a8a]"
                size={14}
                strokeWidth={1.7}
            />
        ) : null}
    </header>
);

const CheckboxPairRow = ({
    disabled,
    leftChecked,
    leftLabel,
    onLeftCheckedChange,
    onRightCheckedChange,
    rightChecked,
    rightLabel,
    rowClassName
}: {
    disabled?: boolean;
    leftChecked?: boolean;
    leftLabel: string;
    onLeftCheckedChange?: (checked: boolean) => void;
    onRightCheckedChange?: (checked: boolean) => void;
    rightChecked?: boolean;
    rightLabel: string;
    rowClassName?: string;
}) => (
    <div
        className={classNames(
            'grid grid-cols-[minmax(0,1fr)_116px] items-center gap-5',
            rowClassName
        )}
    >
        <InspectorCheckbox
            checked={leftChecked}
            disabled={disabled}
            label={leftLabel}
            onCheckedChange={onLeftCheckedChange}
        />
        <InspectorCheckbox
            checked={rightChecked}
            disabled={disabled}
            label={rightLabel}
            onCheckedChange={onRightCheckedChange}
        />
    </div>
);

const PaddingControls = ({
    disabled,
    horizontalValue,
    onHorizontalChange,
    onVerticalChange,
    verticalValue
}: {
    disabled?: boolean;
    horizontalValue: string;
    onHorizontalChange?: (value: string) => void;
    onVerticalChange?: (value: string) => void;
    verticalValue: string;
}) => (
    <div className="editor-flex-padding-section grid gap-1.5">
        <LayoutSubsectionHeader title="Padding" withSettings />
        <div className="grid grid-cols-2 gap-2">
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.padding.path}>
                <InspectorValueInput
                    ariaLabel="Horizontal padding"
                    disabled={disabled}
                    onValueChange={onHorizontalChange}
                    startIcon={PanelLeft}
                    value={horizontalValue}
                />
            </div>
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.padding.path}>
                <InspectorValueInput
                    ariaLabel="Vertical padding"
                    disabled={disabled}
                    onValueChange={onVerticalChange}
                    startIcon={PanelTop}
                    value={verticalValue}
                />
            </div>
        </div>
    </div>
);

const DimensionsControls = ({
    widthValue,
    widthMode,
    heightValue,
    heightMode,
    clipChecked,
    showClip,
    disableAdvancedControls,
    onWidthChange,
    onWidthModeChange,
    onHeightChange,
    onHeightModeChange,
    onClipChange
}: {
    widthValue: string;
    widthMode?: DimensionMode;
    heightValue: string;
    heightMode?: DimensionMode;
    clipChecked?: boolean;
    showClip?: boolean;
    disableAdvancedControls?: boolean;
    onWidthChange?: (value: string) => void;
    onWidthModeChange?: (mode: DimensionMode) => void;
    onHeightChange?: (value: string) => void;
    onHeightModeChange?: (mode: DimensionMode) => void;
    onClipChange?: (checked: boolean) => void;
}) => (
    <div className="editor-flex-dimensions-section grid gap-2">
        <LayoutSubsectionHeader title="Dimensions" />
        <div className="grid grid-cols-2 gap-2">
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.width.path}>
                <InspectorValueInput
                    ariaLabel="Width"
                    label={FRAME_INSPECTOR_PROPERTIES.width.label}
                    onValueChange={onWidthChange}
                    value={widthValue}
                />
            </div>
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.height.path}>
                <InspectorValueInput
                    ariaLabel="Height"
                    label={FRAME_INSPECTOR_PROPERTIES.height.label}
                    onValueChange={onHeightChange}
                    value={heightValue}
                />
            </div>
        </div>
        <div className="grid gap-1.5">
            <CheckboxPairRow
                disabled={disableAdvancedControls}
                leftChecked={widthMode === 'fill'}
                leftLabel="Fill Width"
                onLeftCheckedChange={(checked) => {
                    onWidthModeChange?.(checked ? 'fill' : 'fixed');
                }}
                onRightCheckedChange={(checked) => {
                    onHeightModeChange?.(checked ? 'fill' : 'fixed');
                }}
                rightChecked={heightMode === 'fill'}
                rightLabel="Fill Height"
                rowClassName="h-[23px]"
            />
            <CheckboxPairRow
                disabled={disableAdvancedControls}
                leftChecked={widthMode === 'hug'}
                leftLabel="Hug Width"
                onLeftCheckedChange={(checked) => {
                    onWidthModeChange?.(checked ? 'hug' : 'fixed');
                }}
                onRightCheckedChange={(checked) => {
                    onHeightModeChange?.(checked ? 'hug' : 'fixed');
                }}
                rightChecked={heightMode === 'hug'}
                rightLabel="Hug Height"
                rowClassName="h-[22px]"
            />
            {showClip ? (
                <div
                    className="flex h-[22px] items-center"
                    data-schema-path={FRAME_INSPECTOR_PROPERTIES.clip.path}
                >
                    <InspectorCheckbox
                        ariaLabel="Clip Content"
                        checked={clipChecked}
                        label="Clip Content"
                        onCheckedChange={onClipChange}
                    />
                </div>
            ) : null}
        </div>
    </div>
);

const StaticLayoutControls = ({
    widthValue,
    heightValue,
    clipChecked,
    showClip,
    onWidthChange,
    onHeightChange,
    onClipChange
}: {
    widthValue: string;
    heightValue: string;
    clipChecked?: boolean;
    showClip?: boolean;
    onWidthChange?: (value: string) => void;
    onHeightChange?: (value: string) => void;
    onClipChange?: (checked: boolean) => void;
}) => (
    <div className="editor-static-layout-controls grid gap-1.5">
        <div className="grid grid-cols-2 gap-2">
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.width.path}>
                <InspectorValueInput
                    ariaLabel="Static width"
                    label="W"
                    onValueChange={onWidthChange}
                    value={widthValue}
                />
            </div>
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.height.path}>
                <InspectorValueInput
                    ariaLabel="Static height"
                    label="H"
                    onValueChange={onHeightChange}
                    value={heightValue}
                />
            </div>
        </div>
        <CheckboxPairRow
            disabled
            leftLabel="Fill Width"
            rightLabel="Fill Height"
            rowClassName="min-h-[22px]"
        />
        {showClip ? (
            <div
                className="flex min-h-7 items-center justify-start gap-5"
                data-schema-path={FRAME_INSPECTOR_PROPERTIES.clip.path}
            >
                <InspectorCheckbox
                    ariaLabel="Clip Content"
                    checked={clipChecked}
                    label="Clip Content"
                    onCheckedChange={onClipChange}
                />
            </div>
        ) : null}
    </div>
);

const FlexLayoutControls = ({
    activeAlignment,
    activeGapMode,
    activeMode,
    widthValue,
    widthMode,
    heightValue,
    heightMode,
    clipChecked,
    showClip,
    disableAdvancedControls,
    gapValue,
    onAlignmentChange,
    onGapModeChange,
    onGapValueChange,
    onWidthChange,
    onWidthModeChange,
    onHeightChange,
    onHeightModeChange,
    paddingHorizontalValue,
    paddingVerticalValue,
    onPaddingHorizontalChange,
    onPaddingVerticalChange,
    onClipChange
}: {
    activeAlignment: LayoutAlignmentId;
    activeGapMode: LayoutGapMode;
    activeMode: LayoutMode;
    widthValue: string;
    widthMode?: DimensionMode;
    heightValue: string;
    heightMode?: DimensionMode;
    clipChecked?: boolean;
    showClip?: boolean;
    disableAdvancedControls?: boolean;
    gapValue?: string;
    onAlignmentChange: (alignment: LayoutAlignmentId) => void;
    onGapModeChange: (mode: LayoutGapMode) => void;
    onGapValueChange?: (value: string) => void;
    onWidthChange?: (value: string) => void;
    onWidthModeChange?: (mode: DimensionMode) => void;
    onHeightChange?: (value: string) => void;
    onHeightModeChange?: (mode: DimensionMode) => void;
    paddingHorizontalValue: string;
    paddingVerticalValue: string;
    onPaddingHorizontalChange?: (value: string) => void;
    onPaddingVerticalChange?: (value: string) => void;
    onClipChange?: (checked: boolean) => void;
}) => (
    <div className="editor-flex-layout-controls grid gap-1.5">
        <AlignmentAndGapControls
            activeAlignment={activeAlignment}
            activeGapMode={activeGapMode}
            activeMode={activeMode}
            disabled={disableAdvancedControls}
            gapValue={gapValue}
            onGapModeChange={onGapModeChange}
            onGapValueChange={onGapValueChange}
            onSelectAlignment={onAlignmentChange}
        />
        <PaddingControls
            disabled={disableAdvancedControls}
            horizontalValue={paddingHorizontalValue}
            onHorizontalChange={onPaddingHorizontalChange}
            onVerticalChange={onPaddingVerticalChange}
            verticalValue={paddingVerticalValue}
        />
        <DimensionsControls
            clipChecked={clipChecked}
            disableAdvancedControls={disableAdvancedControls}
            heightValue={heightValue}
            heightMode={heightMode}
            onClipChange={onClipChange}
            onHeightChange={onHeightChange}
            onHeightModeChange={onHeightModeChange}
            onWidthChange={onWidthChange}
            onWidthModeChange={onWidthModeChange}
            showClip={showClip}
            widthValue={widthValue}
            widthMode={widthMode}
        />
    </div>
);

export const LayoutConfigurationContent = ({
    activeMode,
    activeAlignment,
    gapMode,
    gapValue,
    widthValue,
    widthMode,
    heightValue,
    heightMode,
    paddingHorizontalValue,
    paddingVerticalValue,
    clipChecked,
    showClip = true,
    disableAdvancedControls,
    onAlignmentChange,
    onGapModeChange,
    onGapValueChange,
    onWidthChange,
    onWidthModeChange,
    onHeightChange,
    onHeightModeChange,
    onPaddingHorizontalChange,
    onPaddingVerticalChange,
    onClipChange
}: LayoutConfigurationContentProps) =>
    activeMode === 'grid' ? (
        <StaticLayoutControls
            clipChecked={clipChecked}
            heightValue={heightValue ?? '1205'}
            onClipChange={onClipChange}
            onHeightChange={onHeightChange}
            onWidthChange={onWidthChange}
            showClip={showClip}
            widthValue={widthValue ?? '1920'}
        />
    ) : (
        <FlexLayoutControls
            activeAlignment={activeAlignment ?? 'top-left'}
            activeGapMode={gapMode ?? 'fixed'}
            activeMode={activeMode}
            clipChecked={clipChecked}
            disableAdvancedControls={disableAdvancedControls}
            gapValue={gapValue}
            heightValue={heightValue ?? '1205'}
            heightMode={heightMode}
            onAlignmentChange={onAlignmentChange ?? (() => undefined)}
            onClipChange={onClipChange}
            onGapModeChange={onGapModeChange ?? (() => undefined)}
            onGapValueChange={onGapValueChange}
            onHeightChange={onHeightChange}
            onHeightModeChange={onHeightModeChange}
            onPaddingHorizontalChange={onPaddingHorizontalChange}
            onPaddingVerticalChange={onPaddingVerticalChange}
            onWidthChange={onWidthChange}
            onWidthModeChange={onWidthModeChange}
            paddingHorizontalValue={paddingHorizontalValue ?? '0'}
            paddingVerticalValue={paddingVerticalValue ?? '0'}
            showClip={showClip}
            widthValue={widthValue ?? '404'}
            widthMode={widthMode}
        />
    );

export const FlexLayoutSection = ({
    activeMode: controlledActiveMode,
    defaultActiveMode = 'grid',
    onActiveModeChange,
    activeAlignment: controlledActiveAlignment,
    defaultActiveAlignment = 'top-left',
    onAlignmentChange,
    gapMode: controlledGapMode,
    defaultGapMode = 'fixed',
    gapValue: controlledGapValue,
    defaultGapValue = '0',
    onGapModeChange,
    onGapValueChange,
    widthValue,
    widthMode: controlledWidthMode,
    heightValue,
    heightMode: controlledHeightMode,
    paddingHorizontalValue: controlledPaddingHorizontalValue,
    paddingVerticalValue: controlledPaddingVerticalValue,
    defaultPaddingHorizontalValue = '0',
    defaultPaddingVerticalValue = '0',
    clipChecked,
    showClip = true,
    disableAdvancedControls,
    onWidthChange,
    onWidthModeChange,
    onHeightChange,
    onHeightModeChange,
    onPaddingHorizontalChange,
    onPaddingVerticalChange,
    onClipChange
}: FlexLayoutSectionProps = {}) => {
    const [activeMode, setActiveMode] = useState<LayoutMode>(defaultActiveMode);
    const [activeAlignment, setActiveAlignment] = useState<LayoutAlignmentId>(
        defaultActiveAlignment
    );
    const [activeGapMode, setActiveGapMode] =
        useState<LayoutGapMode>(defaultGapMode);
    const [gapValue, setGapValue] = useState(defaultGapValue);
    const [widthMode, setWidthMode] = useState<DimensionMode>('fixed');
    const [heightMode, setHeightMode] = useState<DimensionMode>('fixed');
    const [paddingHorizontalValue, setPaddingHorizontalValue] = useState(
        defaultPaddingHorizontalValue
    );
    const [paddingVerticalValue, setPaddingVerticalValue] = useState(
        defaultPaddingVerticalValue
    );
    const [lastFlexMode, setLastFlexMode] =
        useState<FlexDirectionMode>('vertical');
    const resolvedActiveMode = controlledActiveMode ?? activeMode;
    const resolvedActiveAlignment =
        controlledActiveAlignment ?? activeAlignment;
    const resolvedGapMode = controlledGapMode ?? activeGapMode;
    const resolvedGapValue = controlledGapValue ?? gapValue;
    const resolvedWidthMode = controlledWidthMode ?? widthMode;
    const resolvedHeightMode = controlledHeightMode ?? heightMode;
    const resolvedPaddingHorizontalValue =
        controlledPaddingHorizontalValue ?? paddingHorizontalValue;
    const resolvedPaddingVerticalValue =
        controlledPaddingVerticalValue ?? paddingVerticalValue;
    const isFlexLayout = resolvedActiveMode !== 'grid';

    const selectAlignment = (alignment: LayoutAlignmentId) => {
        if (controlledActiveAlignment === undefined) {
            setActiveAlignment(alignment);
        }

        onAlignmentChange?.(alignment);
    };

    const selectGapMode = (mode: LayoutGapMode) => {
        if (controlledGapMode === undefined) {
            setActiveGapMode(mode);
        }

        onGapModeChange?.(mode);
    };

    const updateGapValue = (value: string) => {
        if (controlledGapValue === undefined) {
            setGapValue(value);
        }

        onGapValueChange?.(value);
    };

    const updateWidthMode = (mode: DimensionMode) => {
        if (controlledWidthMode === undefined) {
            setWidthMode(mode);
        }

        onWidthModeChange?.(mode);
    };

    const updateHeightMode = (mode: DimensionMode) => {
        if (controlledHeightMode === undefined) {
            setHeightMode(mode);
        }

        onHeightModeChange?.(mode);
    };

    const updatePaddingHorizontalValue = (value: string) => {
        if (controlledPaddingHorizontalValue === undefined) {
            setPaddingHorizontalValue(value);
        }

        onPaddingHorizontalChange?.(value);
    };

    const updatePaddingVerticalValue = (value: string) => {
        if (controlledPaddingVerticalValue === undefined) {
            setPaddingVerticalValue(value);
        }

        onPaddingVerticalChange?.(value);
    };

    const selectLayoutMode = (mode: LayoutMode) => {
        if (controlledActiveMode === undefined) {
            setActiveMode(mode);
        }

        onActiveModeChange?.(mode);

        if (mode !== 'grid') {
            setLastFlexMode(mode);
        }
    };

    const toggleLayoutMode = () => {
        if (isFlexLayout) {
            setLastFlexMode(resolvedActiveMode);

            if (controlledActiveMode === undefined) {
                setActiveMode('grid');
            }

            onActiveModeChange?.('grid');
            return;
        }

        if (controlledActiveMode === undefined) {
            setActiveMode(lastFlexMode);
        }

        onActiveModeChange?.(lastFlexMode);
    };

    return (
        <section
            className="editor-inspector-section editor-inspector-section--layout grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group="layout"
        >
            <header className="editor-flex-layout-header flex h-6 items-center justify-between gap-2 bg-white">
                <span className="text-[12px] leading-none font-semibold text-[#2b2b2b]">
                    {isFlexLayout ? 'Flex Layout' : 'Layout'}
                </span>
                <button
                    aria-label={
                        isFlexLayout
                            ? 'Switch to layout'
                            : 'Switch to flex layout'
                    }
                    aria-pressed={isFlexLayout ? 'true' : 'false'}
                    className="grid h-[22px] w-[22px] cursor-default place-items-center rounded-md border-0 bg-transparent p-0 text-[#6d6d6d]"
                    onClick={toggleLayoutMode}
                    type="button"
                >
                    <LayoutDashboard
                        aria-hidden="true"
                        size={14}
                        strokeWidth={1.8}
                    />
                </button>
            </header>
            <div className="editor-layout-mode-control grid h-[34px] grid-cols-3 gap-px rounded-lg bg-[#ededed] p-0.5">
                {LAYOUT_MODE_OPTIONS.map(
                    ({ mode, label, icon: Icon, edge }) => (
                        <button
                            aria-label={label}
                            aria-pressed={
                                resolvedActiveMode === mode ? 'true' : 'false'
                            }
                            className={classNames(
                                'editor-layout-mode-segment grid h-full min-w-0 cursor-default place-items-center border-0 p-0',
                                edge === 'left' && 'rounded-l-md',
                                edge === 'right' && 'rounded-r-md',
                                resolvedActiveMode === mode
                                    ? 'editor-layout-mode-segment--active rounded-md border border-[#dadada] bg-white text-[#2f2f2f] shadow-[0_1px_2px_#00000014]'
                                    : 'bg-[#ededed] text-[#6e6e6e]'
                            )}
                            key={mode}
                            onClick={() => selectLayoutMode(mode)}
                            type="button"
                        >
                            <Icon
                                aria-hidden="true"
                                size={15}
                                strokeWidth={1.8}
                            />
                        </button>
                    )
                )}
            </div>
            <LayoutConfigurationContent
                activeAlignment={resolvedActiveAlignment}
                activeMode={resolvedActiveMode}
                clipChecked={clipChecked}
                disableAdvancedControls={disableAdvancedControls}
                gapMode={resolvedGapMode}
                gapValue={resolvedGapValue}
                heightValue={heightValue}
                heightMode={resolvedHeightMode}
                onAlignmentChange={selectAlignment}
                onClipChange={onClipChange}
                onGapModeChange={selectGapMode}
                onGapValueChange={updateGapValue}
                onHeightChange={onHeightChange}
                onHeightModeChange={updateHeightMode}
                onPaddingHorizontalChange={updatePaddingHorizontalValue}
                onPaddingVerticalChange={updatePaddingVerticalValue}
                onWidthChange={onWidthChange}
                onWidthModeChange={updateWidthMode}
                paddingHorizontalValue={resolvedPaddingHorizontalValue}
                paddingVerticalValue={resolvedPaddingVerticalValue}
                showClip={showClip}
                widthValue={widthValue}
                widthMode={resolvedWidthMode}
            />
        </section>
    );
};
