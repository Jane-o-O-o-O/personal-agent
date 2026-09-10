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
Search for flights between airports or cities by date. For cities with multiple airports, use depcity and arrcity parameters; otherwise use dep and arr parameters. Date must be in YYYY-MM-DD format. For today's date, use the getTodayDate tool. All airport/city codes must be valid IATA 3-letter codes (e.g.BJS for city of Beijing, PEK for Beijing Capital Airport).
```typescript
searchFlightsByDepArr({
  dep: "PEK",      // Departure airport IATA 3-letter code (optional)
  depcity: "BJS", // Departure city IATA 3-letter code (optional)
  arr: "SHA",      // Arrival airport IATA 3-letter code (optional)
  arrcity: "SHA",  // Arrival city IATA 3-letter code (optional)
  date: "2024-03-20" // Flight date in YYYY-MM-DD format
})
```

### 2. Search Flights by Number
Search flights by flight number and date. Flight number should include airline code (e.g. MU2157, CZ3969). dep and arr are optional, keep empty if you don't know them. Date format: YYYY-MM-DD. IMPORTANT: For today's date, you MUST use getTodayDate tool instead of hardcoding any date. Airport codes (optional) should be IATA 3-letter codes.
```typescript
searchFlightsByNumber({
  fnum: "MU2157", // Flight number including airline code
  date: "2024-03-20", // Flight date in YYYY-MM-DD format
  dep: "HFE",     // Departure airport IATA 3-letter code (optional)
  arr: "CAN"      // Arrival airport IATA 3-letter code (optional)
})
```

### 3. Get Flight and Train Transfer Information
Get flight and train transfer info by departure city and arrival city and departure date. Date format: YYYY-MM-DD. IMPORTANT: For today's date, you MUST use getTodayDate tool instead of hardcoding any date. Airport codes should be IATA 3-letter codes.
```typescript
getFlightAndTrainTransferInfo({
  depcity: "BJS", // Departure airport IATA 3-letter code
  arrcity: "LAX", // Arrival airport IATA 3-letter code
  depdate: "2024-03-20" // Flight date in YYYY-MM-DD format
})
```

### 4. Flight Happiness Index
Using this tool when you need information related to following topics: Detailed flight comparisons (punctuality, amenities, cabin specs), Health safety protocols for air travel, Baggage allowance verification, Environmental impact assessments, Aircraft configuration visualization, Comfort-focused trip planning (seat dimensions, entertainment, food), etc.
```typescript
flightHappinessIndex({
  fnum: "MU2157", // Flight number including airline code
  date: "2024-03-20", // Flight date in YYYY-MM-DD format
  dep: "HFE",     // Departure airport IATA 3-letter code (optional)
  arr: "CAN"      // Arrival airport IATA 3-letter code (optional)
})
```

### 5. Get Today's Date
Get today's date in local timezone (YYYY-MM-DD format). Use this tool whenever you need today's date - NEVER hardcode dates.
```typescript
getTodayDate({})
```

### 6. Airport Weather Forecast
Get airport future weather for 3days (today、tomorrow、the day after tomorrow) by airport IATA 3-letter code. Airport codes should be IATA 3-letter codes (e.g. PEK for Beijing, SHA for Shanghai, CAN for Guangzhou, HFE for Hefei).
```typescript
getFutureWeatherByAirport({
  airport: "PEK" // Airport IATA 3-letter code
})
```

### 7. Search Train Tickets
Search for train tickets between two cities on a specific date. Date must be in YYYY-MM-DD format.
```typescript
searchTrainTickets({
  from: "合肥", // Departure city name
  to: "北京",   // Arrival city name
  date: "2024-03-25" // Travel date in YYYY-MM-DD format
})
```

### 8. Get Flight Price By Cities
Get flight price information by departure city, arrival city, and departure date. All city codes must be valid IATA 3-letter codes (e.g. HFE for Hefei, CAN for Guangzhou). Date must be in YYYY-MM-DD format.
```typescript
getFlightPriceByCities({
  dep_city: "HFE", // Departure city IATA 3-letter code
  arr_city: "CAN", // Arrival city IATA 3-letter code
  dep_date: "2024-03-25" // Departure date in YYYY-MM-DD format
})
```

### 9. Search Train Stations
Search for train stations by keyword.
```typescript
searchTrainStations({
  query: "北京" // Keyword to search for train stations
})
```


## License

ISC License - See [LICENSE](LICENSE) for details.

## Author

Variflight (https://ai.variflight.com)

## Version

Current version: 0.0.2

