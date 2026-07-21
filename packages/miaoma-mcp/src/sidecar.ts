/*
- Copyright (c) 2026 妙码学院 @Heyi
- All rights reserved.
- 妙码学院官方出品，作者 @Heyi，项目实战源码，供学员学习使用，可用作练习，可用作美化简历，不可开源。
  */

import {
    createMiaomaMcpBridgeClient,
    startMiaomaMcpStdioServer
} from './index';

const getArgumentValue = (name: string) => {
    const index = process.argv.indexOf(name);
    const value = index < 0 ? undefined : process.argv[index + 1];

    return value && !value.startsWith('--') ? value : undefined;
};

const endpoint = getArgumentValue('--bridge-endpoint');

if (!endpoint) {
    process.stderr.write('Miaoma MCP bridge endpoint is required.\n');
    process.exitCode = 1;
} else {
    void startMiaomaMcpStdioServer({
        appClient: createMiaomaMcpBridgeClient({ endpoint })
    }).catch((error) => {
        process.stderr.write(
            `${error instanceof Error ? error.message : 'Unable to start Miaoma MCP.'}\n`
        );
        process.exitCode = 1;
    });
}
