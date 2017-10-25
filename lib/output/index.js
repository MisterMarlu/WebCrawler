/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Necessary variables.
 */
let instance = {};

/**
 * Output constructor.
 *
 * @returns {Output}
 * @constructor
 */
let Output = function () {
  if (!this instanceof Output) return new Output();
  if (instance instanceof Output) return instance;

  instance = this;

  return this;
};

/**
 * Parameters.
 */
Output.prototype.logger = null;

/**
 * Write output.
 *
 * @param value: {*}
 * @param print?: {boolean}
 * @param type?: {string}
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

/**
 * Write output with a new line before.
 *
 * @param value: {*}
 * @param print?: {boolean}
 * @param type?: {string}
 */
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

/**
 * Write output with a trailing new line.
 *
 * @param value: {*}
 * @param print?: {boolean}
 * @param type?: {string}
 */
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

/**
 * Write array as strings with new line for each entry.
 *
 * @param sentences: {Array}
 * @param type: {string}
 */
Output.prototype.writeOutput = function (sentences, type) {
  this.writeLine(sentences[0], true, type);

  for (let i = 1; i < sentences.length; i += 1) {
    this.write(sentences[i], true);
  }
};

/**
 * Get colored command line output.
 *
 * @param type: {string}
 * @returns {string}
 */
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

/**
 * Default output when page limit is reached.
 *
 * param numPages: {int}
 * param numLinksAb: {int}
 * param numLinksRel: {int}
 * param numErrors: {int}
 * param numScreenshots: {int}
 * param screenshots?: {boolean}
 */
Output.prototype.pageLimit = function () {
  if (arguments.length < 5) {
    throw `Output.pageLimit: Too few arguments (${arguments.length}). See in documentation.`;
  }

  let sentences = [
    `Reached max limit of number of pages to visit. (${arguments[0]} pages)`
  ];

  this.writeEnd(arguments, sentences, 'warning');
};

/**
 * Default output when no more websites are available.
 *
 * param numPages: {int}
 * param numLinksAb: {int}
 * param numLinksRel: {int}
 * param numErrors: {int}
 * param numScreenshots: {int}
 * param screenshots?: {boolean}
 */
Output.prototype.lastPage = function () {
  if (arguments.length < 5) {
    throw `Output.lastPage: Too few arguments (${arguments.length}). See in documentation.`;
  }

  let sentences = [
    `No more pages to visit. (${arguments[0]} pages)`
  ];

  this.writeEnd(arguments, sentences, 'success');
};

/**
 * Write the ending stuff.
 *
 * @param args: {{}}
 * @param sentences: {array}
 * @param color: {string}
 */
Output.prototype.writeEnd = function (args, sentences, color) {
  let information = [];
  for (let i = 1; i < args.length; i += 1) {
    information.push(args[i]);
  }

  sentences = sentences.concat(this.getEndSentences(information));

  this.writeOutput(sentences, color);
};

/**
 * Get default ending information.
 *
 * param numLinksAb: {int}
 * param numLinksRel: {int}
 * param numErrors: {int}
 * param numScreenshots?: {int}
 * param screenshots?: {boolean}
 * @returns {Array}
 */
Output.prototype.getEndSentences = function (args) {
  if (args.length < 3) {
    throw `Output.getEndSentences: Too few arguments (${args.length}). See in documentation.`;
  } else if (args.length === 4) {
    throw `Output.getEndSentences: Too few or too much arguments (${args.length}). See in documentation.`;
  }

  let endingInformation = [
    `Found absolute links total: ${args[0]}`,
    `Found relative links total: ${args[1]}`,
    `Found links total: ${(args[0] + args[1])}`,
    `Errors total: ${args[2]}`
  ];

  if (typeof args[4] === 'boolean' && args[4]) {
    endingInformation.splice(3, 0, `Screenshots total: ${args[3]}`);
  }

  return endingInformation;
};

/**
 * Init the log file.
 *
 * @param name?: {string} Name of the log file. Needs a number at the end (e.g. "logfile-1").
 */
Output.prototype.initLogger = function (name) {
  if (typeof name === 'undefined') name = 'crawler-1';

  let path = `logs/${name}.log`,
    info = checkLogFile(name, path);

  this.logger = fs.createWriteStream(info.path, {flags: 'a'});
  this.write(`Name of this log file: ${info.name}.log`, true, 'success');
};

/**
 * Generate name and path of the logfile.
 *
 * @param name: {string}
 * @param path: {string}
 * @returns {{name: string, path: string}}
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