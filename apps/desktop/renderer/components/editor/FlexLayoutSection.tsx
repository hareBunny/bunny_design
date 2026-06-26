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

type GapMode = 'fixed' | 'between' | 'around';
type FlexDirectionMode = Exclude<LayoutMode, 'grid'>;

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
    { mode: 'right', label: 'Right layout', icon: ArrowRight, edge: 'right' }
];

const AlignmentMatrix = ({
    activeAlignment,
    activeGapMode,
    activeMode,
    onSelectAlignment
}: {
    activeAlignment: AlignmentCellId;
    activeGapMode: GapMode;
    activeMode: LayoutMode;
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
            className="editor-alignment-matrix h-[69px] w-[100px] rounded-lg border border-[#e3e3e3] bg-[#f8f8f8]"
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
    onSelect,
    selected
}: {
    option: (typeof GAP_MODE_OPTIONS)[number];
    onSelect: () => void;
    selected?: boolean;
}) => (
    <div className="editor-gap-radio-row flex min-w-0 items-center gap-2">
        <button
            aria-label={option.ariaLabel}
            aria-pressed={selected ? 'true' : 'false'}
            className={classNames(
                'group flex h-5 min-w-0 cursor-default items-center gap-2 border-0 bg-transparent p-0 text-left',
                !option.value && 'flex-1',
                selected ? 'text-[#111111]' : 'text-[#333333]'
            )}
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
            <InspectorValueInput
                ariaLabel="Gap value"
                className="w-[42px] bg-white px-2"
                inputClassName="text-center"
                size="compact"
                value={option.value}
            />
        ) : null}
    </div>
);

const AlignmentAndGapControls = ({
    activeMode
}: {
    activeMode: LayoutMode;
}) => {
    const [activeAlignment, setActiveAlignment] =
        useState<AlignmentCellId>('top-left');
    const [activeGapMode, setActiveGapMode] = useState<GapMode>('fixed');

    return (
        <div className="editor-flex-alignment-gap-row grid h-[90px] grid-cols-[104px_minmax(0,1fr)] gap-3">
            <div className="editor-flex-alignment-column grid content-start gap-2">
                <span className="text-[11px] leading-none font-medium text-[#666666]">
                    Alignment
                </span>
                <AlignmentMatrix
                    activeAlignment={activeAlignment}
                    activeGapMode={activeGapMode}
                    activeMode={activeMode}
                    onSelectAlignment={setActiveAlignment}
                />
            </div>
            <div className="editor-flex-gap-column grid content-start gap-2">
                <span className="text-[11px] leading-none font-medium text-[#666666]">
                    Gap
                </span>
                {GAP_MODE_OPTIONS.map((option) => (
                    <GapRadioRow
                        key={option.mode}
                        option={option}
                        selected={activeGapMode === option.mode}
                        onSelect={() => setActiveGapMode(option.mode)}
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
    leftLabel,
    rightLabel,
    rowClassName
}: {
    leftLabel: string;
    rightLabel: string;
    rowClassName?: string;
}) => (
    <div
        className={classNames(
            'grid grid-cols-[minmax(0,1fr)_116px] items-center gap-5',
            rowClassName
        )}
    >
        <InspectorCheckbox label={leftLabel} />
        <InspectorCheckbox label={rightLabel} />
    </div>
);

const PaddingControls = () => (
    <div className="editor-flex-padding-section grid gap-1.5">
        <LayoutSubsectionHeader title="Padding" withSettings />
        <div className="grid grid-cols-2 gap-2">
            <InspectorValueInput
                ariaLabel="Horizontal padding"
                startIcon={PanelLeft}
                value="0"
            />
            <InspectorValueInput
                ariaLabel="Vertical padding"
                startIcon={PanelTop}
                value="0"
            />
        </div>
    </div>
);

const DimensionsControls = () => (
    <div className="editor-flex-dimensions-section grid gap-2">
        <LayoutSubsectionHeader title="Dimensions" />
        <div className="grid grid-cols-2 gap-2">
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.width.path}>
                <InspectorValueInput
                    ariaLabel="Width"
                    label={FRAME_INSPECTOR_PROPERTIES.width.label}
                    value="404"
                />
            </div>
            <div data-schema-path={FRAME_INSPECTOR_PROPERTIES.height.path}>
                <InspectorValueInput
                    ariaLabel="Height"
                    label={FRAME_INSPECTOR_PROPERTIES.height.label}
                    value="1205"
                />
            </div>
        </div>
        <div className="grid gap-1.5">
            <CheckboxPairRow
                leftLabel="Fill Width"
                rightLabel="Fill Height"
                rowClassName="h-[23px]"
            />
            <CheckboxPairRow
                leftLabel="Hug Width"
                rightLabel="Hug Height"
                rowClassName="h-[22px]"
            />
            <div
                className="flex h-[22px] items-center"
                data-schema-path={FRAME_INSPECTOR_PROPERTIES.clip.path}
            >
                <InspectorCheckbox label="Clip Content" />
            </div>
        </div>
    </div>
);

const StaticLayoutControls = () => (
    <div className="editor-static-layout-controls grid gap-1.5">
        <div className="grid grid-cols-2 gap-2">
            <InspectorValueInput
                ariaLabel="Static width"
                label="W"
                value="1920"
            />
            <InspectorValueInput
                ariaLabel="Static height"
                label="H"
                value="1205"
            />
        </div>
        <CheckboxPairRow
            leftLabel="Fill Width"
            rightLabel="Fill Height"
            rowClassName="min-h-[22px]"
        />
        <div className="flex min-h-7 items-center justify-start gap-5">
            <InspectorCheckbox checked label="Clip Content" />
        </div>
    </div>
);

const FlexLayoutControls = ({ activeMode }: { activeMode: LayoutMode }) => (
    <div className="editor-flex-layout-controls grid gap-1.5">
        <AlignmentAndGapControls activeMode={activeMode} />
        <PaddingControls />
        <DimensionsControls />
    </div>
);

export const LayoutConfigurationContent = ({
    activeMode
}: {
    activeMode: LayoutMode;
}) =>
    activeMode === 'grid' ? (
        <StaticLayoutControls />
    ) : (
        <FlexLayoutControls activeMode={activeMode} />
    );

export const FlexLayoutSection = () => {
    const [activeMode, setActiveMode] = useState<LayoutMode>('vertical');
    const [lastFlexMode, setLastFlexMode] =
        useState<FlexDirectionMode>('vertical');
    const isFlexLayout = activeMode !== 'grid';

    const selectLayoutMode = (mode: LayoutMode) => {
        setActiveMode(mode);

        if (mode !== 'grid') {
            setLastFlexMode(mode);
        }
    };

    const toggleLayoutMode = () => {
        if (isFlexLayout) {
            setLastFlexMode(activeMode);
            setActiveMode('grid');
            return;
        }

        setActiveMode(lastFlexMode);
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
                                activeMode === mode ? 'true' : 'false'
                            }
                            className={classNames(
                                'editor-layout-mode-segment grid h-full min-w-0 cursor-default place-items-center border-0 p-0',
                                edge === 'left' && 'rounded-l-md',
                                edge === 'right' && 'rounded-r-md',
                                activeMode === mode
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
            <LayoutConfigurationContent activeMode={activeMode} />
        </section>
    );
};
