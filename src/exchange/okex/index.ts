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
import { HttpClient } from './httpclient'

export class OkexMarketFetcher implements MarketFetcher {
  readonly pair: Pair
  readonly pairName: string
  readonly exchangeType: ExchageType
  checkers: { [key in ProtocolCheckerType]: Checker }

  pbIns: HttpClient

  constructor(pair: Pair, opt?: ExchageOption) {
    this.exchangeType = ExchageType.Okex
    this.pbIns = new HttpClient(opt?.addr || 'https://www.okex.com', 3000, { timeout: 3000 })
    this.pairName = `${pair.target.name.toLocaleUpperCase()}-${pair.anchor.name.toLocaleUpperCase()}`
    const { IDepthResult, Instruments } = createCheckers(okexTI)
    this.checkers = {
      [ProtocolCheckerType.QueryDepthResult]: IDepthResult,
      [ProtocolCheckerType.QueryInstruments]: Instruments,
    }
  }

  async queryDepth(opt?: QueryDepthOption): Promise<QueryDepthResult> {
    try {
      const depth = await this.pbIns.get(this.pairName, { size: opt?.size.toString() || '10' /* ,depth:0.1 */ })
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
        return null
      }
    } catch (err) {
      console.log('InQueryDepth err is ', err)
      return null
    }
  }

  async queryInstruments(param?: { readonly instType?: string; readonly instId?: string }) {
    const defaultParam = { instType: 'SPOT' }
    const res = await this.pbIns.get('/api/v5/public/instruments', { ...defaultParam, ...param })
    this.checkers[ProtocolCheckerType.QueryInstruments].check({ list: res })

    return res
  }
}

if (require.main === module) {
  async function wrapper() {
    const okex = new OkexMarketFetcher(new Pair(new Token('ETH'), new Token('USDT')))
    // const res = await okex.queryDepth({ size: 5 })
    const res = await okex.queryInstruments()
    console.log('res is ', res)
  }
  wrapper()
}
