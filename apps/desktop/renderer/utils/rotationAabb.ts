/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

const toRadians = (rotation = 0) => (rotation * Math.PI) / 180;
const normalizeFloatingPoint = (value: number) => {
    const rounded = Math.round(value);
    return Math.abs(value - rounded) < 1e-10 ? rounded : value;
};

export const getRotatedBoundingBoxSize = ({
    width,
    height,
    rotation = 0
}: {
    width: number;
    height: number;
    rotation?: number;
}) => {
    const radians = toRadians(rotation);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    return {
        width: normalizeFloatingPoint(
            Math.abs(width * cos) + Math.abs(height * sin)
        ),
        height: normalizeFloatingPoint(
            Math.abs(width * sin) + Math.abs(height * cos)
        )
    };
};

export const getCenterFromAabb = ({
    x,
    y,
    width,
    height,
    rotation = 0
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}) => {
    const bbox = getRotatedBoundingBoxSize({ width, height, rotation });

    return {
        x: x + bbox.width / 2,
        y: y + bbox.height / 2
    };
};

export const getAabbFromCenter = ({
    centerX,
    centerY,
    width,
    height,
    rotation = 0
}: {
    centerX: number;
    centerY: number;
    width: number;
    height: number;
    rotation?: number;
}) => {
    const bbox = getRotatedBoundingBoxSize({ width, height, rotation });

    return {
        x: centerX - bbox.width / 2,
        y: centerY - bbox.height / 2,
        width: bbox.width,
        height: bbox.height
    };
};

export const getRenderOriginFromAabb = ({
    x,
    y,
    width,
    height,
    rotation = 0
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
}) => {
    const center = getCenterFromAabb({ x, y, width, height, rotation });

    return {
        x: center.x - width / 2,
        y: center.y - height / 2
    };
};
