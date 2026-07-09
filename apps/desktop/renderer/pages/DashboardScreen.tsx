/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { FolderOpen, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type {
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

export const DashboardScreen = () => {
    const [projects, setProjects] = useState<MiaomaProjectSummary[]>([]);
    const [status, setStatus] = useState<DashboardStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<
        string | null
    >(null);

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

        const loadProjects = async () => {
            setStatus('loading');
            setErrorMessage(null);

            try {
                const result =
                    (await window.miaomaAPI.projects.list()) ??
                    EMPTY_PROJECTS_RESULT;

                if (!isMounted) {
                    return;
                }

                if (!result.success) {
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

        void loadProjects();

        return () => {
            isMounted = false;
        };
    }, []);

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

    const handleCreateProject = () => {
        void window.miaomaAPI.projects
            .create()
            .then((result) => {
                if (!result.success) {
                    setStatus('error');
                    setErrorMessage(result.error);
                    return;
                }

                setProjects((currentProjects) => [
                    result.project,
                    ...currentProjects.filter(
                        (project) => project.id !== result.project.id
                    )
                ]);
                setStatus('ready');
                setErrorMessage(null);
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

    const handleConfirmDelete = () => {
        if (!pendingDeleteProject) {
            return;
        }

        void window.miaomaAPI.projects
            .delete(pendingDeleteProject.id)
            .then((result) => {
                if (!result.success) {
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
                    className="relative mb-4 min-h-[84px] [-webkit-app-region:drag]"
                    role="banner"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-2 flex flex-col items-center text-center">
                        <div className="flex items-center justify-center gap-2">
                            <img
                                alt="Miaoma logo"
                                className="h-6 w-6 shrink-0"
                                height={24}
                                src={logoUrl}
                                width={24}
                            />
                            <h1 className="m-0 text-[24px] leading-8 font-semibold">
                                妙笔AI - Dashboard
                            </h1>
                        </div>
                        <p className="m-0 mt-1 text-[13px] leading-5 text-[#6b7280]">
                            Local `.miaomadesign` files stored in this device
                        </p>
                    </div>
                    <div className="absolute top-[10px] right-0 left-0 flex items-start justify-between gap-4">
                        <div
                            aria-hidden="true"
                            className="h-10 w-[var(--editor-system-traffic-light-space)] shrink-0"
                        />
                        <button
                            className="relative z-10 inline-flex h-8 shrink-0 cursor-default items-center gap-1.5 rounded-xl bg-[#111827] px-3 text-[12px] font-medium text-white shadow-[0_10px_22px_#11182724] [-webkit-app-region:no-drag]"
                            onClick={handleCreateProject}
                            type="button"
                        >
                            <Plus
                                aria-hidden="true"
                                size={14}
                                strokeWidth={2}
                            />
                            <span>New Project</span>
                        </button>
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

                                    if (!result.success) {
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
