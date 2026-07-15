/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { app, BrowserWindow, dialog, ipcMain, nativeTheme } from 'electron';
import started from 'electron-squirrel-startup';
import path from 'node:path';

import { MIAOMA_GENERATION_HISTORY_DIRECTORY_NAME } from '@miaoma-design-ai/miaoma-agent-history';

import { MIAOMA_GENERATION_IPC_CHANNELS } from '../shared/generation';
import {
    isMiaomaProjectImportKind,
    MIAOMA_PROJECT_IPC_CHANNELS,
    MIAOMA_PROJECTS_DIRECTORY_NAME,
    type MiaomaProjectCreateInput,
    type MiaomaProjectDeleteResult,
    type MiaomaProjectImportKind,
    type MiaomaProjectImportResult,
    type MiaomaProjectListResult,
    type MiaomaProjectResult,
    type MiaomaProjectSummary,
    type MiaomaProjectUpdateInput
} from '../shared/projects';

import { createMiaomaDesktopGenerationRuntime } from './generation/generationRuntime';
import {
    getProjectImportDialogOptions,
    readProjectImportDocument
} from './projects/importProjectDocument';
import { createProjectStore, type ProjectStore } from './projects/projectStore';

if (started) {
    app.quit();
}

nativeTheme.themeSource = 'light';

const editorWindowProjects = new Map<number, string>();
const WINDOW_CASCADE_OFFSET = 24;
let editorWindowOpenCount = 0;

type RendererRoute =
    | {
          hash: '/';
      }
    | {
          hash: string;
      };

const getPreloadPath = () => path.join(__dirname, 'preload.js');

const getRendererPath = () =>
    path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);

const loadRendererRoute = (window: BrowserWindow, route: RendererRoute) => {
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        window.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#${route.hash}`);
        return;
    }

    window.loadFile(getRendererPath(), {
        hash: route.hash
    });
};

const createDashboardWindow = () => {
    const dashboardWindow = new BrowserWindow({
        width: 1120,
        height: 760,
        minWidth: 960,
        minHeight: 640,
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: getPreloadPath()
        },
        trafficLightPosition: {
            x: 20,
            y: 16
        },
        vibrancy: 'sidebar',
        visualEffectState: 'active',
        transparent: true
    });

    loadRendererRoute(dashboardWindow, { hash: '/' });

    return dashboardWindow;
};

const loadEditorProject = (editorWindow: BrowserWindow, projectId: string) => {
    const editorHash = `/editor?projectId=${encodeURIComponent(projectId)}`;

    editorWindowProjects.set(editorWindow.id, projectId);
    loadRendererRoute(editorWindow, { hash: editorHash });
    editorWindow.focus();
};

const createEditorWindow = (
    projectId: string,
    dashboardWindow: BrowserWindow | null
) => {
    const dashboardBounds = dashboardWindow?.getBounds();
    const cascadeOffset = (editorWindowOpenCount % 8) * WINDOW_CASCADE_OFFSET;
    const editorWindow = new BrowserWindow({
        width: dashboardBounds?.width ?? 1280,
        height: dashboardBounds?.height ?? 800,
        minWidth: 1280,
        minHeight: 800,
        x:
            dashboardBounds?.x === undefined
                ? undefined
                : dashboardBounds.x + cascadeOffset,
        y:
            dashboardBounds?.y === undefined
                ? undefined
                : dashboardBounds.y + cascadeOffset,
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        backgroundColor: '#00000000',
        webPreferences: {
            preload: getPreloadPath()
        },
        trafficLightPosition: {
            x: 20,
            y: 16
        },
        vibrancy: 'sidebar',
        visualEffectState: 'active',
        transparent: true
    });

    editorWindowOpenCount += 1;
    editorWindow.on('closed', () => {
        editorWindowProjects.delete(editorWindow.id);
    });

    loadEditorProject(editorWindow, projectId);

    return editorWindow;
};

const toProjectResult = (
    project: MiaomaProjectSummary | null
): MiaomaProjectResult<MiaomaProjectSummary> =>
    project === null
        ? {
              success: false,
              error: 'Project not found.'
          }
        : {
              success: true,
              project
          };

const showImportDialog = async (
    parentWindow: BrowserWindow | null,
    kind: MiaomaProjectImportKind
) => {
    const options = getProjectImportDialogOptions(kind);

    if (parentWindow) {
        return dialog.showOpenDialog(parentWindow, options);
    }

    return dialog.showOpenDialog(options);
};

