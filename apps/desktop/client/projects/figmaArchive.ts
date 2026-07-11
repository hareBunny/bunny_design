/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { decompress } from 'fzstd';
import { compileSchema, decodeBinarySchema } from 'kiwi-schema';
import { readFile } from 'node:fs/promises';
import { inflateRawSync, inflateSync } from 'node:zlib';

export type UnknownRecord = Record<string, unknown>;

export type FigmaGuid = {
    sessionID?: number;
    localID?: number;
};

export type FigmaTransform = {
    m00?: number;
    m01?: number;
    m02?: number;
    m10?: number;
    m11?: number;
    m12?: number;
};

export type FigmaNodeChange = UnknownRecord & {
    guid?: FigmaGuid;
    parentIndex?: { guid?: FigmaGuid; position?: string };
    phase?: string;
    type?: string;
    name?: string;
    visible?: boolean;
    opacity?: number;
    size?: { x?: number; y?: number };
    transform?: FigmaTransform;
    fillPaints?: UnknownRecord[];
    strokePaints?: UnknownRecord[];
    strokeWeight?: number;
    strokeAlign?: string;
    effects?: UnknownRecord[];
    cornerRadius?: number;
    rectangleTopLeftCornerRadius?: number;
    rectangleTopRightCornerRadius?: number;
    rectangleBottomRightCornerRadius?: number;
    rectangleBottomLeftCornerRadius?: number;
    frameMaskDisabled?: boolean;
    textData?: { characters?: string };
    fontName?: { family?: string; style?: string };
    fontSize?: number;
    lineHeight?: { value?: number; units?: string };
    textAlignHorizontal?: string;
    textAutoResize?: string;
    derivedTextData?: { fontMetaData?: { fontWeight?: number }[] };
};

export type FigmaDecodedMessage = {
    nodeChanges: FigmaNodeChange[];
};

type ZipEntry = {
    compressionMethod: number;
    compressedSize: number;
    localHeaderOffset: number;
    name: string;
};

const FIG_KIWI_MAGIC = 'fig-kiwi';
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_LOCAL_FILE_SIGNATURE = 0x04034b50;
const ZSTD_MAGIC = [0x28, 0xb5, 0x2f, 0xfd] as const;

export const isRecord = (value: unknown): value is UnknownRecord =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export const readFiniteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const findEndOfCentralDirectory = (archive: Buffer) => {
    const minimumOffset = Math.max(0, archive.length - 65_557);

    for (let offset = archive.length - 22; offset >= minimumOffset; offset--) {
        if (
            archive.readUInt32LE(offset) ===
            ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE
        ) {
            return offset;
        }
    }

    throw new Error('Figma archive is missing its ZIP directory.');
};

