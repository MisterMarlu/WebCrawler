'use strict';

const Formatter = require('../lib/Formatter'),
  expect = require('chai').expect;

describe('Formatter module', () => {

  /** @see Formatter.toUpperFirst **/
  describe('"toUpperFirst"', () => {
    it('should return the string with the first letter to upper case', () => {
      let upper = Formatter.toUpperFirst('test');

      expect(upper).to.be.a('string');
      expect(upper).to.equal('Test');
    });
  });

  /** @see Formatter.camelToUnderscore **/
  describe('"camelToUnderscore"', () => {
    it('should return CamelCase to under_score', () => {
      let underscore = Formatter.camelToUnderscore('SomeString');

      expect(underscore).to.equal('some_string');
    });
  });

  /** @see Formatter.dashToCamel **/
  describe('"dashToCamel"', () => {
    it('should return dash-case to CamelCase', () => {
      let camel = Formatter.dashToCamel('some-string');

      expect(camel).to.equal('someString');
    });
  });

  /** @see Formatter.underscoreToDash **/
  describe('"underscoreToDash"', () => {
    it('should return under_score to dash-case', () => {
      let dash = Formatter.underscoreToDash('some_string');

      expect(dash).to.equal('some-string');
    });
  });

  /** @see Formatter.camelToDash **/
  describe('"camelToDash"', () => {
    it('should return CamelCase to dash-case', () => {
      let dash = Formatter.camelToDash('SomeString');

      expect(dash).to.equal('some-string');
    });
  });

  /** @see Formatter.dashToUnderscore **/
  describe('"dashToUnderscore"', () => {
    it('should return dash-case to under_score', () => {
      let underscore = Formatter.dashToUnderscore('some-string');

      expect(underscore).to.equal('some_string');
    });
  });

  /** @see Formatter.underscoreToCamel **/
  describe('"underscoreToCamel"', () => {
    it('should return under_score to CamelCase', () => {
      let camel = Formatter.underscoreToCamel('some_string');

      expect(camel).to.equal('someString');
    });
  });

  /** @see Formatter.underscoreToWhitespace **/
  describe('"underscoreToWhitespace"', () => {
    it('should return under_score to white space', () => {
      let whitespace = Formatter.underscoreToWhitespace('some_string');

      expect(whitespace).to.equal('some string');
    });
  });
});