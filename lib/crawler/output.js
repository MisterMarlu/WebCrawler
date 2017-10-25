/**
 * Import custom modules.
 */
const Output = require('../output').Output;
const {parseTime} = require('../parser');

/**
 * Necessary variables.
 */
let output = new Output();

/**
 * Print customer/post information.
 */
exports.getCustomerInfo = function () {
  let i = 0,
    web = {
      no: [],
      other: [],
      rto: [],
      hasError: []
    },
    webErrorColor = '';

  for (i = 0; i < this.customers.withoutWebsite.length; i += 1) {
    web.no.push(this.customers.withoutWebsite[i]);
  }

  for (i = 0; i < this.customers.withWebsite.length; i += 1) {
    let type = (this.customers.withWebsite[i].rto === true) ? 'rto' : 'other';
    type = (this.customers.withWebsite[i].hasError === true) ? 'hasError' : type;

    web[type].push(this.customers.withWebsite[i]);
  }

  if (web.hasError.length > 0) {
    webErrorColor = (web.hasError.length >= parseInt(this.numVisited / 50)) ? 'error' : 'warning';
  }

  output.writeLine(`No website: ${web.no.length}`, this.debug);
  for (i = 0; i < web.no.length; i += 1) {
    output.write(`${(i + 1)}:`, this.debug);
    output.write(`Link: ${web.no[i]}`, this.debug);
  }

  output.writeLine(`Other website: ${web.other.length}`, this.debug);
  for (i = 0; i < web.other.length; i += 1) {
    output.write(`${i + 1}:`, this.debug);
    output.write(`Link: ${web.other[i].url}`, this.debug);
    output.write(`Website: ${web.other[i].website}`, this.debug);
    output.write(`Imprint: ${web.other[i].imprint}`, this.debug);
  }

  output.writeLine(`RTO website: ${web.rto.length}`, this.debug);
  for (i = 0; i < web.rto.length; i += 1) {
    output.write(`${i + 1}:`, this.debug);
    output.write(`Link: ${web.rto[i].url}`, this.debug);
    output.write(`Website: ${web.rto[i].website}`, this.debug);
    output.write(`Imprint: ${web.rto[i].imprint}`, this.debug);
  }

  output.writeLine(`Websites with error: ${web.hasError.length}`, this.debug);
  for (i = 0; i < web.hasError.length; i += 1) {
    output.write(`${i + 1}:`, this.debug);
    output.write(`Link: ${web.hasError[i].url}`, this.debug);
    output.write(`Website: ${web.hasError[i].website}`, this.debug);
  }

  output.writeLine('Found websites:', true, 'underscore');
  output.write(`No website: ${web.no.length}`, true);
  output.write(`Other website: ${web.other.length}`, true, 'black', 'green');
  output.write(`RTO website: ${web.rto.length}`, true, 'black', 'yellow');
  output.write(`Websites with error: ${web.hasError.length}`, true, webErrorColor);
};

/**
 * Print user inputs.
 */
exports.getUserInput = function () {
  output.writeLine('User input:', true, 'underscore');

  for (let name in this.commands) {
    if (this.commands.hasOwnProperty(name)) {
      let isDefault = (this.commands[name] === this.defaultArgs[name]),
        string = (isDefault) ? ' (default)' : '',
        color = (isDefault) ? 'default' : '';
      output.write(`${name}: ${this.commands[name]}${string}`, true, color);
    }
  }
};

/**
 * Stops execution time and print readable time.
 *
 * @param delay?: {int}
 */
exports.getReadableTime = function (delay) {
  if (typeof delay === 'undefined') {
    delay = 2000;
  }

  delay = (delay < 2000) ? 2000 : delay;
  delay /= 1000;

  let ratio = {
      success: {
        pages: 100,
        seconds: 5
      },
      warning: {
        pages: 100,
        seconds: 10
      }
    },
    ms = new Date() - this.startTime,
    timeColor = '',
    expectations = [];

  if (this.numVisited !== 0) {
    timeColor = 'error';
    for (let type in ratio) {
      if (ratio.hasOwnProperty(type)) {
        let exSeconds = (this.numVisited / 100 * ratio[type].seconds); // Get seconds from ratio.
        exSeconds *= 1.05; // Add tolerance.
        exSeconds += delay; // Add delay.
        expectations[expectations.length] = parseInt(exSeconds);
        let tmpUsedSeconds = parseInt(ms / 1000);

        if (tmpUsedSeconds <= expectations[(expectations.length - 1)]) {
          timeColor = type;
          break;
        }
      }
    }
  }

  let time = parseTime(ms),
    timeString = `${time.d} days, ${time.h}:${time.m}:${time.s}`;

  output.write(timeString, true, timeColor);

  if (expectations.length > 0) {
    let etn = parseTime((expectations[(expectations.length - 1)] * 1000)),
      etnString = `(Expected: ${etn.d} days, ${etn.h}:${etn.m}:${etn.s})`;
    output.write(etnString, true, 'comment');

    if (expectations.length > 1) {
      let etb = parseTime((expectations[0] * 1000)),
        etbString = `(Expected: ${etb.d} days, ${etb.h}:${etb.m}:${etb.s})`;
      output.write(etbString, true, 'comment');
    }
  }
};

/**
 * Counts the number of total errors.
 *
 * @param status?: {string}
 * @returns {number}
 */
exports.numErrors = function (status) {
  let counter = 0;

  if (typeof status === 'undefined') {
    for (let tmpStatus in this.errorList) {
      if (this.errorList.hasOwnProperty(tmpStatus)) {
        counter += this.errorList[tmpStatus].length;
      }
    }

    return counter;
  }

  if (this.errorList.hasOwnProperty(status)) {
    counter = this.errorList[status].length;
  }

  return counter;
};