/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Minus, Plus } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import {
    FRAME_INSPECTOR_PROPERTIES,
    getFrameInspectorGroup
} from '../../inspectorSchema';
import { InspectorValueInput } from '../../InspectorValueInput';
import { useEditorSession } from '../../state/useEditorSession';
import type {
    InspectorEffectFormItem,
    InspectorFormValues
} from '../formTypes';
import { createInspectorStyleItemId } from '../styleFieldUtils';

const EffectRowFields = ({
    index,
    itemId,
    nodeId,
    onRemove
}: {
    index: number;
    itemId: string;
    nodeId: string;
    onRemove: () => void;
}) => {
    const { control, setValue } = useFormContext<InspectorFormValues>();
    const session = useEditorSession();
    const item = useWatch({
        control,
        name: `effects.${index}`
    }) as InspectorEffectFormItem;

    const updateNumericValue = (
        fieldName: 'blur' | 'offsetX' | 'offsetY',
        nextValue: string
    ) => {
        setValue(`effects.${index}.${fieldName}`, nextValue, {
            shouldDirty: true
        });

        const parsedValue = Number(nextValue);

        if (Number.isFinite(parsedValue)) {
            session.updateStyleItem(nodeId, 'effects', itemId, {
                [fieldName]: parsedValue
            });
        }
    };

    return (
        <div
            className="grid gap-1.5 border-t border-[#efefef] pt-1.5 first:border-t-0 first:pt-0"
            data-style-field="effects"
            data-style-item-id={itemId}
            data-style-kind={item.type}
            data-testid={`style-row-${itemId}`}
        >
            <div className="flex h-6 items-center justify-between">
                <span className="text-[11px] leading-none font-medium text-[#666666]">
                    {item.shadowType === 'inner'
                        ? 'Inner shadow'
                        : 'Drop shadow'}
                </span>
                <button
                    aria-label="Remove effect"
                    className="grid h-5 w-5 cursor-default place-items-center rounded-md border-0 bg-transparent p-0 text-[#8a8a8a]"
                    onClick={onRemove}
                    type="button"
                >
                    <Minus aria-hidden="true" size={14} strokeWidth={1.8} />
                </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <InspectorValueInput
                    ariaLabel="Effect color"
                    onValueChange={(value) => {
                        setValue(`effects.${index}.color`, value, {
                            shouldDirty: true
                        });
                        session.updateStyleItem(nodeId, 'effects', itemId, {
                            color: value
                        });
                    }}
                    swatch={item.color || '#000000'}
                    value={item.color}
                />
                <InspectorValueInput
                    ariaLabel="Effect blur"
                    label="Blur"
                    onValueChange={(value) => {
                        updateNumericValue('blur', value);
                    }}
                    value={item.blur}
                />
                <InspectorValueInput
                    ariaLabel="Effect offset x"
                    label="X"
                    onValueChange={(value) => {
                        updateNumericValue('offsetX', value);
                    }}
                    value={item.offsetX}
                />
                <InspectorValueInput
                    ariaLabel="Effect offset y"
                    label="Y"
                    onValueChange={(value) => {
                        updateNumericValue('offsetY', value);
                    }}
                    value={item.offsetY}
                />
            </div>
        </div>
    );
};

export const EffectArraySection = ({ nodeId }: { nodeId: string }) => {
    const { control } = useFormContext<InspectorFormValues>();
    const session = useEditorSession();
    const effectGroup = getFrameInspectorGroup('effects');
    const { effect } = FRAME_INSPECTOR_PROPERTIES;
    const { append, fields, remove } = useFieldArray({
        control,
        name: 'effects',
        keyName: 'fieldKey'
    });

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group="effects"
            data-schema-path={effect.path}
        >
            <header className="flex h-[22px] items-center justify-between text-[12px] leading-none font-semibold text-[#333333]">
                <span>{effectGroup.label}</span>
                <button
                    aria-label="Add effect"
                    className="grid h-5 w-5 cursor-default place-items-center rounded-md border-0 bg-transparent p-0 text-[#888888]"
                    onClick={() => {
                        const nextItem: InspectorEffectFormItem = {
                            itemId: createInspectorStyleItemId('effect'),
                            enabled: true,
                            type: 'shadow',
                            shadowType: 'outer',
                            color: '#00000033',
                            offsetX: '0',
                            offsetY: '4',
                            blur: '12'
                        };

                        append(nextItem);
                        session.appendStyleItem(nodeId, 'effects', {
                            id: nextItem.itemId,
                            enabled: nextItem.enabled,
                            type: nextItem.type,
                            shadowType: 'outer',
                            color: nextItem.color,
                            offsetX: 0,
                            offsetY: 4,
                            blur: 12
                        });
                    }}
                    type="button"
                >
                    <Plus aria-hidden="true" size={14} strokeWidth={1.8} />
                </button>
            </header>
            {fields.map((item, index) => (
                <EffectRowFields
                    index={index}
                    itemId={item.itemId}
                    key={item.fieldKey}
                    nodeId={nodeId}
                    onRemove={() => {
                        remove(index);
                        session.removeStyleItem(nodeId, 'effects', item.itemId);
                    }}
                />
            ))}
        </section>
    );
};
