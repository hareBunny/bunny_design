/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { build } from 'esbuild';

const execute = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageDirectory = path.resolve(scriptDirectory, '..');
const isHostBuild = process.argv.includes('--host');
const target = isHostBuild
    ? process.platform === 'win32'
        ? 'win32-x64'
        : null
    : process.argv.at(-1);

if (target !== 'win32-x64') {
    process.exit(0);
}

const intermediateDirectory = path.join(packageDirectory, 'sidecar-dist');
const outputDirectory = path.join(packageDirectory, 'bin');
const bundlePath = path.join(intermediateDirectory, 'miaoma-mcp.cjs');
const executableName = isHostBuild
    ? `miaoma-mcp-win32-x64-${Date.now()}.exe`
    : 'miaoma-mcp-win32-x64.exe';
const executablePath = path.join(outputDirectory, executableName);

await Promise.all([
    mkdir(intermediateDirectory, { recursive: true }),
    mkdir(outputDirectory, { recursive: true })
]);
await build({
    entryPoints: [path.join(packageDirectory, 'src/sidecar.ts')],
    bundle: true,
    format: 'cjs',
    outfile: bundlePath,
    platform: 'node',
    target: 'node18'
});

const require = createRequire(import.meta.url);
const pkgDirectory = path.dirname(require.resolve('@yao-pkg/pkg/package.json'));
const pkgCliPath = path.join(pkgDirectory, 'lib-es5/bin.js');

await execute(
    process.execPath,
    [
        pkgCliPath,
        '--targets',
        'node20-win-x64',
        '--no-bytecode',
        '--public',
        '--output',
        executablePath,
        bundlePath
    ],
    {
        cwd: packageDirectory,
        maxBuffer: 10 * 1024 * 1024
    }
);
