import { createCheckers, Checker } from 'ts-interface-checker'
import okexTI from '../protocol/okex.protocol-ti'
import * as okexProtocol from '../protocol/okex.protocol'
import { HttpClient } from '../../base/httpclient'
const { IQueryDepthResult, IQueryInstrumentsResult, IQueryTickersResult } = createCheckers(okexTI)
/**
 * ResponseNotExpectedError stands for errors happens when response is not as expectd,except for netwrok error
 */
export class ResponseNotExpectedError extends Error {
  public readonly path: string
  public readonly request: {}
  public readonly response: {}
  public readonly message: string

  constructor(path: string, request: {}, response: {}, message: string) {
    super(message)
    this.path = path
    this.request = request
    this.response = response
    Error.captureStackTrace(this)
  }
}

function traceable() {
  return (target: any, name: string, descriptor: PropertyDescriptor) => {
    const childFunction = descriptor.value
    descriptor.value = async function (this: any, ...args: any[]): Promise<any> {
      //    return null
      const res = await childFunction.apply(this, args)
      //      console.log('args is ', args, this, 'res is ', res)
      return res
    }
  }
}

//The API endpoints of Public Data do not require authentication.
export class OkexPublicClient {
  pbIns: HttpClient

  constructor(opt?: { addr: string; timeout: number }) {
    const params = { ...{ addr: 'https://www.okex.com', timeout: 3000 }, ...opt }
    this.pbIns = new HttpClient(params.addr, params.timeout, { timeout: params.timeout })
  }

  async commonGet<outputT>(path: string, checker?: Checker, params?: {}): Promise<outputT> {
    const res = await this.pbIns.get(path, { params })
    if (res.code == '0' || res.code == 0) {
      if (checker) {
        try {
          checker.check(res)
        } catch (err) {
          throw new ResponseNotExpectedError(
            path,
            params,
            res,
            `Return code  ${res.code}, check response by ${checker} failed: ${err} `,
          )
        }
      }
      return res as outputT
    } else {
      throw new ResponseNotExpectedError(path, params, res, `Return code  ${res.code} error`)
    }
  }

  /**
   * Retrieve the latest price snapshot, best bid/ask price, and trading volume in the last 24 hours.
   * See https://www.okx.com/docs-v5/en/#rest-api-market-data-get-ticker
   * @param instId Instrument ID, e.g. BTC-USDT
   * @returns okexProtocol.IQueryTickersResult
   */
  async queryTicker(instId: string) {
    const params = { instId: instId }
    const res = await this.commonGet<okexProtocol.IQueryTickersResult>('/api/v5/market/ticker', IQueryTickersResult, {
      ...params,
    })
    return res
  }

  /**
   * Query market depth of current instrument
   * See https://www.okx.com/docs-v5/en/#rest-api-market-data-get-order-book
   * Exchange Rate Limit: 20 requests per 2 seconds
   * Rate limit rule: IP
   * @param instId  Instrument ID, e.g. BTC-USDT
   * @param opt {sz} Order book depth per side. Maximum 400, e.g. 400 bids + 400 asks Default returns to 1 depth data
   * @returns Promise<okexProtocol.IQueryDepthResult>
   */
  async queryDepth(instId: string, opt?: {}) {
    const defaultParam = { sz: '10', instId: instId }
    const res = await this.commonGet<okexProtocol.IQueryDepthResult>('/api/v5/market/books', IQueryDepthResult, {
      ...defaultParam,
      ...opt,
    })
    return res
  }

  /**
   * Retrieve a list of instruments with open contracts.
   * See https://www.okx.com/docs-v5/en/#rest-api-public-data-get-instruments
   * Exchange Rate Limit: 20 requests per 2 seconds
   * Rate limit rule: IP
   * @param param {instType,instId} instType: Instrument type ,instId :Instrument ID
   * @returns okexProtocol.IQueryInstrumentsResult
   */
  async queryInstruments(param?: { readonly instType?: string; readonly instId?: string }) {
    const defaultParam = { instType: 'SPOT' }
    return this.commonGet<okexProtocol.IQueryInstrumentsResult>('/api/v5/public/instruments', IQueryInstrumentsResult, {
      ...defaultParam,
      ...param,
    })
  }

  @traceable()
  test(arg: string) {
    console.log('Start test arg ', arg)
    return 'result '
  }
}

if (require.main === module) {
  async function wrapper() {
    try {
      const okex = new OkexPublicClient()
      okex.test('Hello')
      const res = await okex.queryTicker('ETH-USDT')
      //    const res = await okex.queryInstruments({instId:"ETH-USDT"})
      console.log('res is ', res.data)
    } catch (err) {
      console.log('Error is  ', err)
    }
  }
  wrapper()
}
