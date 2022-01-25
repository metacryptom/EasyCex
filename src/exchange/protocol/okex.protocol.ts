export interface IQueryDepthResult {
  code: string
  data: {
    asks: [string, string, string, string][]
    bids: [string, string, string, string][]
  }[]
}

export interface IQueryInstrumentsResult {
  code: string
  data: {
    instType: string
    instId: string
    baseCcy: string //Base currency, e.g. BTC inBTC-USDT
    quoteCcy: string //Quote currency, e.g. USDT in BTC-USDT
    tickSz: string
    lotSz: string
    minSz: string
  }[]
}

export interface IQueryTickersResult {
  code: string
  data: {
    instType: string
    instId: string
    last: string
    lastSz: string
    askPx: string
    askSz: string
    bidPx: string
    open24h: string
    high24h: string
    low24h: string
    volCcy24h: string
    vol24h: string
    ts: string
  }[]
}
