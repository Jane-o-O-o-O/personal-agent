/**
 * ServiceWindow Message Builder - 核心特色功能
 * 简化复杂的服务窗消息格式构建
 */
export class ServiceWindowMessageBuilder {
    /**
     * 构建服务窗消息体
     * @param message 用户友好的消息参数
     * @returns 钉钉API标准格式的消息体
     */
    static buildSendServiceWindowMarkdownBody(message) {
        return {
            detail: {
                msgType: "markdown",
                uuid: this.generateMessageUuid(),
                userId: message.userId,
                messageBody: {
                    markdown: {
                        title: message.messageTitle,
                        text: message.messageContent
                    }
                }
            },
            accountId: message.accountId
        }
    }

    static buildBatchSendServiceWindowMarkdownBody(message) {
        return {
            detail: {
                msgType: "markdown",
                uuid: this.generateMessageUuid(),
                userIdList: message.userIdList,
                messageBody: {
                    markdown: {
                        title: message.messageTitle,
                        text: message.messageContent
                    }
                }
            },
            accountId: message.accountId
        }
    }


    /**
     * 生成唯一的消息ID
     */
    static generateMessageUuid() {
        const UUID = crypto.randomUUID();
        return UUID.toString();
        // return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}