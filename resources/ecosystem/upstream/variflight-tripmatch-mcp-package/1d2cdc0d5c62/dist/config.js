import dotenv from 'dotenv';
dotenv.config();
export const config = {
    server: {
        name: 'variflight-mcp',
        version: '1.1.0',
    },
    api: {
        baseUrl: process.env.VARIFLIGHT_API_URL || 'https://mcp.variflight.com/api/v1/mcp/data',
        apiKey: process.env.X_VARIFLIGHT_KEY || process.env.VARIFLIGHT_API_KEY,
    },
};
if (!config.api.apiKey) {
    console.error('[variflight-mcp] Missing API key: set X_VARIFLIGHT_KEY env');
}
