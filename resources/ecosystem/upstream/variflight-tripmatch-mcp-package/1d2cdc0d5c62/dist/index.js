#!/usr/bin/env node
import { z } from 'zod';
import { OpenAlService } from './services/openalService.js';
import { AIR_RAIL_TRANSFER_SUMMARY_FIELDS, FLIGHT_SUMMARY_FIELDS, shapeListResult } from './services/shape.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const flightService = new OpenAlService();
// 创建服务器
const server = new McpServer({
    name: "tripmatch-mcp",
    version: "1.1.0",
});
// 注册工具: 通过出发地和目的地查询航班
server.tool("searchFlightsByDepArr", "Search for flights between airports or cities by date. For cities with multiple airports, use depcity and arrcity parameters; otherwise use dep and arr parameters. Date must be in YYYY-MM-DD format. For today's date, use the getTodayDate tool. All airport/city codes must be valid IATA 3-letter codes (e.g.BJS for city of Beijing, PEK for Beijing Capital Airport).", {
    dep: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Departure airport IATA 3-letter code (e.g. PEK for Beijing, CAN for Guangzhou)")
        .optional(),
    depcity: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Departure city IATA 3-letter code (e.g. BJS for Beijing, CAN for Guangzhou)")
        .optional(),
    arr: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival airport IATA 3-letter code (e.g. SHA for Shanghai, HFE for Hefei)")
        .optional(),
    arrcity: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival city IATA 3-letter code (e.g. SHA for Shanghai, BJS for Beijing)")
        .optional(),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Flight date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
    limit: z.number().int().positive()
        .describe("Optional. Maximum number of results to return. Omit to return all results.")
        .optional(),
    offset: z.number().int().nonnegative()
        .describe("Optional. Number of results to skip, for fetching the next page. Use next_offset from the previous response. Each page is a separate billed call.")
        .optional(),
    detail: z.enum(["full", "summary"])
        .describe("Optional. 'summary' returns only the core fields of each result; 'full' returns every field. Defaults to 'full'.")
        .optional(),
}, async ({ dep, depcity, arr, arrcity, date, limit, offset, detail }) => {
    try {
        const flights = shapeListResult(await flightService.getFlightsByDepArr(dep, depcity, arr, arrcity, date), { limit, offset, detail }, FLIGHT_SUMMARY_FIELDS);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(flights, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching flights by dep/arr:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 通过航班号查询航班
server.tool("searchFlightsByNumber", "Search flights by flight number and date. Flight number should include airline code (e.g. MU2157, CZ3969).  dep and arr are optional, keep empty if you don't know them. Date format: YYYY-MM-DD. IMPORTANT: For today's date, you MUST use getTodayDate tool instead of hardcoding any date. Airport codes (optional) should be IATA 3-letter codes. ", {
    fnum: z.string()
        .regex(/^[A-Z0-9]{2,3}[0-9]{1,4}$/)
        .describe("Flight number including airline code (e.g. MU2157, CZ3969)"),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Flight date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
    dep: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Departure airport IATA 3-letter code (e.g. HFE for Hefei)")
        .optional(),
    arr: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival airport IATA 3-letter code (e.g. CAN for Guangzhou)")
        .optional(),
}, async ({ fnum, date, dep, arr }) => {
    try {
        const flights = await flightService.getFlightByNumber(fnum, date, dep, arr);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(flights, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching flights by number:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
server.tool("getFlightAndTrainTransferInfo", "Get flight and train transfer info by departure city and arrival city and departure date. Date format: YYYY-MM-DD. IMPORTANT: For today's date, you MUST use getTodayDate tool instead of hardcoding any date. Airport codes should be IATA 3-letter codes. ", {
    depdate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Flight date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
    depcity: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Departure airport IATA 3-letter code (e.g. BJS for Beijing, CAN for Guangzhou)"),
    arrcity: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival airport IATA 3-letter code (e.g. SHA for Shanghai, LAX for Los Angeles)"),
    limit: z.number().int().positive()
        .describe("Optional. Maximum number of results to return. Omit to return all results.")
        .optional(),
    offset: z.number().int().nonnegative()
        .describe("Optional. Number of results to skip, for fetching the next page. Use next_offset from the previous response. Each page is a separate billed call.")
        .optional(),
    detail: z.enum(["full", "summary"])
        .describe("Optional. 'summary' returns only the core fields of each result; 'full' returns every field. Defaults to 'full'.")
        .optional(),
}, async ({ depcity, arrcity, depdate, limit, offset, detail }) => {
    try {
        const flights = shapeListResult(await flightService.getTransferInfo(depcity, arrcity, depdate), { limit, offset, detail }, AIR_RAIL_TRANSFER_SUMMARY_FIELDS);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(flights, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error getting flight and train transfer info:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 获取航班舒适度指数
server.tool("flightHappinessIndex", "using this tool when you need information related to following topics: Detailed flight comparisons (punctuality, amenities, cabin specs),Health safety protocols for air travel,Baggage allowance verification,Environmental impact assessments,Aircraft configuration visualization,Comfort-focused trip planning (seat dimensions, entertainment, food). etc.", {
    fnum: z.string()
        .regex(/^[A-Z0-9]{2,3}[0-9]{1,4}$/)
        .describe("Flight number including airline code (e.g. MU2157, CZ3969)"),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Flight date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
    dep: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Departure airport IATA 3-letter code (e.g. HFE for Hefei)")
        .optional(),
    arr: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival airport IATA 3-letter code (e.g. CAN for Guangzhou)")
        .optional(),
}, async ({ fnum, date, dep, arr }) => {
    try {
        const flights = await flightService.getFlightHappinessIndex(fnum, date, dep, arr);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(flights, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error getting flight happiness index:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
//注册工具：飞机实时位置查询
server.tool('getRealtimeLocationByAnum', 'Get flight realtime location by aircraft number. aircraft number should be Aircraft registration numberlike B2021, B2022, B2023, etc. if aircraft number is unknown, you shuold try to request it using searchFlightsByNumber tool', {
    anum: z.string()
        .describe("Aircraft number like B2021, B2022, B2023, etc.")
}, async ({ anum }) => {
    try {
        const realtimeLocation = await flightService.getRealtimeLocationByAnum(anum);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(realtimeLocation, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error getting realtime location by anum:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 获取今天的日期
server.tool("getTodayDate", "Get today's date in local timezone (YYYY-MM-DD format). Use this tool whenever you need today's date - NEVER hardcode dates.", {
    random_string: z.string()
        .optional()
        .describe("Dummy parameter for no-parameter tools")
}, async () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayDate = `${year}-${month}-${day}`;
    return {
        content: [
            {
                type: "text",
                text: todayDate
            }
        ]
    };
});
// 注册工具：获取机场天气
server.tool('getFutureWeatherByAirport', 'Get airport future weather for 3days (today、tomorrow、the day after tomorrow) by airport IATA 3-letter code. Airport codes should be IATA 3-letter codes (e.g. PEK for Beijing, SHA for Shanghai, CAN for Guangzhou, HFE for Hefei).', {
    airport: z.string()
        .regex(/^[A-Z]{3}$/)
        .describe("Airport IATA 3-letter code (e.g. PEK for Beijing, SHA for Shanghai, CAN for Guangzhou, HFE for Hefei)")
}, async ({ airport }) => {
    try {
        const weather = await flightService.getAirportWeather(airport);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(weather, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error getting airport weather:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具：搜索航班方案
server.tool('searchFlightItineraries', 'Search for purchasable flight options and the lowest price using the departure city three-letter code, arrival city three-letter code, and departure date. (e.g. BJS for Beijing, SHA for Shanghai, CAN for Guangzhou, HFE for Hefei).', {
    depCityCode: z.string()
        .regex(/^[A-Z]{3}$/)
        .describe("Departure city 3-letter code (e.g. BJS for Beijing, SHA for Shanghai, CAN for Guangzhou, HFE for Hefei)"),
    depDate: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Departure city date (format: YYYY-MM-DD, e.g., 2025-07-04).IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
    arrCityCode: z.string()
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival city 3-letter code (e.g. BJS for Beijing, SHA for Shanghai, CAN for Guangzhou, HFE for Hefei)"),
}, async ({ depCityCode, depDate, arrCityCode }) => {
    try {
        const flightItineraries = await flightService.searchFlightItineraries(depCityCode, arrCityCode, depDate);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(flightItineraries, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching flight itineraries:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 按车站精确查询火车票（站级）
server.tool("searchTrainTicketsByStation", "Search train tickets between two specific train STATIONS on a date (station-level). 'from' and 'to' are EXACT station names, e.g. 苏州北, 上海虹桥. These are exact stations, NOT cities: '上海' returns only 上海 station, not 上海虹桥/上海南/etc. Use searchTrainStations to get exact station names (its station_name field). To search a whole city across all its stations, use searchTrainTicketsByCity instead. Date must be in YYYY-MM-DD format.", {
    from: z.string().describe("Departure train station name in Chinese, EXACT (e.g. 苏州北, 上海虹桥). Not a city — '苏州' matches only 苏州 station. Resolve via searchTrainStations.station_name."),
    to: z.string().describe("Arrival train station name in Chinese, EXACT (e.g. 上海虹桥, 成都东). Not a city — '上海' matches only 上海 station. Resolve via searchTrainStations.station_name."),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Travel date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
}, async ({ from, to, date }) => {
    try {
        const trainTickets = await flightService.getTrainTicketsByStation(from, to, date);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(trainTickets, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching train tickets by station:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 按城市查询火车票（城市级，城市名/站名通吃，永不报错）
server.tool("searchTrainTicketsByCity", "Search train tickets between two CITIES on a date (city-level: returns trains across ALL stations of each city). 'from' and 'to' accept a city name (e.g. 苏州, 上海) OR any station name (e.g. 苏州北) — a station is automatically resolved to its city. This call does not fail on station-vs-city, so prefer it when you want every train between two places. For trains at one exact station only, use searchTrainTicketsByStation instead. Date must be in YYYY-MM-DD format.", {
    from: z.string().describe("Departure city name in Chinese (e.g. 苏州, 北京). A station name (e.g. 苏州北) is also accepted and resolved to its city."),
    to: z.string().describe("Arrival city name in Chinese (e.g. 上海, 成都). A station name (e.g. 上海虹桥) is also accepted and resolved to its city."),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Travel date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
}, async ({ from, to, date }) => {
    try {
        const trainTickets = await flightService.getTrainTicketsByCity(from, to, date);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(trainTickets, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching train tickets by city:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 火车票查询（已废弃的兼容别名 -> 城市级）
// 保留旧工具名 searchTrainTickets,行为等同 searchTrainTicketsByCity（城市级）。
// 新集成请改用 searchTrainTicketsByStation（站级）或 searchTrainTicketsByCity（城市级）。
server.tool("searchTrainTickets", "[DEPRECATED — use searchTrainTicketsByCity or searchTrainTicketsByStation] City-level train search between two places, kept for backward compatibility. 'from' and 'to' accept a city name (e.g. 苏州) or a station name (e.g. 苏州北, resolved to its city); results cover ALL stations of each city. For trains at one EXACT station, use searchTrainTicketsByStation. Date must be in YYYY-MM-DD format.", {
    from: z.string().describe("Departure city name in Chinese (e.g. 苏州, 北京). A station name is also accepted and resolved to its city. [Deprecated: prefer searchTrainTicketsByCity / searchTrainTicketsByStation]"),
    to: z.string().describe("Arrival city name in Chinese (e.g. 上海, 成都). A station name is also accepted and resolved to its city. [Deprecated: prefer searchTrainTicketsByCity / searchTrainTicketsByStation]"),
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Travel date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
}, async ({ from, to, date }) => {
    try {
        const trainTickets = await flightService.getTrainTicketsByCity(from, to, date);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(trainTickets, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching train tickets (deprecated alias):', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 获取航班价格信息
server.tool("getFlightPriceByCities", "Get flight price information by departure city, arrival city, and departure date. All city codes must be valid IATA 3-letter codes (e.g. HFE for Hefei, CAN for Guangzhou). Date must be in YYYY-MM-DD format.", {
    dep_city: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Departure city IATA 3-letter code (e.g. HFE for Hefei)"),
    arr_city: z.string()
        .length(3)
        .regex(/^[A-Z]{3}$/)
        .describe("Arrival city IATA 3-letter code (e.g. CAN for Guangzhou)"),
    dep_date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe("Departure date in YYYY-MM-DD format. IMPORTANT: If user input only cotains month and date, you should use getTodayDate tool to get the year. For today's date, use getTodayDate tool instead of hardcoding"),
}, async ({ dep_city, arr_city, dep_date }) => {
    try {
        const flightPrices = await flightService.getFlightPriceByCities(dep_city, arr_city, dep_date);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(flightPrices, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error getting flight prices by cities:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 注册工具: 查询火车站信息
server.tool("searchTrainStations", "Search for train stations by keyword. Each result includes station_name, station_code, and city_name. Use station_name with searchTrainTicketsByStation (exact station-level search); searchTrainTicketsByCity accepts a city name or a station name directly.", {
    query: z.string().describe("Keyword to search for train stations (e.g. 北京西)"),
}, async ({ query }) => {
    try {
        const trainStations = await flightService.searchTrainStations(query);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(trainStations, null, 2)
                }
            ]
        };
    }
    catch (error) {
        console.error('Error searching train stations:', error instanceof Error ? error.message : error);
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});
// 连接传输并启动服务器
const transport = new StdioServerTransport();
// 启动服务器并处理错误
async function startServer() {
    try {
        await server.connect(transport);
    }
    catch (error) {
        console.error('Failed to start MCP server:', error?.message ?? error);
        process.exit(1);
    }
}
startServer().catch((error) => {
    console.error('Unhandled error:', error instanceof Error ? error.message : error);
    process.exit(1);
});
