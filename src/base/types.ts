/*
 *   Copyright (c) 2022
 *   All rights reserved.
 */
/**
 * Basic Token class
 */
export class Token {
   readonly name: String
   readonly precision: number

   /**
  *
  * @param name  name of token
  * @param precision  precision of token
  */
   constructor (name: string, precision?: number) {
     this.name = name
     this.precision = precision || 0.001
   }
}

export interface PairOption{
  Fee : number,
}

/**
 * Pair stands for market in exchange
 * For example ETH/USDT, TargetToken is ETH,and ArchorToken is USDT
 */
export class Pair {
  readonly target:Token
  readonly anchor:Token

  constructor (target: Token, anchor:Token, option?:PairOption) {
    this.target = target
    this.anchor = anchor
  }
}

/**
 * Centralized exchange type
 */
export enum ExchageType {
  Binance = 1,
  Okex = 2,
  Huobi = 3,
  GateIO = 4
}

export interface ExchageOption {
  addr: string
}

export interface QueryDepthOption {
  size : number
  timeout?: number
}

export class DepthInfo {
  readonly price: number
  readonly amount: number
  readonly count: number

  constructor (args: [number|string][]) {
    this.price = +args[0]
    this.amount = +args[1]
    this.count = args[2] ? +args[2] : 0
  }
}

export class QueryDepthResult {
  asks: DepthInfo[]
  bids: DepthInfo[]
  constructor () {
    this.asks = []
    this.bids = []
  }
}

export interface MarketFetcher{
  queryDepth(opt?: QueryDepthOption) : Promise<QueryDepthResult>
}
