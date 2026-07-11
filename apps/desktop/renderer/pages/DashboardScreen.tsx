/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import type { LucideIcon } from 'lucide-react';
import {
    ChevronDown,
    FileJson,
    FolderOpen,
    Import,
    PanelsTopLeft,
    PenLine,
    Plus
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
    MiaomaProjectImportKind,
    MiaomaProjectListResult,
    MiaomaProjectSummary
} from '../../shared/projects';
import logoUrl from '../assets/brand/favicon@152.png';
import { DeleteProjectDialog } from '../components/dashboard/DeleteProjectDialog';
import { ProjectCard } from '../components/dashboard/ProjectCard';

type DashboardStatus = 'idle' | 'loading' | 'ready' | 'error';

const EMPTY_PROJECTS_RESULT: MiaomaProjectListResult = {
    success: true,
    projects: []
};

const IMPORT_ACTIONS: {
    kind: MiaomaProjectImportKind;
    label: string;
    Icon: LucideIcon;
}[] = [
    {
        kind: 'json',
        label: 'Import JSON',
        Icon: FileJson
    },
    {
        kind: 'pencil',
        label: 'Import Pencil (.pen)',
        Icon: PenLine
    },
    {
        kind: 'figma',
        label: 'Import Figma (.fig)',
        Icon: PanelsTopLeft
    }
];

