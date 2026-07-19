/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import {
    MIAOMA_GENERATION_IPC_CHANNELS,
    type MiaomaGenerationEvent,
    type MiaomaGenerationStartInput
} from '../shared/generation';
import {
    MIAOMA_PROJECT_IPC_CHANNELS,
    type MiaomaProjectCreateInput,
    type MiaomaProjectImportKind,
    type MiaomaProjectUpdateInput
} from '../shared/projects';

contextBridge.exposeInMainWorld('miaomaAPI', {
    ping: async () => ({ success: true }),
    projects: {
        list: () => ipcRenderer.invoke(MIAOMA_PROJECT_IPC_CHANNELS.list),
        create: (input?: MiaomaProjectCreateInput) =>
            ipcRenderer.invoke(MIAOMA_PROJECT_IPC_CHANNELS.create, input),
        importFromFile: (kind: MiaomaProjectImportKind) =>
            ipcRenderer.invoke(MIAOMA_PROJECT_IPC_CHANNELS.importFile, kind),
        get: (projectId: string) =>
            ipcRenderer.invoke(MIAOMA_PROJECT_IPC_CHANNELS.get, projectId),
        open: (projectId: string) =>
            ipcRenderer.invoke(MIAOMA_PROJECT_IPC_CHANNELS.open, projectId),
        update: (projectId: string, input: MiaomaProjectUpdateInput) =>
            ipcRenderer.invoke(
                MIAOMA_PROJECT_IPC_CHANNELS.update,
                projectId,
                input
            ),
        delete: (projectId: string) =>
            ipcRenderer.invoke(MIAOMA_PROJECT_IPC_CHANNELS.delete, projectId)
    },
    generation: {
        start: (input: MiaomaGenerationStartInput) =>
            ipcRenderer.invoke(MIAOMA_GENERATION_IPC_CHANNELS.start, input),
        cancel: (runId: string) =>
            ipcRenderer.invoke(MIAOMA_GENERATION_IPC_CHANNELS.cancel, runId),
        getLatestRun: (projectId: string) =>
            ipcRenderer.invoke(
                MIAOMA_GENERATION_IPC_CHANNELS.latestRun,
                projectId
            ),
        subscribe: (listener: (event: MiaomaGenerationEvent) => void) => {
            const handleEvent = (
                _event: IpcRendererEvent,
                value: MiaomaGenerationEvent
            ) => listener(value);
            ipcRenderer.on(MIAOMA_GENERATION_IPC_CHANNELS.event, handleEvent);

            return () => {
                ipcRenderer.removeListener(
                    MIAOMA_GENERATION_IPC_CHANNELS.event,
                    handleEvent
                );
            };
        }
    }
});
