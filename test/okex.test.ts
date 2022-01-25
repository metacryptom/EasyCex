import { Greeter } from '../lib'
import { expect } from 'chai'
import { OkexPublicClient } from '../src/exchange/okex/pubclient'

describe('okex', () => {
  describe('okex public node', () => {
    let okpubCli: OkexPublicClient
    beforeEach(async () => {
      okpubCli = new OkexPublicClient()
    })
    it('query order books should return ok', async () => {
      const data = await okpubCli.queryDepth('ETH-USDT')
      expect(data.code).to.be.equal('0')
      expect(data.data.length).to.be.equal(1)

      // argument size should be ok
      const test2InputSize = 5
      const data2 = await okpubCli.queryDepth('ETH-USDT', { sz: test2InputSize })
      expect(data2.data[0].asks.length).to.be.equal(test2InputSize)
    })

    it('query instruments should return ok', async () => {
      const data = await okpubCli.queryInstruments()
      expect(data.code).to.be.equal('0')

      // instId should return right length
      const data2 = await okpubCli.queryInstruments({ instId: 'ETH-USDT' })
      expect(data2.data.length).to.be.equal(1)
    })
  })
})
