import { Greeter } from '../';
import { expect } from 'chai';

describe('index.ts', () => {
  it(' should return input', () => {
    const input: string = 'hello';
    expect(Greeter('hello')).to.be.equal('Hello ' + input);
  });
});
