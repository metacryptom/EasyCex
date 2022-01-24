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
import { createCheckers, Checker } from 'ts-interface-checker'
import okexTI from '../protocol/okex.protocol-ti'
import { ProtocolCheckerType } from '../protocol/okex.protocol'

export class OkexMarketFetcher implements MarketFetcher {
  readonly pair: Pair
  readonly pairName: String
  readonly exchangeType: ExchageType
  checkers: { [key in ProtocolCheckerType]: Checker }

  pbIns: any

  constructor(pair: Pair, opt?: ExchageOption) {
    this.exchangeType = ExchageType.Okex
    this.pbIns = PublicClient(opt?.addr, 5000, { timeout: 500 })
    this.pairName = `${pair.target.name.toLocaleUpperCase()}-${pair.anchor.name.toLocaleUpperCase()}`
    const { IDepthResult } = createCheckers(okexTI)
    this.checkers = { [ProtocolCheckerType.QueryDepthResult]: IDepthResult }
  }

  async queryDepth(opt?: QueryDepthOption): Promise<QueryDepthResult> {
    try {
      const depth = await this.pbIns
        .spot()
        .getSpotBook(this.pairName, { size: opt?.size.toString() || '10' /* ,depth:0.1 */ })
      const res = new QueryDepthResult()
      this.checkers[ProtocolCheckerType.QueryDepthResult].check(res)

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
      }
    } catch (err) {
      console.log('InQueryDepth err is ', err)
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
