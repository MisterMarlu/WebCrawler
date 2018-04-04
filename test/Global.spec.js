'use strict';

const Global = require('../lib/Global'),
  expect = require('chai').expect;

describe('Global module', () => {

  /** @see Global.get **/
  describe('"get"', () => {
    it('should return the set value', () => {
      Global.set('test', true);
      let test = Global.get('test');
      expect(test).to.be.a('boolean');
      expect(test).to.be.true;
    });
  });
});