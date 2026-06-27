/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { classNames } from '../../utils/classNames';

import { RightInspectorFormBridge } from './inspector/RightInspectorFormBridge';
import { TopHeader } from './TopHeader';

type RightInspectorProps = {
    bodyVisible?: boolean;
};

export const RightInspector = ({ bodyVisible = true }: RightInspectorProps) => (
    <aside
        className={classNames(
            'editor-inspector col-start-2 row-start-1 grid h-full min-w-0 overflow-hidden border-l border-[#eaeaea] text-[12px] text-[#262626] max-[980px]:hidden',
            bodyVisible
                ? 'row-span-2 grid-rows-[auto_minmax(0,1fr)] bg-white'
                : 'row-span-1 grid-rows-[auto] bg-[#f6f6f6]'
        )}
        data-inspector-body-visible={bodyVisible ? 'true' : 'false'}
        data-region="right-inspector"
    >
        <TopHeader muted={!bodyVisible} />
        {bodyVisible ? (
            <div
                className="editor-inspector-body min-h-0 overflow-y-auto overflow-x-hidden"
                data-region="right-inspector-body"
            >
                <RightInspectorFormBridge />
            </div>
        ) : null}
    </aside>
);
