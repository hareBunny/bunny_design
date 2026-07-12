/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

export type MiaomaVariableReference = `$${string}`;

export type MiaomaDesignVariable =
    | {
          type: 'color';
          value: string;
      }
    | {
          type: 'string';
          value: string;
      }
    | {
          type: 'number';
          value: number;
      };

export type MiaomaDesignVariables = Record<string, MiaomaDesignVariable>;

export const isMiaomaVariableReference = (
    value: unknown
): value is MiaomaVariableReference =>
    typeof value === 'string' && value.startsWith('$') && value.length > 1;
