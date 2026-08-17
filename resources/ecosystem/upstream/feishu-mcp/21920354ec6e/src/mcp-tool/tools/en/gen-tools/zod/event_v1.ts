import { z } from 'zod';
export type eventV1ToolName = 'event.v1.outboundIp.list';
export const eventV1OutboundIpList = {
  project: 'event',
  name: 'event.v1.outboundIp.list',
  sdkName: 'event.v1.outboundIp.list',
  path: '/open-apis/event/v1/outbound_ip',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Events and callbacks-Event subscriptions-Get event's outbound IP-When Feishu Open Platform pushes events to the callback address configured by the application, it is sent out through a specific IP, and the application can get all relevant IP addresses through this interface",
  accessTokens: ['tenant'],
  schema: {
    params: z.object({ page_size: z.number().optional(), page_token: z.string().optional() }).optional(),
  },
};
export const eventV1Tools = [eventV1OutboundIpList];
