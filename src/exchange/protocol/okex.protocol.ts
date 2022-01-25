export enum ProtocolCheckerType {
  QueryDepthResult = 'queryDepth',
  QueryInstruments = 'queryInstruments',
}
/**
 * The reulst of QueryDepth
 */
export interface IQueryDepthResult {
  code : string
  data: {
    asks: [string, string, string,string][]
    bids: [string, string, string,string][]
  }[]
}

export interface IQueryInstrumentsResult {
  code : string
  data: {
    instType: string,
    instId: string,
    baseCcy: string, //Base currency, e.g. BTC inBTC-USDT
    quoteCcy : string,//Quote currency, e.g. USDT in BTC-USDT
    tickSz :string
    lotSz:string
    minSz :string
  }[]
}
