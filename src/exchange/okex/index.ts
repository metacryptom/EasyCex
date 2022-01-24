import {
  DepthInfo,
  ExchageOption,
  ExchageType,
  MarketFetcher,
  Pair,
  QueryDepthOption,
  QueryDepthResult,
  Token,
} from '../../base'
import { PublicClient } from './PublicClient'

export class OkexMarketFetcher implements MarketFetcher {
  readonly pair: Pair
  readonly pairName: String
  readonly exchangeType: ExchageType
  pbIns: any

  constructor(pair: Pair, opt?: ExchageOption) {
    this.exchangeType = ExchageType.Okex
    this.pbIns = PublicClient(opt?.addr, 5000, { timeout: 500 })
    this.pairName = `${pair.target.name.toLocaleUpperCase()}-${pair.anchor.name.toLocaleUpperCase()}`
  }

  async queryDepth(opt?: QueryDepthOption): Promise<QueryDepthResult> {
    const depth = await this.pbIns
      .spot()
      .getSpotBook(this.pairName, { size: opt?.size.toString() || '10' /* ,depth:0.1 */ })
    const res = new QueryDepthResult()
    // data validate
    if (depth.asks && depth.asks) {
      for (const ask of depth.asks) {
        res.asks.push(new DepthInfo(ask))
      }
      for (const bid of depth.bids) {
        res.bids.push(new DepthInfo(bid))
      }
      return res
    } else {
      return null
    }
  }
}

if (require.main === module) {
  async function wrapper() {
    const okex = new OkexMarketFetcher(new Pair(new Token('ETH'), new Token('USDT')), { addr: 'http://43.154.53.9' })
    const res = await okex.queryDepth({ size: 5 })
    console.log('res is ', res)
  }
  wrapper()
}
