/**
 * Parse milliseconds to object or array with days, hours, minutes and seconds.
 *
 * @param ms: {int}
 * @param asArray?: {boolean}
 * @returns {{d: int, h: int, m: int, s: int} || [int, int, int, int]}
 */
exports.parseTime = function (ms, asArray) {
  if (typeof asArray === 'undefined') asArray = false;

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

  if (!asArray) return time;

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

/**
 * Converts the data of the input object into correct types.
 *
 * @param input: {{}}
 * @returns {{}}
 */
exports.parseInput = function (input) {
  for (let key in input) {
    if (!input.hasOwnProperty(key)) continue;

    let num = 0;

    if (/^\d+$/.test(input[key])) {
      num = input[key];
      input[key] = 0;
    }

    switch (input[key]) {
      case 'true':
      case 'false':
        input[key] = (input[key] === 'true');
        break;
      case 0:
        input[key] = parseInt(num);
        break;
    }
  }

  return input;
};

/**
 * Check if debug mode is enabled for specific module.
 *
 * @param debug
 * @param moduleName: {string}
 * @returns {boolean}
 */
exports.isDebug = function (debug, moduleName) {
  return (debug === true || debug === moduleName);
};