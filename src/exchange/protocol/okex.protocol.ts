export enum ProtocolCheckerType {
  QueryDepthResult = 'queryDepth',
}
/**
 * The reulst of QueryDepth
 */
interface IDepthResult {
  asks: [string, string, string][]
  bids: [string, string, string][]
}
