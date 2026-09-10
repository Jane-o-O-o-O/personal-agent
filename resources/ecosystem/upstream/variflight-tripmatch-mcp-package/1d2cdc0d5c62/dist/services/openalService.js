import { config } from '../config.js';
export class OpenAlService {
    async makeRequest(endpoint, params) {
        const url = new URL(config.api.baseUrl);
        const request_body = {
            endpoint: endpoint,
            params: params
        };
        const response = await fetch(url.toString(), {
            method: 'post',
            headers: {
                'X-VARIFLIGHT-KEY': config.api.apiKey || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request_body),
        });
        if (!response.ok) {
            console.error(`API request failed: endpoint=${endpoint} status=${response.status} ${response.statusText}`);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    async getFlightsByDepArr(dep, depcity, arr, arrcity, date) {
        return this.makeRequest('flights', {
            dep,
            depcity,
            arr,
            arrcity,
            date,
        });
    }
    async getFlightByNumber(fnum, date, dep, arr) {
        const params = {
            fnum,
            date,
        };
        if (dep)
            params.dep = dep;
        if (arr)
            params.arr = arr;
        return this.makeRequest('flight', params);
    }
    // 获取航班中转信息
    async getTransferInfo(depcity, arrcity, depdate) {
        return this.makeRequest('transfer', {
            depcity,
            arrcity,
            depdate,
            "fromMCP": 1
        });
    }
    async getRealtimeLocationByAnum(anum) {
        return this.makeRequest('realtimeLocation', {
            anum
        });
    }
    async getAirportWeather(airport) {
        return this.makeRequest('futureAirportWeather', {
            "code": airport,
            "type": "1"
        });
    }
    async getFlightHappinessIndex(fnum, date, dep, arr) {
        const params = {
            fnum,
            date,
        };
        if (dep)
            params.dep = dep;
        if (arr)
            params.arr = arr;
        return this.makeRequest('happiness', params);
    }
    async searchFlightItineraries(depCityCode, arrCityCode, depDate) {
        return this.makeRequest('searchFlightItineraries', {
            "depCityCode": depCityCode,
            "arrCityCode": arrCityCode,
            "depDate": depDate
        });
    }
    // 站级：trainStanTicket 的 from/to 按精确站名匹配，只返回该站的车次
    async getTrainTicketsByStation(from, to, date) {
        return this.makeRequest('trainStanTicket', {
            from,
            to,
            date
        });
    }
    // 城市级：trainStanTicket 的 dep/arr 会把站名归到所属城市，返回全市所有站的车次（城市/站名通吃，不报错）
    async getTrainTicketsByCity(from, to, date) {
        return this.makeRequest('trainStanTicket', {
            dep: from,
            arr: to,
            date
        });
    }
    async searchTrainStations(query) {
        return this.makeRequest('searchTrainStations', {
            query
        });
    }
    async getFlightPriceByCities(dep_city, arr_city, dep_date) {
        return this.makeRequest('getFlightPriceByCities', {
            dep_city,
            arr_city,
            dep_date
        });
    }
}
