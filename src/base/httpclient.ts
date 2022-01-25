// tslint:disable:variable-name

import axios, { AxiosInstance } from 'axios'

export class HttpClient {
  axiosIns: AxiosInstance
  constructor(host: string, timeoutMs: number, axiosConfig: {}) {
    this.axiosIns = axios.create({
      baseURL: host,
      timeout: timeoutMs,
      ...axiosConfig,
    })
  }

  async get(url: string, params?: object): Promise<any> {
    return this.axiosIns
      .get(url, { params })
      .then((res: { readonly data: any }) => res.data)
      .catch((error) => {
        throw error
      })
  }
}
