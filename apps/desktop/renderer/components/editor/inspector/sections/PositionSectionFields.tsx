/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Controller, useFormContext } from 'react-hook-form';

import {
    FRAME_INSPECTOR_PROPERTIES,
    getFrameInspectorGroup
} from '../../inspectorSchema';
import { InspectorValueInput } from '../../InspectorValueInput';
import type { InspectorFormValues } from '../formTypes';

export const PositionSectionFields = () => {
    const { control } = useFormContext<InspectorFormValues>();
    const positionGroup = getFrameInspectorGroup('position');
    const { rotation, x, y } = FRAME_INSPECTOR_PROPERTIES;

    return (
        <section
            className="editor-inspector-section grid gap-2 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group={positionGroup.id}
        >
            <header className="flex h-[22px] items-center text-[12px] leading-none font-semibold text-[#333333]">
                <span>{positionGroup.label}</span>
            </header>
            <div className="grid grid-cols-2 gap-2">
                <div data-schema-path={x.path}>
                    <Controller
                        control={control}
                        name="x"
                        render={({ field }) => (
                            <InspectorValueInput
                                ariaLabel="X position"
                                label={x.label}
                                onValueChange={field.onChange}
                                value={field.value}
                            />
                        )}
                    />
                </div>
                <div data-schema-path={y.path}>
                    <Controller
                        control={control}
                        name="y"
                        render={({ field }) => (
                            <InspectorValueInput
                                ariaLabel="Y position"
                                label={y.label}
                                onValueChange={field.onChange}
                                value={field.value}
                            />
                        )}
                    />
                </div>
                <div data-schema-path={rotation.path}>
                    <Controller
                        control={control}
                        name="rotation"
                        render={({ field }) => (
                            <InspectorValueInput
                                ariaLabel="Rotation"
                                label={rotation.label}
                                onValueChange={field.onChange}
                                unit={rotation.unit}
                                value={field.value}
                            />
                        )}
                    />
                </div>
            </div>
        </section>
    );
};
