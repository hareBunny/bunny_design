/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import faviconUrl from '../../assets/brand/favicon@152.png';
import coverImageUrl from '../../assets/dSqyy.png';

const canvasAssets: Record<string, string> = {
    'favicon%40167.png': faviconUrl,
    'image-import.png': coverImageUrl
};

export const resolveCanvasAsset = (url: string) => canvasAssets[url] ?? url;
