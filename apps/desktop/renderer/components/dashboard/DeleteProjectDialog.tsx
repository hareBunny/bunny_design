/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

type DeleteProjectDialogProps = {
    open: boolean;
    projectTitle: string;
    onCancel: () => void;
    onConfirm: () => void;
};

export const DeleteProjectDialog = ({
    open,
    projectTitle,
    onCancel,
    onConfirm
}: DeleteProjectDialogProps) => {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090bcc] px-4 py-6 [-webkit-app-region:no-drag]"
            onClick={onCancel}
        >
            <div
                aria-label="Delete project"
                aria-modal="true"
                className="w-full max-w-[420px] rounded-xl border border-[#e4e4e7] bg-white p-6 text-left shadow-[0_24px_64px_#09090b33]"
                onClick={(event) => {
                    event.stopPropagation();
                }}
                role="dialog"
            >
                <div className="space-y-2">
                    <h2 className="m-0 text-[18px] leading-6 font-semibold text-[#18181b]">
                        Delete project
                    </h2>
                    <p className="m-0 text-[14px] leading-6 text-[#52525b]">
                        This will permanently remove this local project.
                    </p>
                    <p className="m-0 text-[14px] leading-6 font-medium text-[#18181b]">
                        {projectTitle}
                    </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        className="inline-flex h-8 min-w-[72px] cursor-default items-center justify-center rounded-xl border border-[#d4d4d8] bg-white px-3 text-[12px] font-medium text-[#18181b] shadow-[0_1px_2px_#09090b0d]"
                        onClick={onCancel}
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        className="inline-flex h-8 min-w-[72px] cursor-default items-center justify-center rounded-xl bg-[#18181b] px-3 text-[12px] font-medium text-white shadow-[0_10px_30px_#18181b26]"
                        onClick={onConfirm}
                        type="button"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};
