/**
 * ServiceWindow Message Builder - 核心特色功能
 * 简化复杂的服务窗消息格式构建
 */
export class LogMessageBuilder {
    /**
     * 构建服务窗消息体
     * @param message 用户友好的消息参数
     * @returns 钉钉API标准格式的消息体
     */
    static buildBody(message) {
        return {
            create_report_param: message
        }
    }
}