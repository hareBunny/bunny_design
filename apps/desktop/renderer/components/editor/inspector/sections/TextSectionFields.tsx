/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Controller, useFormContext } from 'react-hook-form';

import { InspectorValueInput } from '../../InspectorValueInput';
import type { InspectorFormValues } from '../formTypes';

export const TextSectionFields = () => {
    const { control } = useFormContext<InspectorFormValues>();

    return (
        <section className="editor-inspector-section grid gap-2 border-b border-[#e9e9e9] px-3.5 py-2">
            <header className="flex h-[22px] items-center text-[12px] leading-none font-semibold text-[#333333]">
                <span>Text</span>
            </header>
            <Controller
                control={control}
                name="fontSize"
                render={({ field }) => (
                    <InspectorValueInput
                        ariaLabel="Font size"
                        label="Size"
                        onValueChange={field.onChange}
                        value={field.value}
                    />
                )}
            />
        </section>
    );
};
