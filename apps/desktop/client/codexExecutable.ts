/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

type MiaomaCodexEnvironment = {
    CODEX_CLI_PATH?: string;
    LOCALAPPDATA?: string;
    MIAOMA_CODEX_EXECUTABLE?: string;
};

const getOpenAiCodexCandidates = ({
    localAppData,
    pathApi,
    readDirectory
}: {
    localAppData?: string;
    pathApi: typeof path;
    readDirectory: (directory: string) => string[];
}) => {
    if (!localAppData) {
        return [];
    }

    const binDirectory = pathApi.join(localAppData, 'OpenAI', 'Codex', 'bin');

    try {
        return readDirectory(binDirectory)
            .sort()
            .reverse()
            .map((versionDirectory) =>
                pathApi.join(binDirectory, versionDirectory, 'codex.exe')
            );
    } catch {
        return [];
    }
};

export const resolveMiaomaCodexExecutable = ({
    environment,
    fileExists = existsSync,
    platform,
    readDirectory = readdirSync,
    resourcesPath
}: {
    environment: MiaomaCodexEnvironment;
    fileExists?: (filePath: string) => boolean;
    platform: NodeJS.Platform;
    readDirectory?: (directory: string) => string[];
    resourcesPath: string;
}) => {
    const pathApi = platform === 'win32' ? path.win32 : path;
    const configured =
        environment.MIAOMA_CODEX_EXECUTABLE ?? environment.CODEX_CLI_PATH;
    const executableName = platform === 'win32' ? 'codex.exe' : 'codex';
    const windowsCandidates =
        platform === 'win32' && environment.LOCALAPPDATA
            ? [
                  ...getOpenAiCodexCandidates({
                      localAppData: environment.LOCALAPPDATA,
                      pathApi,
                      readDirectory
                  }),
                  pathApi.join(
                      environment.LOCALAPPDATA,
                      'Programs',
                      'ChatGPT',
                      'resources',
                      'codex.exe'
                  ),
                  pathApi.join(
                      environment.LOCALAPPDATA,
                      'Microsoft',
                      'WindowsApps',
                      'codex.exe'
                  )
              ]
            : [];
    const candidates = [
        configured,
        pathApi.join(resourcesPath, executableName),
        ...(platform === 'darwin'
            ? ['/Applications/ChatGPT.app/Contents/Resources/codex']
            : windowsCandidates),
        executableName
    ].filter((candidate): candidate is string => Boolean(candidate));

    return (
        candidates.find(
            (candidate) =>
                !pathApi.isAbsolute(candidate) || fileExists(candidate)
        ) ?? executableName
    );
};

export const getMiaomaCodexExecutable = () =>
    resolveMiaomaCodexExecutable({
        environment: process.env,
        platform: process.platform,
        resourcesPath: process.resourcesPath
    });
