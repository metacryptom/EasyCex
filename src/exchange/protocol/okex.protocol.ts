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
export interface IGetAcccountBalanceResult {
  code: string
  data: {
    details: {
      availBal: string
      availEq: string
      cashBal: string
      ccy: string
      crossLiab: string
      disEq: string
      eq: string
      eqUsd: string
      frozenBal: string
      interest: string
      uTime: string
    }[]
    mgnRatio: string
    totalEq: string
  }[]
}
export interface IGetAssetBalanceResult {
  code: string
  data: {
    availBal: string
    bal: string
    ccy: string
    frozenBal: string
  }[]
}

export interface IGetAssetCurrenciesResult {
  code: string
  data: {
    ccy: string
    name: string
    chain: string //Chain name, e.g. USDT-ERC20, USDT-TRC20, USDT-Omni
    canDep: boolean //Availability to deposit from chain.
    canWd: boolean //Availability to withdraw to chain.
    canInternal: boolean //Availability to internal transfer.
    minWd: string //Minimum withdrawal threshold
    maxFee: string //Minimum withdrawal fee
    minFee: string //Maximum withdrawal fee
    mainNet: boolean //If current chain is main net then return true, otherwise return false
  }[]
}