const readZipEntries = (archive: Buffer): Map<string, Uint8Array> => {
    const endOffset = findEndOfCentralDirectory(archive);
    const entryCount = archive.readUInt16LE(endOffset + 10);
    let directoryOffset = archive.readUInt32LE(endOffset + 16);
    const entries: ZipEntry[] = [];

    for (let index = 0; index < entryCount; index++) {
        if (
            archive.readUInt32LE(directoryOffset) !==
            ZIP_CENTRAL_DIRECTORY_SIGNATURE
        ) {
            throw new Error('Figma archive has an invalid ZIP directory.');
        }

        const flags = archive.readUInt16LE(directoryOffset + 8);
        const compressionMethod = archive.readUInt16LE(directoryOffset + 10);
        const compressedSize = archive.readUInt32LE(directoryOffset + 20);
        const nameLength = archive.readUInt16LE(directoryOffset + 28);
        const extraLength = archive.readUInt16LE(directoryOffset + 30);
        const commentLength = archive.readUInt16LE(directoryOffset + 32);
        const localHeaderOffset = archive.readUInt32LE(directoryOffset + 42);
        const nameStart = directoryOffset + 46;
        const name = archive
            .subarray(nameStart, nameStart + nameLength)
            .toString('utf8');

        if ((flags & 1) !== 0) {
            throw new Error('Encrypted Figma archives are not supported.');
        }

        if (compressedSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
            throw new Error('ZIP64 Figma archives are not supported.');
        }

        entries.push({
            compressionMethod,
            compressedSize,
            localHeaderOffset,
            name
        });
        directoryOffset = nameStart + nameLength + extraLength + commentLength;
    }

    return new Map(
        entries.map((entry) => {
            const { localHeaderOffset } = entry;

            if (
                archive.readUInt32LE(localHeaderOffset) !==
                ZIP_LOCAL_FILE_SIGNATURE
            ) {
                throw new Error('Figma archive has an invalid ZIP entry.');
            }

            const nameLength = archive.readUInt16LE(localHeaderOffset + 26);
            const extraLength = archive.readUInt16LE(localHeaderOffset + 28);
            const dataStart = localHeaderOffset + 30 + nameLength + extraLength;
            const compressed = archive.subarray(
                dataStart,
                dataStart + entry.compressedSize
            );
            let data: Uint8Array;

            if (entry.compressionMethod === 0) {
                data = compressed;
            } else if (entry.compressionMethod === 8) {
                data = inflateRawSync(compressed);
            } else {
                throw new Error(
                    `Unsupported ZIP compression method ${entry.compressionMethod}.`
                );
            }

            return [entry.name, data] as const;
        })
    );
};

const readLengthPrefixedChunk = (data: Buffer, offset: number) => {
    if (offset + 4 > data.length) {
        throw new Error('Figma canvas is missing a data chunk.');
    }

    const length = data.readUInt32LE(offset);
    const start = offset + 4;
    const end = start + length;

    if (end > data.length) {
        throw new Error('Figma canvas contains a truncated data chunk.');
    }

    return {
        data: data.subarray(start, end),
        nextOffset: end
    };
};

const inflateSchema = (data: Uint8Array) => {
    try {
        return inflateRawSync(data);
    } catch {
        return inflateSync(data);
    }
};

const isZstdData = (data: Uint8Array) =>
    ZSTD_MAGIC.every((value, index) => data[index] === value);

const decodeCanvasMessage = (canvasData: Uint8Array): FigmaDecodedMessage => {
    const canvas = Buffer.from(canvasData);

    if (
        canvas.length < 20 ||
        canvas.subarray(0, FIG_KIWI_MAGIC.length).toString('ascii') !==
            FIG_KIWI_MAGIC
    ) {
        throw new Error('Figma canvas uses an unsupported format.');
    }

    const schemaChunk = readLengthPrefixedChunk(canvas, 12);
    const messageChunk = readLengthPrefixedChunk(
        canvas,
        schemaChunk.nextOffset
    );
    const schema = decodeBinarySchema(inflateSchema(schemaChunk.data));
    const runtime = compileSchema(schema) as {
        decodeMessage?: (data: Uint8Array) => unknown;
    };

    if (!runtime.decodeMessage) {
        throw new Error('Figma canvas has no readable message schema.');
    }

    const messageBytes = isZstdData(messageChunk.data)
        ? decompress(messageChunk.data)
        : messageChunk.data;
    const decoded = runtime.decodeMessage(messageBytes);

    if (!isRecord(decoded) || !Array.isArray(decoded.nodeChanges)) {
        throw new Error('Figma canvas contains no node changes.');
    }

    return {
        nodeChanges: decoded.nodeChanges.filter(isRecord) as FigmaNodeChange[]
    };
};

export const readFigmaArchive = async (filePath: string) => {
    const archive = await readFile(filePath);
    const entries = readZipEntries(archive);
    const canvas = entries.get('canvas.fig');

    if (!canvas) {
        throw new Error('Figma archive contains no canvas.fig file.');
    }

    const images = new Map<string, Uint8Array>();

    for (const [name, data] of entries) {
        if (name.startsWith('images/') && name.length > 'images/'.length) {
            images.set(name.slice('images/'.length), data);
        }
    }

    return {
        images,
        message: decodeCanvasMessage(canvas)
    };
};
