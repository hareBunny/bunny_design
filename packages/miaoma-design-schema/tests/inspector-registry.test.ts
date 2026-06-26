/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { describe, expect, it } from 'vitest';

import {
    getNodeInspectorGroups,
    getNodeInspectorProperties,
    INSPECTOR_GROUPS
} from '../src';

describe('miaoma inspector registry', () => {
    it('keeps a stable inspector group order', () => {
        expect(INSPECTOR_GROUPS.map((group) => group.id)).toEqual([
            'context',
            'layout',
            'position',
            'appearance',
            'fill',
            'stroke',
            'effects',
            'text',
            'export'
        ]);
    });

    it('returns inspector groups ordered by explicit group.order', () => {
        const originalOrder = [...INSPECTOR_GROUPS];

        try {
            INSPECTOR_GROUPS.reverse();

            expect(
                getNodeInspectorGroups('frame').map((group) => group.id)
            ).toEqual([
                'layout',
                'position',
                'appearance',
                'fill',
                'stroke',
                'effects'
            ]);
        } finally {
            INSPECTOR_GROUPS.splice(
                0,
                INSPECTOR_GROUPS.length,
                ...originalOrder
            );
        }
    });

    it('maps frame fields back to standard schema paths', () => {
        const properties = getNodeInspectorProperties('frame');
        const propertyIds = properties.map((property) => property.id);

        expect(propertyIds).toEqual(
            expect.arrayContaining([
                'x',
                'y',
                'rotation',
                'width',
                'height',
                'fill',
                'stroke',
                'strokeWidth',
                'effect',
                'clip'
            ])
        );
        expect(propertyIds).not.toContain('opacity');
        expect(propertyIds).not.toContain('exportScale');
        expect(propertyIds).not.toContain('exportFormat');
        expect(
            properties.find((property) => property.id === 'x')
        ).toMatchObject({
            group: 'position',
            path: 'x',
            unit: 'px'
        });
        expect(
            properties.find((property) => property.id === 'strokeWidth')
        ).toMatchObject({
            group: 'stroke',
            path: 'strokeWidth'
        });
        expect(
            properties.find((property) => property.id === 'rotation')
        ).toMatchObject({
            label: 'R'
        });
        expect(
            properties.find((property) => property.id === 'width')
        ).toMatchObject({
            label: 'W'
        });
        expect(
            properties.find((property) => property.id === 'height')
        ).toMatchObject({
            label: 'H'
        });
        expect(
            properties.find((property) => property.id === 'cornerRadius')
        ).toMatchObject({
            label: 'Corner radius'
        });
    });

    it('maps text styling to the text inspector group', () => {
        const groups = getNodeInspectorGroups('text');
        const properties = getNodeInspectorProperties('text');

        expect(groups.map((group) => group.id)).toContain('text');
        expect(
            properties.find((property) => property.id === 'content')
        ).toMatchObject({
            group: 'text',
            path: 'content',
            valueKind: 'string'
        });
    });
});
