/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useFormContext, useWatch } from 'react-hook-form';

import { FlexLayoutSection, type LayoutMode } from '../../FlexLayoutSection';
import type { InspectorFormValues } from '../formTypes';

type FrameLayoutSectionFieldsProps = {
    showClip?: boolean;
};

const layoutToMode = (layout: InspectorFormValues['layout']): LayoutMode => {
    if (layout === 'vertical') {
        return 'vertical';
    }

    if (layout === 'horizontal') {
        return 'right';
    }

    return 'grid';
};

const modeToLayout = (mode: LayoutMode): InspectorFormValues['layout'] => {
    if (mode === 'vertical') {
        return 'vertical';
    }

    if (mode === 'right') {
        return 'horizontal';
    }

    return 'none';
};

export const FrameLayoutSectionFields = ({
    showClip = false
}: FrameLayoutSectionFieldsProps) => {
    const { control, setValue } = useFormContext<InspectorFormValues>();
    const [
        layout,
        width,
        widthMode,
        height,
        heightMode,
        clip,
        layoutAlignment,
        layoutGapMode,
        gap,
        paddingHorizontal,
        paddingVertical
    ] = useWatch({
        control,
        name: [
            'layout',
            'width',
            'widthMode',
            'height',
            'heightMode',
            'clip',
            'layoutAlignment',
            'layoutGapMode',
            'gap',
            'paddingHorizontal',
            'paddingVertical'
        ]
    });

    return (
        <FlexLayoutSection
            activeMode={layoutToMode(layout)}
            activeAlignment={layoutAlignment}
            clipChecked={clip}
            gapMode={layoutGapMode}
            gapValue={gap}
            heightValue={height}
            heightMode={heightMode}
            onActiveModeChange={(mode) => {
                setValue('layout', modeToLayout(mode), {
                    shouldDirty: true
                });
            }}
            onAlignmentChange={(value) => {
                setValue('layoutAlignment', value, {
                    shouldDirty: true
                });
            }}
            onClipChange={(checked) => {
                setValue('clip', checked, {
                    shouldDirty: true
                });
            }}
            onGapModeChange={(value) => {
                setValue('layoutGapMode', value, {
                    shouldDirty: true
                });
            }}
            onGapValueChange={(value) => {
                setValue('gap', value, {
                    shouldDirty: true
                });
            }}
            onHeightChange={(value) => {
                setValue('height', value, {
                    shouldDirty: true
                });
            }}
            onHeightModeChange={(value) => {
                setValue('heightMode', value, {
                    shouldDirty: true
                });
            }}
            onPaddingHorizontalChange={(value) => {
                setValue('paddingHorizontal', value, {
                    shouldDirty: true
                });
            }}
            onPaddingVerticalChange={(value) => {
                setValue('paddingVertical', value, {
                    shouldDirty: true
                });
            }}
            onWidthChange={(value) => {
                setValue('width', value, {
                    shouldDirty: true
                });
            }}
            onWidthModeChange={(value) => {
                setValue('widthMode', value, {
                    shouldDirty: true
                });
            }}
            paddingHorizontalValue={paddingHorizontal}
            paddingVerticalValue={paddingVertical}
            showClip={showClip}
            widthValue={width}
            widthMode={widthMode}
        />
    );
};
