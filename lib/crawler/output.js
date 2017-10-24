exports.getCustomerInfo = function () {
  let i = 0,
    web = {
      no: [],
      other: [],
      rto: [],
      hasError: []
    };

  for (i = 0; i < this.customers.withoutWebsite.length; i += 1) {
    web.no.push(this.customers.withoutWebsite[i]);
  }

  for (i = 0; i < this.customers.withWebsite.length; i += 1) {
    let type = (this.customers.withWebsite[i].rto === true) ? 'rto' : 'other';
    type = (this.customers.withWebsite[i].hasError === true) ? 'hasError' : type;

    web[type].push(this.customers.withWebsite[i]);
  }

  this.output.writeLine(`No website: ${web.no.length}`, this.debug);
  for (i = 0; i < web.no.length; i += 1) {
    this.output.write(`${(i + 1)}:`, this.debug);
    this.output.write(`Link: ${web.no[i]}`, this.debug);
  }

  this.output.writeLine(`Other website: ${web.other.length}`, this.debug);
  for (i = 0; i < web.other.length; i += 1) {
    this.output.write(`${i + 1}:`, this.debug);
    this.output.write(`Link: ${web.other[i].url}`, this.debug);
    this.output.write(`Website: ${web.other[i].website}`, this.debug);
    this.output.write(`Imprint: ${web.other[i].imprint}`, this.debug);
  }

  this.output.writeLine(`RTO website: ${web.rto.length}`, this.debug);
  for (i = 0; i < web.rto.length; i += 1) {
    this.output.write(`${i + 1}:`, this.debug);
    this.output.write(`Link: ${web.rto[i].url}`, this.debug);
    this.output.write(`Website: ${web.rto[i].website}`, this.debug);
    this.output.write(`Imprint: ${web.rto[i].imprint}`, this.debug);
  }

  this.output.writeLine(`Websites with error: ${web.hasError.length}`, this.debug);
  for (i = 0; i < web.hasError.length; i += 1) {
    this.output.write(`${i + 1}:`, this.debug);
    this.output.write(`Link: ${web.hasError[i].url}`, this.debug);
    this.output.write(`Website: ${web.hasError[i].website}`, this.debug);
  }

  this.output.writeLine(`No website: ${web.no.length}`, true);
  this.output.writeLine(`Other website: ${web.other.length}`, true);
  this.output.writeLine(`RTO website: ${web.rto.length}`, true);
  let webErrorColor = '';
  if (web.hasError.length > 0) {
    webErrorColor = (web.hasError.length >= parseInt(this.pageLimit / 50)) ? 'error' : 'warning';
  }

  this.output.writeLine(`Websites with error: ${web.hasError.length}`, true, webErrorColor);
};

exports.getUserInput = function () {
  this.output.writeLine('User input:', true);

  for (let name in this.commands) {
    if (this.commands.hasOwnProperty(name)) {
      let isDefault = (this.commands[name] === this.defaultArgs[name]),
        string = (isDefault) ? ' (default)' : '',
        color = (isDefault) ? 'default' : '';
      this.output.write(`${name}: ${this.commands[name]}${string}`, true, color);
    }
  }
};

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

  if (this.pageLimit !== 0) {
    timeColor = 'error';
    for (let type in ratio) {
      if (ratio.hasOwnProperty(type)) {
        let exSeconds = (this.pageLimit / 100 * ratio[type].seconds); // Get seconds from ratio.
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

  let time = this.parseTime(ms),
    timeString = `${time.d} days, ${time.h}:${time.m}:${time.s}`;

  this.output.write(timeString, true, timeColor);

  if (expectations.length > 0) {
    let etn = this.parseTime((expectations[(expectations.length - 1)] * 1000)),
      etnString = `(Expected: ${etn.d} days, ${etn.h}:${etn.m}:${etn.s})`;
    this.output.write(etnString, true, 'comment');

    if (expectations.length > 1) {
      let etb = this.parseTime((expectations[0] * 1000)),
        etbString = `(Expected: ${etb.d} days, ${etb.h}:${etb.m}:${etb.s})`;
      this.output.write(etbString, true, 'comment');
    }
  }
};

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

exports.numErrors = function () {
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