export const DashboardScreen = () => {
    const [projects, setProjects] = useState<MiaomaProjectSummary[]>([]);
    const [status, setStatus] = useState<DashboardStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
    const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<
        string | null
    >(null);
    const importMenuRef = useRef<HTMLDivElement | null>(null);

    const hasProjects = projects.length > 0;
    const isEmpty = status === 'ready' && !hasProjects;
    const pendingDeleteProject =
        pendingDeleteProjectId === null
            ? null
            : (projects.find(
                  (project) => project.id === pendingDeleteProjectId
              ) ?? null);

    useEffect(() => {
        let isMounted = true;

        const loadProjects = async ({ showLoading = false } = {}) => {
            if (showLoading) {
                setStatus('loading');
            }
            setErrorMessage(null);

            try {
                const result =
                    (await window.miaomaAPI.projects.list()) ??
                    EMPTY_PROJECTS_RESULT;

                if (!isMounted) {
                    return;
                }

                if (result.success === false) {
                    setProjects([]);
                    setStatus('error');
                    setErrorMessage(result.error);
                    return;
                }

                setProjects(result.projects);
                setStatus('ready');
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setProjects([]);
                setStatus('error');
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Unable to load projects.'
                );
            }
        };
        const refreshProjects = () => {
            void loadProjects();
        };
        const refreshProjectsWhenVisible = () => {
            if (document.visibilityState === 'visible') {
                refreshProjects();
            }
        };

        void loadProjects({ showLoading: true });
        window.addEventListener('focus', refreshProjects);
        document.addEventListener(
            'visibilitychange',
            refreshProjectsWhenVisible
        );

        return () => {
            isMounted = false;
            window.removeEventListener('focus', refreshProjects);
            document.removeEventListener(
                'visibilitychange',
                refreshProjectsWhenVisible
            );
        };
    }, []);

    useEffect(() => {
        if (!isImportMenuOpen) {
            return undefined;
        }

        const closeOnOutsidePointer = (event: PointerEvent) => {
            if (
                event.target instanceof Node &&
                importMenuRef.current?.contains(event.target)
            ) {
                return;
            }

            setIsImportMenuOpen(false);
        };
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsImportMenuOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeOnOutsidePointer);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeOnOutsidePointer);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isImportMenuOpen]);

    const headingCopy = useMemo(() => {
        if (status === 'loading') {
            return 'Loading local projects...';
        }

        if (status === 'error') {
            return errorMessage ?? 'Unable to load projects.';
        }

        if (isEmpty) {
            return 'No local projects yet';
        }

        return null;
    }, [errorMessage, isEmpty, status]);

    const addProjectToDashboard = (project: MiaomaProjectSummary) => {
        setProjects((currentProjects) => [
            project,
            ...currentProjects.filter(
                (currentProject) => currentProject.id !== project.id
            )
        ]);
        setStatus('ready');
        setErrorMessage(null);
    };

    const handleCreateProject = () => {
        void window.miaomaAPI.projects
            .create()
            .then((result) => {
                if (result.success === false) {
                    setStatus('error');
                    setErrorMessage(result.error);
                    return;
                }

                addProjectToDashboard(result.project);
            })
            .catch((error: unknown) => {
                setStatus('error');
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Unable to create project.'
                );
            });
    };

    const handleImportProject = (kind: MiaomaProjectImportKind) => {
        setIsImportMenuOpen(false);
        void window.miaomaAPI.projects
            .importFromFile(kind)
            .then((result) => {
                if (result.success === false) {
                    if (result.canceled === true) {
                        return;
                    }

                    setStatus('error');
                    setErrorMessage(result.error);
                    return;
                }

                addProjectToDashboard(result.project);
            })
            .catch((error: unknown) => {
                setStatus('error');
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Unable to import project.'
                );
            });
    };

    const handleConfirmDelete = () => {
        if (!pendingDeleteProject) {
            return;
        }

        void window.miaomaAPI.projects
            .delete(pendingDeleteProject.id)
            .then((result) => {
                if (result.success === false) {
                    setStatus('error');
                    setErrorMessage(result.error);
                    return;
                }

                setProjects((currentProjects) =>
                    currentProjects.filter(
                        (project) => project.id !== pendingDeleteProject.id
                    )
                );
                setPendingDeleteProjectId(null);
                setStatus('ready');
                setErrorMessage(null);
            })
            .catch((error: unknown) => {
                setStatus('error');
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Unable to delete project.'
                );
            });
    };

    return (
        <main className="h-screen overflow-auto bg-[#f4f6f8] text-[#111827]">
            <div className="flex min-h-full w-full flex-col px-5 pt-0 pb-5">
                <header
                    className="relative mb-4 min-h-[56px] [-webkit-app-region:drag]"
                    role="banner"
                >
                    <div
                        className="pointer-events-none absolute top-[10px] [left:calc(var(--editor-system-traffic-light-space)+30px)] flex items-center gap-2"
                        data-dashboard-brand="true"
                    >
                        <img
                            alt="Miaoma logo"
                            className="h-5 w-5 shrink-0"
                            height={20}
                            src={logoUrl}
                            width={20}
                        />
                        <h1 className="m-0 text-[15px] leading-6 font-semibold">
                            妙笔AI - Dashboard
                        </h1>
                    </div>
                    <div className="absolute top-[10px] right-0 left-0 flex items-start justify-between gap-4">
                        <div
                            aria-hidden="true"
                            className="h-10 w-[var(--editor-system-traffic-light-space)] shrink-0"
                        />
                        <div className="relative z-10 flex items-center gap-2 [-webkit-app-region:no-drag]">
                            <button
                                className="inline-flex h-8 shrink-0 cursor-default items-center gap-1.5 rounded-xl bg-[#111827] px-3 text-[12px] font-medium text-white shadow-[0_10px_22px_#11182724]"
                                onClick={() => {
                                    handleCreateProject();
                                }}
                                type="button"
                            >
                                <Plus
                                    aria-hidden="true"
                                    size={14}
                                    strokeWidth={2}
                                />
                                <span>New Project</span>
                            </button>
                            <div className="relative" ref={importMenuRef}>
                                <button
                                    aria-expanded={isImportMenuOpen}
                                    aria-haspopup="menu"
                                    className="inline-flex h-8 shrink-0 cursor-default items-center gap-1.5 rounded-xl border border-[#d4d4d8] bg-white px-3 text-[12px] font-medium text-[#18181b] shadow-[0_1px_2px_#09090b0d]"
                                    onClick={() => {
                                        setIsImportMenuOpen(
                                            (isOpen) => !isOpen
                                        );
                                    }}
                                    type="button"
                                >
                                    <Import
                                        aria-hidden="true"
                                        size={14}
                                        strokeWidth={1.8}
                                    />
                                    <span>Import</span>
                                    <ChevronDown
                                        aria-hidden="true"
                                        size={13}
                                        strokeWidth={1.9}
                                    />
                                </button>
                                {isImportMenuOpen ? (
                                    <div
                                        className="absolute top-[calc(100%+6px)] right-0 z-20 w-52 overflow-hidden rounded-xl border border-[#e4e4e7] bg-white py-1 shadow-[0_18px_44px_#1118271a]"
                                        role="menu"
                                    >
                                        {IMPORT_ACTIONS.map(
                                            ({ kind, label, Icon }) => (
                                                <button
                                                    className="flex h-9 w-full cursor-default items-center gap-2 px-3 text-left text-[12px] font-medium text-[#27272a] hover:bg-[#f4f4f5]"
                                                    key={kind}
                                                    onClick={() => {
                                                        handleImportProject(
                                                            kind
                                                        );
                                                    }}
                                                    role="menuitem"
                                                    type="button"
                                                >
                                                    <Icon
                                                        aria-hidden="true"
                                                        className="text-[#71717a]"
                                                        size={14}
                                                        strokeWidth={1.8}
                                                    />
                                                    <span>{label}</span>
                                                </button>
                                            )
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </header>

                {headingCopy ? (
                    <section className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[#d6dae1] bg-white/60 px-6 py-12">
                        <div className="flex max-w-[420px] flex-col items-center text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef2f7] text-[#6b7280]">
                                <FolderOpen
                                    aria-hidden="true"
                                    size={20}
                                    strokeWidth={1.9}
                                />
                            </div>
                            <p className="m-0 text-[16px] leading-6 font-medium text-[#111827]">
                                {headingCopy}
                            </p>
                        </div>
                    </section>
                ) : (
                    <section className="grid grid-cols-2 gap-5 min-[1000px]:grid-cols-3 min-[1400px]:grid-cols-4">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                onDelete={(projectId) => {
                                    setPendingDeleteProjectId(projectId);
                                }}
                                onOpen={async (projectId) => {
                                    const result =
                                        await window.miaomaAPI.projects.open(
                                            projectId
                                        );

                                    if (result.success === false) {
                                        setStatus('error');
                                        setErrorMessage(result.error);
                                    }
                                }}
                                project={project}
                            />
                        ))}
                    </section>
                )}
            </div>
            <DeleteProjectDialog
                onCancel={() => {
                    setPendingDeleteProjectId(null);
                }}
                onConfirm={handleConfirmDelete}
                open={pendingDeleteProject !== null}
                projectTitle={pendingDeleteProject?.title ?? ''}
            />
        </main>
    );
};
