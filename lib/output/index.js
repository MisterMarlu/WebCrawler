/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Output constructor.
 *
 * @returns {Output}
 * @constructor
 */
let Output = function () {
  if (!this instanceof Output) return new Output();
};

/**
 * Parameters.
 */
Output.prototype.logger = null;

/**
 * Methods.
 */

Output.prototype.write = function (value, print, type) {
  if (typeof value === 'object') {
    this.logger.write(JSON.stringify(value) + "\r\n");
  } else {
    this.logger.write(value + "\r\n");
  }

  if (typeof print === 'undefined' || !print) return;

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    return;
  }

  console.log(this.getColor(type), value);
};

Output.prototype.writeLine = function (value, print, type) {
  this.logger.write("\r\n");

  if (typeof value === 'object') {
    this.logger.write(JSON.stringify(value) + "\r\n");
  } else {
    this.logger.write(value + "\r\n");
  }

  if (typeof print === 'undefined' || !print) return;

  console.log();

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    return;
  }

  console.log(this.getColor(type), value);
};

Output.prototype.writeWithSpace = function (value, print, type) {
  if (typeof value === 'object') {
    this.logger.write(JSON.stringify(value) + "\r\n");
  } else {
    this.logger.write(value + "\r\n");
  }

  this.logger.write("\r\n");

  if (typeof print === 'undefined' || !print) return;

  if (typeof type === 'undefined' || type.length < 1) {
    console.log(value);
    console.log();
    return;
  }

  console.log(this.getColor(type), value);
  console.log();
};

Output.prototype.writeOutput = function (sentences, type) {
  this.writeLine(sentences[0], true, type);

  for (let i = 1; i < sentences.length; i += 1) {
    this.write(sentences[i], true);
  }
};

Output.prototype.getColor = function (type) {
  let colors = {
    reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    error: "\x1b[31m",
    success: "\x1b[32m",
    warning: "\x1b[33m",
    FgBlue: "\x1b[34m",
    default: "\x1b[35m",
    debug: "\x1b[36m",
    FgWhite: "\x1b[37m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",

    comment: "\x1b[90m"
  };

  if (colors.hasOwnProperty(type)) {
    return colors[type] + '%s' + colors.reset;
  }
};

Output.prototype.pageLimit = function () {
  if (arguments.length < 5) {
    throw 'Output.pageLimit: Too few arguments. See in documentation.';
  }

  let sentences = [
    `Reached max limit of number of pages to visit. (${arguments[0]} pages)`
  ];

  arguments.shift();
  sentences = sentences.concat(this.getEndSentences.call(this, arguments));

  this.writeOutput(sentences, 'warning');
};

Output.prototype.lastPage = function () {
  if (arguments.length < 5) {
    throw 'Output.pageLimit: Too few arguments. See in documentation.';
  }

  let sentences = [
    `No more pages to visit. (${arguments[0]} pages)`
  ];

  arguments.shift();
  sentences = sentences.concat(this.getEndSentences.call(this, arguments));

  this.writeOutput(sentences, 'success');
};

Output.prototype.getEndSentences = function () {
  if (arguments.length < 4) {
    throw 'Output.getEndSentences: Too few arguments. See in documentation.';
  }

  let endingInformation = [
    `Found absolute links total: ${arguments[0]}`,
    `Found relative links total: ${arguments[1]}`,
    `Found links total: ${arguments[2]}`,
    `Errors total: ${arguments[3]}`
  ];

  if (typeof arguments[4] === 'boolean' && arguments[4]) {
    endingInformation.splice(3, 0, `Screenshots total: ${arguments[4]}`);
  }

  return endingInformation;
};

Output.prototype.initLogger = function (name) {
  if (typeof name === 'undefined') name = 'crawler-1';

  let path = `logs/${name}.log`,
    info = checkLogFile(name, path);

  this.logger = fs.createWriteStream(info.path, {flags: 'a'});
  this.write(`Name of this log file: ${info.name}.log`, true, 'success');
};

/**
 * Private methods.
 */
function checkLogFile(name, path) {
  if (!fs.existsSync(path)) {
    return {
      name: name,
      path: path,
    };
  }

  let nameArray = name.split('-'),
    number = parseInt(nameArray[(nameArray.length - 1)]);

  nameArray[(nameArray.length - 1)] = (number + 1);
  name = nameArray.join('-');
  path = 'logs/' + name + '.log';

  return checkLogFile(name, path);
}

exports.Output = Output;