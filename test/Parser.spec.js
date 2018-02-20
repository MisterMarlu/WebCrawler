/**
 * @author lbraun
 * @date 20.02.2018
 * @licence MIT
 */

'use strict';

const {Parser} = require('../lib/Parser'),
  expect = require('chai').expect;

describe('Parser module', () => {

  /** @see Parser.getModuleName **/
  describe('"getModuleName"', () => {
    it('should return a string', () => {
      let path = '/path/to/module.js',
        name = Parser.getModuleName(path);

      expect(name).to.be.a('string');
      expect(name).to.equal('module');
    });
  });
});