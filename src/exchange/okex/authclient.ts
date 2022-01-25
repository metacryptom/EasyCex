import * as crypto from 'crypto'
import { createCheckers, Checker } from 'ts-interface-checker'
import okexTI from '../protocol/okex.protocol-ti'
import * as okexProtocol from '../protocol/okex.protocol'
import { HttpClient } from '../../base/httpclient'
import { ResponseNotExpectedError } from './pubclient'
const {
  IQueryDepthResult,
  IQueryInstrumentsResult,
  IQueryTickersResult,
  IGetAcccountBalanceResult,
  IGetAssetBalanceResult,
  IGetAssetCurrenciesResult,
} = createCheckers(okexTI)

export class AuthError extends Error {
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

//The API endpoints of Account require authentication.
export class OkexAuthClient {
  pbIns: HttpClient
  private readonly apiInfo: { key: string; secret: string; passphrase: string; simulated?: boolean }

  constructor(opt?: {
    apiInfo: { key: string; secret: string; passphrase: string; simulated?: boolean }
    addr?: string
    timeout?: number
  }) {
    const params = { ...{ addr: 'https://www.okex.com', timeout: 3000 }, ...opt }
    this.apiInfo = opt?.apiInfo
    this.pbIns = new HttpClient(params.addr, params.timeout, { timeout: params.timeout })
  }

  signRequest(method: string, path: string, options: { readonly qs?: string; readonly body?: string } = {}) {
    const { key, secret, passphrase } = this.apiInfo
    const timestamp = Date.now() / 1000
    const what = timestamp + method.toUpperCase() + path + (options.body || '')
    const hmac = crypto.createHmac('sha256', secret)
    const signature = hmac.update(what).digest('base64')
    return {
      key,
      passphrase,
      signature,
      timestamp,
    }
  }

  getSignature(method: string, relativeURI: string, opts?: { readonly body?: string; readonly params?: string }) {
    const sig = this.signRequest(method, relativeURI + (opts?.params ? '?' + opts.params : ''), opts)
    const res = {
      'OK-ACCESS-KEY': sig.key,
      'OK-ACCESS-PASSPHRASE': sig.passphrase,
      'OK-ACCESS-SIGN': sig.signature,
      'OK-ACCESS-TIMESTAMP': sig.timestamp,
    }
    if (this.apiInfo.simulated) {
      res['x-simulated-trading'] = '1'
    }
    return res
  }
  async commonGet<outputT>(path: string, checker?: Checker, params?: {}): Promise<outputT> {
    const res = await this.pbIns.get(path, {
      headers: { ...this.getSignature('get', path, { params: new URLSearchParams(params).toString() }) },
      params,
    })
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

  async commonPost<outputT>(path: string, checker?: Checker, body?: {}, params?: {}): Promise<outputT> {
    const res = await this.pbIns.post(path, body, {
      headers: { ...this.getSignature('post', path, { body: JSON.stringify(body) }) },
      params,
    })
    if (res.code == '0' || res.code == 0) {
      if (checker) {
        try {
          checker.check(res)
        } catch (err) {
          throw new ResponseNotExpectedError(
            path,
            { params, body },
            res,
            `Return code  ${res.code}, check response by ${checker} failed: ${err} `,
          )
        }
      }
      return res as outputT
    } else {
      throw new ResponseNotExpectedError(path, { params, body }, res, `Return code  ${res.code} error`)
    }
  }

  /**
   * Retrieve a list of assets (with non-zero balance), remaining balance, and available amount in the account.
   * See https://www.okx.com/docs-v5/en/#rest-api-account-get-balance
   * @param ccy Single currency or multiple currencies (no more than 20) separated with comma, e.g. BTC or BTC,ETH
   * @returns okexProtocol.IGetAcccountBalanceResult
   */

  async getAccountBalance(ccy: string | string[]) {
    const params = { ccy: ccy instanceof Array ? ccy.join(',') : ccy }
    const res = await this.commonGet<okexProtocol.IGetAcccountBalanceResult>(
      '/api/v5/account/balance',
      IGetAcccountBalanceResult,
      {
        ...params,
      },
    )
    return res
  }

  /**
   * Retrieve the balances of all the assets and the amount that is available or on hold.
   * see  https://www.okx.com/docs-v5/en/#rest-api-funding-get-balance
   * Rate Limit: 6 requests per second
   * Rate limit rule: UserID
   * @param ccy Single currency or multiple currencies (no more than 20) separated with comma, e.g. BTC or BTC,ETH.
   */
  async getAseetBalance(ccy: string | string[]) {
    const params = { ccy: ccy instanceof Array ? ccy.join(',') : ccy }
    const res = await this.commonGet<okexProtocol.IGetAssetBalanceResult>(
      '/api/v5/asset/balances',
      IGetAssetBalanceResult,
      {
        ...params,
      },
    )
    return res
  }

  /**
   * Retrieve a list of all currencies.
   * see  https://www.okx.com/docs-v5/en/#rest-api-funding-get-currencies
   * Rate Limit: 6 requests per second
   * Rate limit rule: UserID
   * @param none
   */
  async getAssetCurrencies() {
    const res = await this.commonGet<okexProtocol.IGetAssetCurrenciesResult>(
      '/api/v5/asset/currencies',
      IGetAssetCurrenciesResult,
      {},
    )
    return res
  }
  //TODO:
  ///api/v5/trade/order
  ///api/v5/trade/order?
  ///api/v5/trade/cancel-order
  ///api/v5/asset/deposit-address
  ///api/v5/asset/withdrawal
  ///api/v5/asset/transfer
}

if (require.main === module) {
  async function wrapper() {
    try {
      const okex = new OkexAuthClient({
        apiInfo: {
          key: process.env.key,
          secret: process.env.secret,
          passphrase: process.env.passphrase,
        },
      })

      const res = await okex.getAseetBalance('ETH')
      //    const res = await okex.queryInstruments({instId:"ETH-USDT"})
      console.log('res is ', res.data)
    } catch (err) {
      console.log('Error is  ', err, err.response.data[0])
    }
  }
  wrapper()
}
