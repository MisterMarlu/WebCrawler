/**
 * Globals.
 */
let instance = {},
  moduleName = 'Global';

/**
 * Global constructor.
 *
 * @returns {Global}
 * @constructor
 */
let Global = function () {
  if (!this instanceof Global) return new Global();
  if (instance instanceof Global) return instance;
  instance = this;

  return this;
};

/**
 * Get any parameter.
 *
 * @param parameter: {string}
 * @returns {*}
 */
Global.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return null;

  return this[parameter];
};

/**
 * Set any parameter.
 *
 * @param parameter: {string}
 * @param value
 * @returns {*}
 */
Global.prototype.set = function (parameter, value) {
  this[parameter] = value;

  return this;
};

exports.Global = new Global();