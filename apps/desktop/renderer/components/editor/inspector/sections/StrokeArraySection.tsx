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
import { InspectorValueInput } from '../../InspectorValueInput';
import { useEditorSession } from '../../state/useEditorSession';
import type {
    InspectorFormValues,
    InspectorStrokeFormItem
} from '../formTypes';
import {
    composeHexColorValue,
    createInspectorStyleItemId,
    getPaintDisplayValue,
    getPaintPreviewStyle,
    splitHexColorValue
} from '../styleFieldUtils';

const updateStrokeColorFields = (
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
        setValue(`strokes.${index}.color`, nextValue, {
            shouldDirty: true
        });
        return null;
    }

    const parsedColor = splitHexColorValue(trimmedValue);

    if (!parsedColor) {
        setValue(`strokes.${index}.color`, nextValue, {
            shouldDirty: true
        });
        return null;
    }

    const nextOpacity =
        trimmedValue.length === 9 ? parsedColor.opacity : opacityValue;
    const nextColor = composeHexColorValue(parsedColor.color, nextOpacity);

    setValue(`strokes.${index}.color`, parsedColor.color, {
        shouldDirty: true
    });
    setValue(`strokes.${index}.opacity`, nextOpacity, {
        shouldDirty: true
    });

    return nextColor;
};

const StrokeRowFields = ({
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
        name: `strokes.${index}`
    }) as InspectorStrokeFormItem;

    return (
        <div
            className="grid gap-1.5"
            data-style-field="strokes"
            data-style-item-id={itemId}
            data-style-kind={item.type}
            data-testid={`style-row-${itemId}`}
        >
            <FillControl
                disabled={!item.enabled}
                extraControl={
                    <div className="w-[116px]">
                        <InspectorValueInput
                            ariaLabel="Stroke width"
                            label="W"
                            onValueChange={(value) => {
                                setValue(`strokes.${index}.width`, value, {
                                    shouldDirty: true
                                });

                                const nextWidth = Number(value);

                                if (Number.isFinite(nextWidth)) {
                                    session.updateStyleItem(
                                        nodeId,
                                        'strokes',
                                        itemId,
                                        {
                                            width: nextWidth
                                        }
                                    );
                                }
                            }}
                            value={item.width}
                        />
                    </div>
                }
                opacity={item.opacity}
                opacityAriaLabel="Stroke opacity"
                opacityDisabled={item.type !== 'color'}
                onOpacityChange={(value) => {
                    setValue(`strokes.${index}.opacity`, value, {
                        shouldDirty: true
                    });

                    if (item.type !== 'color') {
                        return;
                    }

                    const nextColor = composeHexColorValue(item.color, value);

                    if (nextColor) {
                        session.updateStyleItem(nodeId, 'strokes', itemId, {
                            color: nextColor
                        });
                    }
                }}
                onRemove={onRemove}
                onValueChange={
                    item.type === 'color'
                        ? (value) => {
                              const nextColor = updateStrokeColorFields(
                                  index,
                                  value,
                                  getValues(`strokes.${index}.opacity`),
                                  setValue
                              );

                              if (nextColor) {
                                  session.updateStyleItem(
                                      nodeId,
                                      'strokes',
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
                removeAriaLabel="Remove stroke"
                value={
                    item.type === 'color'
                        ? item.color
                        : getPaintDisplayValue(item)
                }
                valueAriaLabel="Stroke color"
                valueDisabled={item.type !== 'color'}
            />
        </div>
    );
};

export const StrokeArraySection = ({ nodeId }: { nodeId: string }) => {
    const { control } = useFormContext<InspectorFormValues>();
    const session = useEditorSession();
    const strokeGroup = getFrameInspectorGroup('stroke');
    const { stroke } = FRAME_INSPECTOR_PROPERTIES;
    const { append, fields, remove } = useFieldArray({
        control,
        name: 'strokes',
        keyName: 'fieldKey'
    });

    return (
        <section
            className="editor-inspector-section grid gap-1.5 border-b border-[#e9e9e9] px-3.5 py-2"
            data-schema-group="stroke"
            data-schema-path={stroke.path}
        >
            <header className="flex h-[22px] items-center justify-between text-[12px] leading-none font-semibold text-[#333333]">
                <span>{strokeGroup.label}</span>
                <button
                    aria-label="Add stroke"
                    className="grid h-5 w-5 cursor-default place-items-center rounded-md border-0 bg-transparent p-0 text-[#888888]"
                    onClick={() => {
                        const nextItem: InspectorStrokeFormItem = {
                            itemId: createInspectorStyleItemId('stroke'),
                            enabled: true,
                            type: 'color',
                            color: '#000000',
                            opacity: '100%',
                            rotation: '',
                            url: '',
                            mode: 'fill',
                            gradientType: '',
                            gradientColors: [],
                            width: '1',
                            align: 'inner'
                        };

                        append(nextItem);
                        session.appendStyleItem(nodeId, 'strokes', {
                            id: nextItem.itemId,
                            enabled: nextItem.enabled,
                            type: 'color',
                            color: nextItem.color,
                            width: 1,
                            align: 'inner'
                        });
                    }}
                    type="button"
                >
                    <Plus aria-hidden="true" size={14} strokeWidth={1.8} />
                </button>
            </header>
            {fields.map((item, index) => (
                <StrokeRowFields
                    index={index}
                    itemId={item.itemId}
                    key={item.fieldKey}
                    nodeId={nodeId}
                    onRemove={() => {
                        remove(index);
                        session.removeStyleItem(nodeId, 'strokes', item.itemId);
                    }}
                />
            ))}
        </section>
    );
};
