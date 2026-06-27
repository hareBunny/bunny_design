/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Square } from 'lucide-react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import {
    FRAME_INSPECTOR_PROPERTIES,
    getFrameInspectorGroup
} from '../../inspectorSchema';
import { InspectorValueInput } from '../../InspectorValueInput';
import type { InspectorFormValues } from '../formTypes';

export const AppearanceSectionFields = () => {
    const { control } = useFormContext<InspectorFormValues>();
    const nodeType = useWatch<InspectorFormValues, 'nodeType'>({
        control,
        name: 'nodeType'
    });
    const appearanceGroup = getFrameInspectorGroup('appearance');
    const { cornerRadius, opacity } = FRAME_INSPECTOR_PROPERTIES;
    const supportsCornerRadius =
        nodeType === 'frame' || nodeType === 'rectangle';

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group={appearanceGroup.id}
        >
            <header className="flex h-[22px] items-center text-[12px] leading-none font-semibold text-[#333333]">
                <span>{appearanceGroup.label}</span>
            </header>
            <div className="grid grid-cols-2 gap-2">
                <div data-schema-path={opacity.path}>
                    <Controller
                        control={control}
                        name="opacity"
                        render={({ field }) => (
                            <InspectorValueInput
                                ariaLabel="Opacity"
                                onValueChange={field.onChange}
                                unit="%"
                                value={field.value}
                            />
                        )}
                    />
                </div>
                <div data-schema-path={cornerRadius.path}>
                    <Controller
                        control={control}
                        name="cornerRadius"
                        render={({ field }) => (
                            <InspectorValueInput
                                ariaLabel="Corner radius"
                                disabled={!supportsCornerRadius}
                                onValueChange={field.onChange}
                                startIcon={Square}
                                value={field.value}
                            />
                        )}
                    />
                </div>
            </div>
        </section>
    );
};
