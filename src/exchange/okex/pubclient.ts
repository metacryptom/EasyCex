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

export class OkexPublicClient {
  checkers: { [key in ProtocolCheckerType]: Checker }
  pbIns: HttpClient

  constructor(opt?: { addr: string; timeout: number }) {
    const params = { ...{ addr: 'https://www.okex.com', timeout: 3000 }, ...opt }
    const { IQueryDepthResult, IQueryInstrumentsResult } = createCheckers(okexTI)
    this.pbIns = new HttpClient(params.addr, params.timeout, { timeout: params.timeout })
    this.checkers = {
      [ProtocolCheckerType.QueryDepthResult]: IQueryDepthResult,
      [ProtocolCheckerType.QueryInstruments]: IQueryInstrumentsResult,
    }
  }

  async commonGet<outputT>(path: string, checkerType?: ProtocolCheckerType, argument?: {}): Promise<outputT> {
    const res = await this.pbIns.get(path, { ...argument })
    if (res.code == '0' || res.code == 0) {
      if (checkerType) {
        try {
          this.checkers[checkerType].check(res)
        } catch (err) {
          throw new ResponseNotExpectedError(
            path,
            argument,
            res,
            `Return code  ${res.code}, check response by ${checkerType} failed: ${err} `,
          )
        }
      }
      return res as outputT
    } else {
      throw new ResponseNotExpectedError(path, argument, res, `Return code  ${res.code} error`)
    }
  }

  async queryDepth(instId: string, opt?: {}) {
    const defaultParam = { sz: '10', instId: instId }
    const res = await this.commonGet<okexProtocol.IQueryDepthResult>(
      '/api/v5/market/books',
      ProtocolCheckerType.QueryDepthResult,
      { ...defaultParam, ...opt },
    )
    return res
  }

  async queryInstruments(param?: { readonly instType?: string; readonly instId?: string }) {
    const defaultParam = { instType: 'SPOT' }
    return this.commonGet<okexProtocol.IQueryInstrumentsResult>(
      '/api/v5/public/instruments',
      ProtocolCheckerType.QueryInstruments,
      { ...defaultParam, ...param },
    )
  }
}

if (require.main === module) {
  async function wrapper() {
    try {
      const okex = new OkexPublicClient()
      const res = await okex.queryDepth('ETH-USDT')
      //    const res = await okex.queryInstruments({instId:"ETH-USDT"})
      console.log('res is ', res.data)
    } catch (err) {
      console.log('Error is  ', err)
    }
  }
  wrapper()
}
