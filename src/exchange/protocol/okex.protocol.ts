export enum ProtocolCheckerType {
  QueryDepthResult = 'queryDepth',
  QueryInstruments = 'queryInstruments',
}
/**
 * The reulst of QueryDepth
 */
export interface IDepthResult {
  asks: [string, string, string][]
  bids: [string, string, string][]
}

export interface Instruments {
  list: {
    base_currency: string
    category: string
    instrument_id: string
    min_size: string
    quote_currency: string
    size_increment: string
    tick_size: string
  }[]
}
