/**
 * Import modules.
 */
const URL = require('url-parse'),
  queryString = require('query-string');

/**
 * Parse milliseconds to object or array with days, hours, minutes and seconds.
 *
 * @param ms: {int}
 * @param asArray?: {boolean}
 * @returns {{d: int, h: int, m: int, s: int} || [int, int, int, int]}
 */
exports.parseTime = function (ms, asArray) {
  if (typeof asArray === 'undefined') {
    asArray = false;
  }

  let time = {
    d: 0,
    h: 0,
    m: 0,
    s: 0
  };

  let seconds = ms / 1000;
  time.s = parseInt(seconds % 60);
  time.s = (time.s < 10) ? `0${time.s}` : time.s;

  let minutes = seconds / 60;
  time.m = parseInt(minutes % 60);
  time.m = (time.m < 10) ? `0${time.m}` : time.m;

  let hours = minutes / 60;
  time.h = parseInt(hours % 24);
  time.h = (time.h < 10) ? `0${time.h}` : time.h;

  let days = hours / 24;
  time.d = parseInt(days);

  if (!asArray) {
    return time;
  }

  return Object.keys(time).map(function (t) {
    return parseInt(time[t]);
  });
};

/**
 * Converts the first letter of a string to upper case.
 *
 * @param string: {string}
 * @returns {string}
 */
exports.toUpperFirst = function (string) {
  if (typeof string !== 'string') {
    throw `The parameter must be type of "string", given is type of "${typeof string}"`;
  }

  return string.charAt(0).toUpperCase() + string.slice(1);
};