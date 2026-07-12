/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

import {
    getProjectImportDialogOptions,
    readProjectImportDocument
} from '../client/projects/importProjectDocument';
import type { MiaomaProjectImportKind } from '../shared/projects';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));

const createTempDirectory = async () =>
    mkdtemp(path.join(os.tmpdir(), 'miaoma-import-'));

const cleanupTempDirectory = async (directory: string) => {
    await rm(directory, { force: true, recursive: true });
};

const createDesignDocument = (): MiaomaDesignDocument => ({
    version: '2.14',
    children: [
        {
            id: 'import-frame',
            type: 'frame',
            name: 'Imported Design',
            x: 0,
            y: 0,
            width: 595,
            height: 842,
            fill: { type: 'color', color: '#ffffffff' },
            children: []
        }
    ]
});

const findNodeByName = (
    nodes: unknown[],
    name: string
): Record<string, unknown> | undefined => {
    for (const node of nodes) {
        if (!node || typeof node !== 'object' || Array.isArray(node)) {
            continue;
        }

        const record = node as Record<string, unknown>;

        if (record.name === name) {
            return record;
        }

        if (Array.isArray(record.children)) {
            const match = findNodeByName(record.children, name);

            if (match) {
                return match;
            }
        }
    }

    return undefined;
};

describe('project import documents', () => {
    it.each([
        ['json', 'json'],
        ['pencil', 'pen']
    ] as const)(
        'reads a %s file as a Miaoma design JSON document',
        async (_kind, extension) => {
            const directory = await createTempDirectory();

            try {
                const filePath = path.join(directory, `design.${extension}`);

                await writeFile(
                    filePath,
                    JSON.stringify(createDesignDocument()),
                    'utf8'
                );

                const document = await readProjectImportDocument(filePath);

                expect(document.version).toBe('2.14');
                expect(document.children[0]).toMatchObject({
                    id: 'import-frame',
                    name: 'Imported Design',
                    width: 595
                });
            } finally {
                await cleanupTempDirectory(directory);
            }
        }
    );

    it('rejects invalid JSON import files', async () => {
        const directory = await createTempDirectory();

        try {
            const filePath = path.join(directory, 'broken.json');

            await writeFile(filePath, '{', 'utf8');

            await expect(readProjectImportDocument(filePath)).rejects.toThrow(
                'Selected file is not valid JSON.'
            );
        } finally {
            await cleanupTempDirectory(directory);
        }
    });

    it('rejects JSON files that are not Miaoma design documents', async () => {
        const directory = await createTempDirectory();

        try {
            const filePath = path.join(directory, 'notes.json');

            await writeFile(
                filePath,
                JSON.stringify({ hello: 'world' }),
                'utf8'
            );

            await expect(readProjectImportDocument(filePath)).rejects.toThrow(
                'Selected file is not a valid Miaoma design document.'
            );
        } finally {
            await cleanupTempDirectory(directory);
        }
    });

    it('uses focused file dialog filters for each import kind', () => {
        const expectations: Record<MiaomaProjectImportKind, string[]> = {
            json: ['json'],
            pencil: ['pen'],
            figma: ['fig']
        };

        for (const [kind, extensions] of Object.entries(expectations) as [
            MiaomaProjectImportKind,
            string[]
        ][]) {
            expect(getProjectImportDialogOptions(kind)).toMatchObject({
                properties: ['openFile'],
                filters: [
                    {
                        extensions
                    }
                ]
            });
        }
    });

    it('can import the root sample JSON files used by the current project', async () => {
        const rootSamples = [
            path.resolve(testDirectory, '../../../miaoma-design-schema.json'),
            path.resolve(
                testDirectory,
                '../../../miaoma-design-design-schema.json'
            )
        ];

        for (const samplePath of rootSamples) {
            const document = await readProjectImportDocument(samplePath);
            const raw = JSON.parse(await readFile(samplePath, 'utf8')) as {
                children?: unknown[];
            };

            expect(document.children).toHaveLength(raw.children?.length ?? 0);
            expect(document.version).toBe('2.14');
        }
    });

    it.each([
        'miaoma-design-green-website-schema.json',
        'miaoma-design-green-website-schema.pen',
        'miaoma-design-magicut.pen'
    ])(
        'can import root design documents with string color tokens: %s',
        async (fileName) => {
            const document = await readProjectImportDocument(
                path.resolve(testDirectory, '../../../', fileName)
            );

            expect(document.version).toBe('2.14');
            expect(document.children.length).toBeGreaterThan(0);
            expect(document.variables).toBeDefined();
            expect(document.children[0]?.fill).toEqual(
                expect.arrayContaining([expect.stringMatching(/^\$/)])
            );
        }
    );

    it('preserves multiple style array items when importing magicut pen files', async () => {
        const document = await readProjectImportDocument(
            path.resolve(testDirectory, '../../../miaoma-design-magicut.pen')
        );
        const node = findNodeByName(document.children, '悬浮胶囊主导航');

        expect(node).toBeDefined();
        expect(node?.fill).toHaveLength(3);
        expect(node?.fill).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'gradient',
                    gradientType: 'radial'
                })
            ])
        );
        expect(node?.effect).toHaveLength(3);
        expect(node?.effect).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'shadow',
                    shadowType: 'outer'
                })
            ])
        );
    });

    it('imports the course intro Figma file as a Miaoma design document', async () => {
        const document = await readProjectImportDocument(
            path.resolve(
                testDirectory,
                '../../../miaoma-design-course-intro.fig'
            )
        );

        expect(document.version).toBe('2.14');
        expect(document.children).toHaveLength(5);
        expect(document.children.map((node) => node.name)).toEqual(
            expect.arrayContaining([
                '01-cover',
                '02-intro',
                '03-service',
                '04-updates',
                '05-projects'
            ])
        );
        expect(findNodeByName(document.children, '核心技术')).toMatchObject({
            type: 'text',
            content: '核心技术 '
        });
    });

    it('uses a .fig file filter for Figma imports', () => {
        expect(getProjectImportDialogOptions('figma')).toMatchObject({
            title: 'Import Figma',
            properties: ['openFile'],
            filters: [
                {
                    extensions: ['fig']
                }
            ]
        });
    });
});
