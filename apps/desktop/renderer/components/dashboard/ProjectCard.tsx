/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';

import type { MiaomaProjectSummary } from '../../../shared/projects';
import { resolveCanvasAsset } from '../document/canvasAssets';
import { CanvasDocumentRenderer } from '../document/CanvasDocumentRenderer';
import { getTopLevelBounds } from '../document/CanvasNodeRenderers';

type ProjectCardProps = {
    project: MiaomaProjectSummary;
    onDelete?: (projectId: string) => void;
    onOpen?: (projectId: string) => void | Promise<void>;
};

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 188;

const formatEditedAt = (value: string) => {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');

    return `Edited ${year}-${month}-${day} ${hours}:${minutes}`;
};

export const ProjectCard = ({
    project,
    onDelete,
    onOpen
}: ProjectCardProps) => {
    const bounds = useMemo(
        () => getTopLevelBounds(project.document.children),
        [project.document.children]
    );
    const safeWidth = Math.max(bounds.width, 1);
    const safeHeight = Math.max(bounds.height, 1);
    const scale = Math.min(
        PREVIEW_WIDTH / safeWidth,
        PREVIEW_HEIGHT / safeHeight
    );

    return (
        <article className="group relative w-full [-webkit-app-region:no-drag]">
            <button
                aria-label={`Open ${project.title}`}
                className="flex w-full cursor-default flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white text-left shadow-[0_12px_32px_#1118270a] transition-colors hover:border-[#d1d5db]"
                onClick={() => {
                    void onOpen?.(project.id);
                }}
                type="button"
            >
                <div
                    className="relative h-[188px] overflow-hidden border-b border-[#eef0f2] bg-[#f5f7fa]"
                    data-dashboard-preview-viewport="true"
                >
                    <div
                        className="pointer-events-none absolute top-1/2 left-1/2 origin-center overflow-visible"
                        data-dashboard-preview-content="true"
                        style={{
                            width: `${safeWidth}px`,
                            height: `${safeHeight}px`,
                            transform: `translate(-50%, -50%) scale(${scale})`
                        }}
                    >
                        <CanvasDocumentRenderer
                            document={project.document}
                            renderSelectionOverlay={false}
                            resolveAsset={resolveCanvasAsset}
                        />
                    </div>
                </div>
                <div className="flex min-h-[84px] flex-col gap-1 px-4 py-3">
                    <p className="m-0 overflow-hidden text-[14px] leading-5 font-semibold text-[#111827]">
                        {project.title}
                    </p>
                    <p className="m-0 text-[12px] leading-5 text-[#6b7280]">
                        {formatEditedAt(project.updatedAt)}
                    </p>
                </div>
            </button>
            <button
                aria-label={`Delete ${project.title}`}
                className="absolute top-3 right-3 inline-flex h-9 w-9 cursor-default items-center justify-center rounded-lg border border-[#e4e4e7] bg-white/96 text-[#71717a] opacity-0 shadow-[0_12px_24px_#11182712] transition-opacity duration-150 group-hover:opacity-100 hover:text-[#18181b] focus:opacity-100"
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete?.(project.id);
                }}
                type="button"
            >
                <Trash2 aria-hidden="true" size={16} strokeWidth={1.9} />
            </button>
        </article>
    );
};
