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
import { createCheckers, Checker } from 'ts-interface-checker'
import okexTI from '../protocol/okex.protocol-ti'
import * as okexProtocol from '../protocol/okex.protocol'
import { ProtocolCheckerType } from '../protocol/okex.protocol'
import { HttpClient } from '../../base/httpclient'



/**
 * ResponseNotExpectedError stands for errors happens when response is not as expectd,except for netwrok error
 */
export class ResponseNotExpectedError extends Error {
  public readonly path: string
  public readonly request :{}
  public readonly response :{}
  public readonly message :string
  
  constructor(path :string, request:{},response:{},message: string){
    super(message)
    this.path = path
    this.request = request
    this.response = response
    Error.captureStackTrace(this);
  }
}

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
    const { IQueryDepthResult, IQueryInstrumentsResult } = createCheckers(okexTI)
    this.checkers = {
      [ProtocolCheckerType.QueryDepthResult]: IQueryDepthResult,
      [ProtocolCheckerType.QueryInstruments]: IQueryInstrumentsResult,
    }
  }



  async commonGet<outputT> (path :string, checkerType?:ProtocolCheckerType, argument?: {}): Promise<outputT> {
    const res = await this.pbIns.get(path, {...argument})
    if( res.code == '0'|| res.code == 0) {
      if(checkerType){
        try{
          this.checkers[checkerType].check(res)
        }catch(err){
          throw new ResponseNotExpectedError(path,argument,res,`Return code  ${res.code}, check response by ${checkerType} failed: ${err} `)
        }
      }
      return  res as outputT
    }else{
      throw new ResponseNotExpectedError(path,argument,res,`Return code  ${res.code} error`)
    }

  }

  async queryDepth(opt?: QueryDepthOption): Promise<QueryDepthResult> {
    const defaultParam = { sz: '10' ,instId :  this.pairName }
    const res = new QueryDepthResult()
    const depth = await this.commonGet<okexProtocol.IQueryDepthResult>('/api/v5/market/books',ProtocolCheckerType.QueryDepthResult,{ ...defaultParam, ...opt } )
    // convert data
    if (depth.data[0].asks && depth.data[0].bids) {
      for (const ask of depth.data[0].asks) {
        const [price,sz,_,cnt] = ask
        res.asks.push(new DepthInfo([price,sz,cnt] as any))
      }
      for (const bid of depth.data[0].bids) {
        const [price,sz,_,cnt] = bid
        res.bids.push(new DepthInfo([price,sz,cnt]  as any))
      }
      return res
    } else {
      return null
    }
  }

  async queryInstruments(param?: { readonly instType?: string; readonly instId?: string }) {
    const defaultParam = { instType: 'SPOT' }
    return this.commonGet<okexProtocol.IQueryInstrumentsResult>('/api/v5/public/instruments',ProtocolCheckerType.QueryInstruments,{ ...defaultParam, ...param } )
  }
}

if (require.main === module) {
  async function wrapper() {
    try{
    const okex = new OkexMarketFetcher(new Pair(new Token('ETH'), new Token('USDT')))
    const res = await okex.queryDepth({ size: 5 })
//    const res = await okex.queryInstruments({instId:"ETH-USDT"})
    console.log('res is ', res)
    }catch(err){
      console.log ("Error is  ",err,err.response.data)
    }
  }
  wrapper()
}
