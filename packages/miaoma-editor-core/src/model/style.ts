/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type EditorStyleId = string;

type EditorStyleItemBase = {
    id: EditorStyleId;
    enabled: boolean;
};

type EditorColorPaint = {
    type: 'color';
    color: string;
};

type EditorGradientPaint = {
    type: 'gradient';
    gradientType: 'linear';
    rotation?: number;
    colors: {
        color: string;
        position: number;
    }[];
};

type EditorImagePaint = {
    type: 'image';
    url: string;
    mode: 'fill' | 'fit' | 'stretch';
};

type EditorPaint = EditorColorPaint | EditorGradientPaint | EditorImagePaint;

export type FillItem = EditorStyleItemBase & EditorPaint;

export type StrokeItem = EditorStyleItemBase &
    EditorPaint & {
        width: number;
        align?: 'center' | 'inner' | 'outer';
    };

export type EffectItem = EditorStyleItemBase & {
    type: 'shadow';
    shadowType?: 'inner' | 'outer';
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
};

export type EditorStyleArrayField = 'fills' | 'strokes' | 'effects';

export type EditorStyleItem = EffectItem | FillItem | StrokeItem;

export type EditorStyleItemPatch = Partial<EditorStyleItem>;
