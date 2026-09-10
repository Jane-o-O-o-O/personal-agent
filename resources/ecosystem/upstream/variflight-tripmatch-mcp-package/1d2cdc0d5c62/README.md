# Variflight Tripmatch MCP Server

Variflight Tripmatch MCP Server provides a set of tools to query flight and train information.

## Variflight API Key

To use the Variflight Tripmatch MCP server, you need to have a Variflight API key. You can get it from [here](https://ai.variflight.com).

## Installation

```json
{
    "mcpServers": {
        "variflight": {
            "command": "npx",
            "args": [
                "-y",
                "@variflight-ai/tripmatch-mcp"
            ],
            "env": {
                "VARIFLIGHT_API_KEY": "your_api_key_here"
            }
        }
    }
}
```
## Available Tools

### 1. Search Flights by Departure and Arrival
Search flights between airports using IATA codes:
```typescript
searchFlightsByDepArr({
  dep: "PEK",  // Beijing
  arr: "SHA",  // Shanghai
  date: "2024-03-20"
})
```

### 2. Search Flights by Number
Search flights using flight number:
```typescript
searchFlightsByNumber({
  fnum: "MU2157",
  date: "2024-03-20"
})
```

### 3. Get Flight and Train Transfer Information
Find transfer options between cities, including both flight and train connections:
```typescript
getFlightAndTrainTransferInfo({
  depcity: "BJS",
  arrcity: "LAX",
  depdate: "2024-03-20"
})
```

`searchFlightsByDepArr` and `getFlightAndTrainTransferInfo` also accept optional paging parameters. Busy routes can return dozens of results with many fields each, so use these to keep responses small:

- `limit`: maximum number of results to return
- `offset`: number of results to skip; pass `next_offset` from the previous response to get the next page. Each page is a separate billed call.
- `detail`: `"summary"` returns only the core fields of each result; `"full"` (the default) returns every field

When any of them is set, the response also includes `total`, `offset`, `returned` and, if more results exist, `next_offset`. Without them, the response is unchanged.

```typescript
getFlightAndTrainTransferInfo({
  depcity: "HFE",
  arrcity: "URC",
  depdate: "2024-03-25",
  limit: 20,
  detail: "summary"
})
```

### 4. Flight Happiness Index
Get detailed flight comfort metrics:
```typescript
flightHappinessIndex({
  fnum: "MU2157",
  date: "2024-03-20"
})
```

### 5. Real-time Aircraft Location
Track aircraft location using registration number:
```typescript
getRealtimeLocationByAnum({
  anum: "B2021"
})
```

### 6. Get Today's Date
Get today's date in YYYY-MM-DD format:
```typescript
getTodayDate({})
```

### 7. Airport Weather Forecast
Get 3-day weather forecast for airports:
```typescript
getFutureWeatherByAirport({
  airport: "PEK"
})
```

### 8. Search Flight Itineraries
Search for purchasable flight options and get the lowest prices:
```typescript
searchFlightItineraries({
  depCityCode: "BJS",  // Beijing
  arrCityCode: "SHA",  // Shanghai
  depDate: "2025-04-20"
})
```

### 9. Search Train Tickets
Search for train tickets between two stations on a specific date:
```typescript
searchTrainTickets({
  from: "合肥南", // Hefei South
  to: "北京南",   // Beijing South
  date: "2024-03-25"
})
```

### 10. Get Flight Price By Cities
Get flight price information by departure city, arrival city, and departure date:
```typescript
getFlightPriceByCities({
  dep_city: "HFE", // Hefei
  arr_city: "CAN", // Guangzhou
  dep_date: "2024-03-25"
})
```

### 11. Search Train Stations
Search for train stations by keyword:
```typescript
searchTrainStations({
  query: "北京西" // Beijing West
})
```




## License

ISC License - See [LICENSE](LICENSE) for details.

## Author

Variflight (https://ai.variflight.com)

## Version

Current version: 0.0.1

