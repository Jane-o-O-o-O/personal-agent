export declare class OpenAlService {
    private makeRequest;
    getFlightsByDepArr(dep: string | undefined, depcity: string | undefined, arr: string | undefined, arrcity: string | undefined, date: string): Promise<any>;
    getFlightByNumber(fnum: string, date: string, dep?: string, arr?: string): Promise<any>;
    getTransferInfo(depcity: string, arrcity: string, depdate: string): Promise<any>;
    getRealtimeLocationByAnum(anum: string): Promise<any>;
    getAirportWeather(airport: string): Promise<any>;
    getFlightHappinessIndex(fnum: string, date: string, dep?: string, arr?: string): Promise<any>;
    searchFlightItineraries(depCityCode: string, arrCityCode: string, depDate: string): Promise<any>;
    getTrainTicketsByStation(from: string, to: string, date: string): Promise<any>;
    getTrainTicketsByCity(from: string, to: string, date: string): Promise<any>;
    searchTrainStations(query: string): Promise<any>;
    getFlightPriceByCities(dep_city: string, arr_city: string, dep_date: string): Promise<any>;
}
