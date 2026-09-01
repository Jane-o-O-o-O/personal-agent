#!/usr/bin/env node
import { DingTalkMCPServer } from './DingTalkMCPServer.js';
import {json} from "node:stream/consumers";
async function main() {
    // 检查环境变量
    const appId = process.env.DINGTALK_Client_ID;
    const appSecret = process.env.DINGTALK_Client_Secret;
    const accessToken = process.env.DINGTALK_ACCESS_TOKEN;

    // 如果既没有AppKey/Secret也没有AccessToken，显示帮助信息
    if (!accessToken && (!appId || !appSecret)) {
        console.error('🔧 DingTalk MCP Server 配置指南');
        console.error('');
        console.error('📋 需要设置以下环境变量之一：');
        console.error('');
        console.error('方式1 - 使用AppKey/Secret（推荐）：');
        console.error('  DINGTALK_Client_ID=your_app_key');
        console.error('  DINGTALK_Client_Secret=your_app_secret');
        console.error('');
        console.error('方式2 - 直接使用AccessToken（测试用）：');
        console.error('  DINGTALK_ACCESS_TOKEN=your_access_token');
        console.error('');
        console.error('🌐 获取应用信息：');
        console.error('  访问：https://open-dev.dingtalk.com/');
        console.error('  创建企业内部应用或服务窗应用');
        console.error('');
        console.error('📝 示例配置文件（.env）：');
        console.error('  DINGTALK_Client_ID=dingXXXXXXXX');
        console.error('  DINGTALK_Client_Secret=XXXXXXXXXXXXX');
        console.error('');
        console.error('🚀 启动命令：');
        console.error('  npx dingtalk-mcp');
        console.error('');
        process.exit(1);
    }
    try {
        const server = new DingTalkMCPServer();
        console.error('🎯 DingTalk MCP Server 启动中...');
        console.error('🔗 连接方式：stdio transport');
        await server.run();
        console.error('🎯 DingTalk MCP Server 启动成功.');
    }
    catch (error) {
        console.error('❌ 服务器启动失败:', error);
        console.error('');
        console.error('🔍 常见问题排查：');
        console.error('  1. 检查网络连接');
        console.error('  2. 验证AppKey/Secret是否正确');
        console.error('  3. 确认应用权限是否充足');
        console.error('  4. 查看详细错误信息');
        console.error('');
        process.exit(1);
    }


}
// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('❌ 未捕获的异常:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
    process.exit(1);
});
main().catch(error => {
    console.error('❌ 启动过程中发生错误:', error);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map