import { createCheckers } from 'ts-interface-checker'
import tempTI from './exchange/protocol/tempate.protocol-ti'
export const Greeter = (name: string) => `Hello ${name}`
const a = 'HH'

class Test {}

console.log('herelu')

const i: number = 0

const { GoodTempalte } = createCheckers(tempTI)
console.log(GoodTempalte.check({ age: 1, name: 'Helo', likes: ['a', 'c'] }))
