#!/usr/bin/env node

import { request } from "./http-request"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const KUAIDI100_API_KEY = getApiKey();
const KUAIDI100_API_BASE_URL = "https://api.kuaidi100.com/stdio/"

// Create an MCP server
const server = new McpServer({
  name: "kuaidi100_mcp",
  version: "1.0.0"
});

function getApiKey(): string {
  const apiKey = process.env.KUAIDI100_API_KEY;
  if (!apiKey) {
    console.error("KUAIDI100_API_KEY environment variable is not set");
    process.exit(1);
  }
  return apiKey;
}

// Add tools
server.registerTool("query_trace",
  {
    title: "查询快递物流轨迹",
    description: "查询物流轨迹服务，传入快递单号和手机号，获取对应快递的物流轨迹",
    inputSchema: {
      kuaidi_num: z.string().describe("快递单号"),
      phone: z.string().describe("手机号，仅当快递单号为SF开头时必填，其余情况置空即可").default("")
    }
  },
  async ({ kuaidi_num, phone }) => {
    const response = await request<string>(
      KUAIDI100_API_BASE_URL + "queryTrace",
      "post",
      {
        kuaidiNum: kuaidi_num,
        phone: phone,
        key: KUAIDI100_API_KEY
      },
      undefined
    )
    return {
      content: [{ type: "text", text: response }]
    };
  }
);


server.registerTool("estimate_time",
  {
    title: "寄件前快递送达时间预估",
    description: "通过快递公司编码、收寄件地址、下单时间、业务/产品类型来预估快递可送达的时间，以及过程需要花费的时间；用于寄件前快递送达时间预估",
    inputSchema: {
      kuaidi_com: z.string().describe("快递公司编码，一律用小写字母；目前仅支持：京东：jd，跨越：kuayue，顺丰：shunfeng，顺丰快运：shunfengkuaiyun，中通：zhongtong，德邦快递：debangkuaidi，EMS：ems，EMS-国际件：emsguoji，邮政国内:youzhengguonei，国际包裹：youzhengguoji，申通：shentong，圆通：yuantong，韵达：yunda，宅急送：zhaijisong，芝麻开门：zhimakaimen，联邦快递：lianbangkuaidi，天地华宇：tiandihuayu，安能快运：annengwuliu，京广速递：jinguangsudikuaijian，加运美：jiayunmeiwuliu，极兔速递：jtexpress"),
      from_loc: z.string().describe("出发地（地址需包含3级及以上），例如：广东深圳南山区；如果没有省市区信息的话请补全，如广东深圳改为广东省深圳市南山区"),
      to_loc: z.string().describe("目的地（地址需包含3级及以上），例如：北京海淀区；如果没有省市区信息的话请补全，如广东深圳改为广东省深圳市南山区。如果用户没告知目的地，则不调用服务，继续追问用户目的地是哪里"),
      order_time: z.string().describe("下单时间，格式要求yyyy-MM-dd HH:mm:ss，例如：2023-08-08 08:08:08；如果用户没告知下单时间，则不传").default(""),
      exp_type: z.string().describe("业务或产品类型，如：标准快递")
    }
  },
  async ({ kuaidi_com, from_loc, to_loc, order_time, exp_type }) => {
    const response = await request<string>(
      KUAIDI100_API_BASE_URL + "estimateTime",
      "post",
      {
        kuaidicom: kuaidi_com,
        from: from_loc,
        to: to_loc,
        orderTime: order_time,
        expType: exp_type,
        key: KUAIDI100_API_KEY
      },
      undefined
    )
    return {
      content: [{ type: "text", text: response }]
    };
  }
);


