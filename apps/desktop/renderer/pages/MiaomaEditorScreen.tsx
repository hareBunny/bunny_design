/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { useEffect, useMemo, useState } from 'react';

import { schemaToEditorDocument } from '@miaoma-design-ai/miaoma-editor-core';

import type { MiaomaProjectSummary } from '../../shared/projects';
import { MiaomaEditor } from '../components/editor/MiaomaEditor';

const getProjectIdFromLocationHash = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    const [, search = ''] = window.location.hash.split('?');
    const projectId = new URLSearchParams(search).get('projectId');

    return projectId && projectId.length > 0 ? projectId : null;
};

export const MiaomaEditorScreen = () => {
    const projectId = useMemo(() => getProjectIdFromLocationHash(), []);
    const [project, setProject] = useState<MiaomaProjectSummary | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
        projectId ? 'loading' : 'ready'
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!projectId) {
            return;
        }

        let isMounted = true;

        const loadProject = async () => {
            try {
                const result = await window.miaomaAPI.projects.get(projectId);

                if (!isMounted) {
                    return;
                }

                if (!result.success) {
                    setStatus('error');
                    setErrorMessage(result.error);
                    return;
                }

                setProject(result.project);
                setStatus('ready');
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setStatus('error');
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : 'Unable to open project.'
                );
            }
        };

        void loadProject();

        return () => {
            isMounted = false;
        };
    }, [projectId]);

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f6f6] text-[14px] text-[#6b7280]">
                Loading project...
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f6f6f6] text-[14px] text-[#b42318]">
                {errorMessage ?? 'Unable to open project.'}
            </div>
        );
    }

    if (!project) {
        return <MiaomaEditor />;
    }

    return (
        <MiaomaEditor
            initialDocument={schemaToEditorDocument(project.document)}
            initialProjectTitle={project.title}
            projectId={project.id}
        />
    );
};
