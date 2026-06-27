/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    type Dispatch,
    type RefObject,
    type SetStateAction,
    useCallback,
    useEffect,
    useRef
} from 'react';

import type { CanvasViewportState } from './types';
import { setViewportZoomFromScrollPosition } from './viewportState';

const SHORTCUT_WHEEL_SCROLL_LOCK_MS = 120;

type ShortcutWheelScrollLock = {
    expiresAt: number;
    scrollLeft: number;
    scrollTop: number;
};

type UseShortcutWheelZoomOptions = {
    scrollRef: RefObject<HTMLDivElement | null>;
    setState: Dispatch<SetStateAction<CanvasViewportState>>;
};

export const useShortcutWheelZoom = ({
    scrollRef,
    setState
}: UseShortcutWheelZoomOptions) => {
    const scrollLockRef = useRef<ShortcutWheelScrollLock | null>(null);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) {
            return;
        }

        const handleShortcutWheel = (event: WheelEvent) => {
            if (!event.metaKey && !event.ctrlKey) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const rect = element.getBoundingClientRect();
            const delta = event.deltaY < 0 ? 1.1 : 0.9;
            const scrollPosition = {
                x: element.scrollLeft,
                y: element.scrollTop
            };

            scrollLockRef.current = {
                expiresAt: performance.now() + SHORTCUT_WHEEL_SCROLL_LOCK_MS,
                scrollLeft: scrollPosition.x,
                scrollTop: scrollPosition.y
            };

            setState((previous) =>
                setViewportZoomFromScrollPosition(
                    previous,
                    previous.zoom * delta,
                    {
                        x: event.clientX - rect.left,
                        y: event.clientY - rect.top
                    },
                    scrollPosition
                )
            );
        };

        element.addEventListener('wheel', handleShortcutWheel, {
            passive: false
        });

        return () => {
            element.removeEventListener('wheel', handleShortcutWheel);
        };
    }, [scrollRef, setState]);

    return useCallback((element: HTMLDivElement) => {
        const scrollLock = scrollLockRef.current;

        if (scrollLock && performance.now() <= scrollLock.expiresAt) {
            scrollLockRef.current = null;
            element.scrollLeft = scrollLock.scrollLeft;
            element.scrollTop = scrollLock.scrollTop;
            return true;
        }

        if (scrollLock) {
            scrollLockRef.current = null;
        }

        return false;
    }, []);
};
