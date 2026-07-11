/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { MiaomaDesignDocument } from '@miaoma-design-ai/miaoma-design-schema';

export const MIAOMA_PROJECT_FILE_EXTENSION = '.miaomadesign';
export const MIAOMA_PROJECT_FORMAT_VERSION = 1;
export const MIAOMA_PROJECTS_DIRECTORY_NAME = 'projects';
export const MIAOMA_PROJECT_IPC_CHANNELS = {
    list: 'miaoma:projects:list',
    create: 'miaoma:projects:create',
    importFile: 'miaoma:projects:import-file',
    get: 'miaoma:projects:get',
    open: 'miaoma:projects:open',
    update: 'miaoma:projects:update',
    delete: 'miaoma:projects:delete'
} as const;

export const MIAOMA_PROJECT_IMPORT_KINDS = ['json', 'pencil', 'figma'] as const;

export type MiaomaProjectImportKind =
    (typeof MIAOMA_PROJECT_IMPORT_KINDS)[number];

export type MiaomaProjectFile = {
    formatVersion: typeof MIAOMA_PROJECT_FORMAT_VERSION;
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    document: MiaomaDesignDocument;
};

export type MiaomaProjectSummary = {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    document: MiaomaDesignDocument;
};

export type MiaomaProjectCreateInput = {
    title?: string;
    document?: MiaomaDesignDocument;
};

export type MiaomaProjectUpdateInput = {
    title?: string;
    document?: MiaomaDesignDocument;
};

export type MiaomaProjectResult<T> =
    | {
          success: true;
          project: T;
      }
    | {
          success: false;
          error: string;
      };

export type MiaomaProjectListResult =
    | {
          success: true;
          projects: MiaomaProjectSummary[];
      }
    | {
          success: false;
          error: string;
      };

export type MiaomaProjectDeleteResult =
    | {
          success: true;
      }
    | {
          success: false;
          error: string;
      };

export type MiaomaProjectImportResult =
    | {
          success: true;
          project: MiaomaProjectSummary;
      }
    | {
          success: false;
          canceled: true;
      }
    | {
          success: false;
          canceled?: false;
          error: string;
      };

export const isSafeMiaomaProjectId = (projectId: string) =>
    /^[A-Za-z0-9_-]+$/.test(projectId);

export const isMiaomaProjectImportKind = (
    value: string
): value is MiaomaProjectImportKind =>
    MIAOMA_PROJECT_IMPORT_KINDS.includes(value as MiaomaProjectImportKind);
