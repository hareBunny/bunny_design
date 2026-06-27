/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Plus } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { FillControl } from '../../FillControl';
import {
    FRAME_INSPECTOR_PROPERTIES,
    getFrameInspectorGroup
} from '../../inspectorSchema';
import { useEditorSession } from '../../state/useEditorSession';
import type { InspectorFillFormItem, InspectorFormValues } from '../formTypes';
import {
    composeHexColorValue,
    createInspectorStyleItemId,
    getPaintDisplayValue,
    getPaintPreviewStyle,
    splitHexColorValue
} from '../styleFieldUtils';

const updateColorFields = (
    index: number,
    nextValue: string,
    opacityValue: string,
    setValue: ReturnType<typeof useFormContext<InspectorFormValues>>['setValue']
) => {
    const trimmedValue = nextValue.trim();
    const isCommittedHexValue = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(
        trimmedValue
    );

    if (!isCommittedHexValue) {
        setValue(`fills.${index}.color`, nextValue, {
            shouldDirty: true
        });
        return null;
    }

    const parsedColor = splitHexColorValue(trimmedValue);

    if (!parsedColor) {
        setValue(`fills.${index}.color`, nextValue, {
            shouldDirty: true
        });
        return null;
    }

    const nextOpacity =
        trimmedValue.length === 9 ? parsedColor.opacity : opacityValue;
    const nextColor = composeHexColorValue(parsedColor.color, nextOpacity);

    setValue(`fills.${index}.color`, parsedColor.color, {
        shouldDirty: true
    });
    setValue(`fills.${index}.opacity`, nextOpacity, {
        shouldDirty: true
    });

    return nextColor;
};

const FillRowFields = ({
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
    const { control, getValues, setValue } =
        useFormContext<InspectorFormValues>();
    const session = useEditorSession();
    const item = useWatch({
        control,
        name: `fills.${index}`
    }) as InspectorFillFormItem;

    return (
        <div
            className="grid gap-1.5"
            data-style-field="fills"
            data-style-item-id={itemId}
            data-style-kind={item.type}
            data-testid={`style-row-${itemId}`}
        >
            <FillControl
                disabled={!item.enabled}
                opacity={item.opacity}
                opacityAriaLabel="Fill opacity"
                opacityDisabled={item.type !== 'color'}
                onOpacityChange={(value) => {
                    setValue(`fills.${index}.opacity`, value, {
                        shouldDirty: true
                    });

                    if (item.type !== 'color') {
                        return;
                    }

                    const nextColor = composeHexColorValue(item.color, value);

                    if (nextColor) {
                        session.updateStyleItem(nodeId, 'fills', itemId, {
                            color: nextColor
                        });
                    }
                }}
                onRemove={onRemove}
                onValueChange={
                    item.type === 'color'
                        ? (value) => {
                              const nextColor = updateColorFields(
                                  index,
                                  value,
                                  getValues(`fills.${index}.opacity`),
                                  setValue
                              );

                              if (nextColor) {
                                  session.updateStyleItem(
                                      nodeId,
                                      'fills',
                                      itemId,
                                      {
                                          color: nextColor
                                      }
                                  );
                              }
                          }
                        : undefined
                }
                preview={
                    <span
                        className="h-3.5 w-3.5 shrink-0 rounded-[3px] border border-[#d1d5db]"
                        style={getPaintPreviewStyle(item)}
                    />
                }
                removeAriaLabel="Remove fill"
                value={
                    item.type === 'color'
                        ? item.color
                        : getPaintDisplayValue(item)
                }
                valueAriaLabel="Fill color"
                valueDisabled={item.type !== 'color'}
            />
        </div>
    );
};

export const FillArraySection = ({ nodeId }: { nodeId: string }) => {
    const { control } = useFormContext<InspectorFormValues>();
    const session = useEditorSession();
    const fillGroup = getFrameInspectorGroup('fill');
    const { fill } = FRAME_INSPECTOR_PROPERTIES;
    const { append, fields, remove } = useFieldArray({
        control,
        name: 'fills',
        keyName: 'fieldKey'
    });

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group={fillGroup.id}
            data-schema-path={fill.path}
        >
            <header className="flex h-[22px] items-center justify-between text-[12px] leading-none font-semibold text-[#333333]">
                <span>{fillGroup.label}</span>
                <button
                    aria-label="Add fill"
                    className="grid h-5 w-5 cursor-default place-items-center rounded-md border-0 bg-transparent p-0 text-[#888888]"
                    onClick={() => {
                        const nextItem: InspectorFillFormItem = {
                            itemId: createInspectorStyleItemId('fill'),
                            enabled: true,
                            type: 'color',
                            color: '#ffffff',
                            opacity: '100%',
                            rotation: '',
                            url: '',
                            mode: 'fill',
                            gradientType: '',
                            gradientColors: []
                        };

                        append(nextItem);
                        session.appendStyleItem(nodeId, 'fills', {
                            id: nextItem.itemId,
                            enabled: nextItem.enabled,
                            type: 'color',
                            color: nextItem.color
                        });
                    }}
                    type="button"
                >
                    <Plus aria-hidden="true" size={14} strokeWidth={1.8} />
                </button>
            </header>
            {fields.map((item, index) => (
                <FillRowFields
                    index={index}
                    itemId={item.itemId}
                    key={item.fieldKey}
                    nodeId={nodeId}
                    onRemove={() => {
                        remove(index);
                        session.removeStyleItem(nodeId, 'fills', item.itemId);
                    }}
                />
            ))}
        </section>
    );
};