server.registerTool("estimate_time_with_logistic",
  {
    title: "用于在途快递的到达时间预估",
    description: "通过快递公司编码、收寄件地址、下单时间、历史物流轨迹信息来预估快递送达的时间；用于在途快递的到达时间预估",
    inputSchema: {
      kuaidi_com: z.string().describe("快递公司编码，一律用小写字母；目前仅支持：京东：jd，跨越：kuayue，顺丰：shunfeng，顺丰快运：shunfengkuaiyun，中通：zhongtong，德邦快递：debangkuaidi，EMS：ems，EMS-国际件：emsguoji，邮政国内:youzhengguonei，国际包裹：youzhengguoji，申通：shentong，圆通：yuantong，韵达：yunda，宅急送：zhaijisong，芝麻开门：zhimakaimen，联邦快递：lianbangkuaidi，天地华宇：tiandihuayu，安能快运：annengwuliu，京广速递：jinguangsudikuaijian，加运美：jiayunmeiwuliu，极兔速递：jtexpress"),
      from_loc: z.string().describe("出发地（地址需包含3级及以上），例如：广东深圳南山区；如果没有省市区信息的话请补全，如广东深圳改为广东省深圳市南山区"),
      to_loc: z.string().describe("目的地（地址需包含3级及以上），例如：北京海淀区；如果没有省市区信息的话请补全，如广东深圳改为广东省深圳市南山区。如果用户没告知目的地，则不调用服务，继续追问用户目的地是哪里"),
      order_time: z.string().describe("下单时间，格式要求yyyy-MM-dd HH:mm:ss，例如：2023-08-08 08:08:08；如果用户没告知下单时间，则不传").default(""),
      logistic: z.string().describe("历史物流轨迹信息，用于预测在途时还需多长时间到达；一般情况下取query_trace服务返回数据的历史物流轨迹信息转为json数组即可，数据格式为：[{\"time\":\"2025-05-09 13:15:26\",\"context\":\"您的快件离开【吉林省吉林市桦甸市】，已发往【长春转运中心】\"},{\"time\":\"2025-05-09 12:09:38\",\"context\":\"您的快件在【吉林省吉林市桦甸市】已揽收\"}]；time为物流轨迹节点的时间，context为在该物流轨迹节点的描述"),
    }
  },
  async ({ kuaidi_com, from_loc, to_loc, order_time, logistic }) => {
    const response = await request<string>(
      KUAIDI100_API_BASE_URL + "estimateTimeWithLogistic",
      "post",
      {
        kuaidicom: kuaidi_com,
        from: from_loc,
        to: to_loc,
        orderTime: order_time,
        logistic: logistic,
        key: KUAIDI100_API_KEY
      },
      undefined
    )
    return {
      content: [{ type: "text", text: response }]
    };
  }
);


server.registerTool("estimate_price",
  {
    title: "用于寄件前快递公司运费预估",
    description: "通过快递公司、收寄件地址和重量，预估快递公司运费",
    inputSchema: {
      kuaidi_com: z.string().describe("快递公司的编码，一律用小写字母；目前仅支持：顺丰：shunfeng，京东：jd，德邦快递：debangkuaidi，圆通：yuantong，中通：zhongtong，申通：shentong，韵达：yunda，EMS：ems"),
      rec_addr: z.string().describe("收件地址，如”广东深圳南山区”；如果没有省市信息的话请补全，如广东深圳改为广东省深圳市。如果用户没告知收件地址，则不调用服务，继续追问用户收件地址是哪里"),
      send_addr: z.string().describe("寄件地址，如”北京海淀区”；如果没有省市信息的话请补全，如广东深圳改为广东省深圳市。如果用户没告知寄件地址，则不调用服务，继续追问用户寄件地址是哪里"),
      weight: z.string().describe("重量，默认单位为kg，参数无需带单位，如1.0；默认重量为1kg").default("1"),
    }
  },
  async ({ kuaidi_com, rec_addr, send_addr, weight }) => {
    const response = await request<string>(
      KUAIDI100_API_BASE_URL + "estimatePrice",
      "post",
      {
        kuaidicom: kuaidi_com,
        recAddr: rec_addr,
        sendAddr: send_addr,
        weight: weight,
        key: KUAIDI100_API_KEY
      },
      undefined
    )
    return {
      content: [{ type: "text", text: response }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server is running...");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
