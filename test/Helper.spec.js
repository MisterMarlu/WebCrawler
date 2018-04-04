'use strict';

const Helper = require('../lib/Helper'),
  Global = require('../lib/Global'),
  expect = require('chai').expect;

describe('Helper module', () => {

  /** @see Helper.twoDigits **/
  describe('"twoDigits"', () => {
    it('should return two digits as string', () => {
      const twoDig = Helper.twoDigits(1);
      expect(twoDig).to.be.a('string');
      expect(twoDig).to.equal('01');
    });
  });

  /** @see Helper.getSqlTimestamp **/
  describe('"getSqlTimestamp"', () => {
    it('should return a timestamp as string', () => {
      let date = new Date(),
        Y = `${date.getFullYear()}`,
        m = `${Helper.twoDigits(1 + date.getMonth())}`,
        d = `${Helper.twoDigits(date.getDate())}`,
        h = `${Helper.twoDigits(date.getHours())}`,
        i = `${Helper.twoDigits(date.getMinutes())}`,
        s = `${Helper.twoDigits(date.getSeconds())}`,
        result = `${Y}-${m}-${d} ${h}:${i}:${s}`;

      const timestamp = Helper.getSqlTimestamp(date);
      expect(timestamp).to.be.a('string');
      expect(timestamp).to.equal(result);
      expect(timestamp).to.have.lengthOf(result.length);
    });
  });

  /** @see Helper.hasCallback **/
  describe('"hasCallback"', () => {
    it('should return false', () => {
      Global.set('callbacks', {});

      let callbackOne = Helper.hasCallback('test');
      expect(callbackOne).to.be.a('boolean');
      expect(callbackOne).to.be.false;
    });

    it('should return true', () => {
      Global.set('callbacks', {'test': testFunction});
      let callbackTwo = Helper.hasCallback('test');
      expect(callbackTwo).to.be.a('boolean');
      expect(callbackTwo).to.be.true;

      Global.set('callbacks', {});
    });
  });

  /** @see Helper.getCallback **/
  describe('"getCallback"', () => {
    it('should return a function', () => {
      Global.set('callbacks', {'test': testFunction});
      const callback = Helper.getCallback('test');
      expect(callback).to.be.a('function');
      Global.set('callbacks', {});
    });

    it('should return null', () => {
      Global.set('callbacks', {});
      const callback = Helper.getCallback('test');
      expect(callback).to.equal(null);
    });
  });
});

function testFunction() {
  return 'testFunction';
}