const registerProjectIpcHandlers = (projectStore: ProjectStore) => {
    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.list,
        async (): Promise<MiaomaProjectListResult> => {
            try {
                return {
                    success: true,
                    projects: await projectStore.listProjects()
                };
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to list projects.'
                };
            }
        }
    );

    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.create,
        async (
            event,
            input?: MiaomaProjectCreateInput
        ): Promise<MiaomaProjectResult<MiaomaProjectSummary>> => {
            try {
                const project = await projectStore.createProject(input);
                const dashboardWindow = BrowserWindow.fromWebContents(
                    event.sender
                );

                createEditorWindow(project.id, dashboardWindow);

                return {
                    success: true,
                    project
                };
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to create project.'
                };
            }
        }
    );

    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.importFile,
        async (event, kind: string): Promise<MiaomaProjectImportResult> => {
            try {
                if (!isMiaomaProjectImportKind(kind)) {
                    return {
                        success: false,
                        error: 'Unsupported import type.'
                    };
                }

                const dashboardWindow = BrowserWindow.fromWebContents(
                    event.sender
                );
                const dialogResult = await showImportDialog(
                    dashboardWindow,
                    kind
                );
                const filePath = dialogResult.filePaths[0];

                if (dialogResult.canceled || filePath === undefined) {
                    return {
                        success: false,
                        canceled: true
                    };
                }

                const document = await readProjectImportDocument(filePath);
                const project = await projectStore.createProject({
                    document
                });

                createEditorWindow(project.id, dashboardWindow);

                return {
                    success: true,
                    project
                };
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to import project.'
                };
            }
        }
    );

    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.get,
        async (
            _event,
            projectId: string
        ): Promise<MiaomaProjectResult<MiaomaProjectSummary>> =>
            toProjectResult(await projectStore.getProject(projectId))
    );

    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.open,
        async (
            event,
            projectId: string
        ): Promise<MiaomaProjectResult<MiaomaProjectSummary>> => {
            const project = await projectStore.getProject(projectId);

            if (project) {
                const dashboardWindow = BrowserWindow.fromWebContents(
                    event.sender
                );

                createEditorWindow(project.id, dashboardWindow);
            }

            return toProjectResult(project);
        }
    );

    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.update,
        async (
            _event,
            projectId: string,
            input: MiaomaProjectUpdateInput
        ): Promise<MiaomaProjectResult<MiaomaProjectSummary>> => {
            try {
                return toProjectResult(
                    await projectStore.updateProject(projectId, input ?? {})
                );
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to update project.'
                };
            }
        }
    );

    ipcMain.handle(
        MIAOMA_PROJECT_IPC_CHANNELS.delete,
        async (
            _event,
            projectId: string
        ): Promise<MiaomaProjectDeleteResult> => {
            try {
                const deleted = await projectStore.deleteProject(projectId);

                if (!deleted) {
                    return {
                        success: false,
                        error: 'Project not found.'
                    };
                }

                for (const [windowId, openProjectId] of editorWindowProjects) {
                    if (openProjectId !== projectId) {
                        continue;
                    }

                    const editorWindow = BrowserWindow.fromId(windowId);

                    editorWindow?.close();
                    editorWindowProjects.delete(windowId);
                }

                return {
                    success: true
                };
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to delete project.'
                };
            }
        }
    );
};

const registerGenerationIpcHandlers = (
    generation: ReturnType<typeof createMiaomaDesktopGenerationRuntime>
) => {
    ipcMain.handle(MIAOMA_GENERATION_IPC_CHANNELS.start, async (event, input) =>
        generation.start(event.sender, input)
    );
    ipcMain.handle(
        MIAOMA_GENERATION_IPC_CHANNELS.cancel,
        async (_event, runId: string) => generation.cancel(runId)
    );
};

app.whenReady().then(() => {
    const projectStore = createProjectStore({
        projectsDirectory: path.join(
            app.getPath('userData'),
            MIAOMA_PROJECTS_DIRECTORY_NAME
        )
    });

    registerProjectIpcHandlers(projectStore);
    registerGenerationIpcHandlers(
        createMiaomaDesktopGenerationRuntime({
            projectStore,
            historyRoot: path.join(
                app.getPath('userData'),
                MIAOMA_GENERATION_HISTORY_DIRECTORY_NAME
            ),
            screenshotRoot: path.join(
                app.getPath('temp'),
                'miaoma-design-ai',
                'generation-screenshots'
            ),
            workingDirectory: app.getPath('userData')
        })
    );
    createDashboardWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDashboardWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
