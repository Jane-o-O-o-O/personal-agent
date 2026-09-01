
/**
 * 日期和时间处理的工具类 (适用于 Node.js 环境)
 */
export class DateUtils {

    /**
     * 异步获取当前时间，并根据运行环境的区域和时区设置进行格式化。
     * @returns {Promise<string>} 一个 Promise，解析为格式化后的本地时间字符串, e.g., "2023-10-27 16:45:30"
     */
    static getFormattedLocalNow() {
        // 1. 异步、安全地获取操作系统的区域设置，提供一个后备值
        const locale = Intl.DateTimeFormat().resolvedOptions().locale || 'zh-CN';

        // 2. Intl.DateTimeFormat 默认就会使用环境时区
        const formatter = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // 使用24小时制
        });

        // 3. 格式化并统一分隔符
        return formatter.format(new Date()).replace(/\//g, '-');
    }
}