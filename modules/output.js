/**
 * Import modules.
 */
const fs = require('fs');

/**
 * Module output
 *
 * @returns {module}
 */
module.exports = function () {
  this.logger = null;

  this.types = ['write', 'writeLine', 'writeWithSpace'];

  /**
   * Init the logfile.
   */
  this.initLogger = function () {
    var name = 'crawler-1';
    var path = 'logs/' + name + '.log';
    // Generate name and path of the logfile.
    var info = this.checkLogFile(name, path);

    this.logger = fs.createWriteStream(info.path, {flags: 'a'});
    this.write('Name of this log file: ' + info.name + '.log', true, 'success');
  };

  /**
   * Generate name and path of the logfile.
   *
   * @param name: {string}
   * @param path: {string}
   * @returns {{name: string, path: string}}
   */
  this.checkLogFile = function (name, path) {
    if (!fs.existsSync(path)) {
      return {
        name: name,
        path: path
      };
    }

    var nameArray = name.split('-');
    var number = parseInt(nameArray[(nameArray.length - 1)]);
    nameArray[(nameArray.length - 1)] = (number + 1);
    name = nameArray.join('-');
    path = 'logs/' + name + '.log';

    return this.checkLogFile(name, path);
  };

  /**
   * Default output when page limit is reached.
   *
   * @param numPages: {int}
   * @param numLinksAb: {int}
   * @param numLinksRel: {int}
   * @param numErrors: {int}
   */
  this.pageLimitOut = function (numPages, numLinksAb, numLinksRel, numErrors) {
    var sentences = [
      this.sprintf('Reached max limit of number of pages to visit. (Pages: %s)', numPages)
    ];

    // Add default ending information.
    sentences = sentences.concat(this.getEndSentences(numLinksAb, numLinksRel, numErrors));

    this.writeOutput(sentences, 'warning');
  };

  /**
   * Default output when no more websites are available.
   *
   * @param numPages: {int}
   * @param numLinksAb: {int}
   * @param numLinksRel: {int}
   * @param numErrors: {int}
   */
  this.lastPageOut = function (numPages, numLinksAb, numLinksRel, numErrors) {
    var sentences = [
      this.sprintf('No more pages to visit. (Pages: %s)', numPages)
    ];

    // Add default ending information.
    sentences = sentences.concat(this.getEndSentences(numLinksAb, numLinksRel, numErrors));

    this.writeOutput(sentences, 'success');
  };

  /**
   * Simple version of a adaptive function from php.
   * @see http://php.net/manual/en/function.sprintf.php
   *
   * @param format: {string}
   * @returns {string}
   */
  this.sprintf = function (format) {
    for (var i = 1; i < arguments.length; i += 1) {
      format = format.replace(/%s/, arguments[i]);
    }

    return format;
  };

  /**
   * Write output.
   *
   * @param value: {*}
   * @param toBash?: {boolean}
   * @param type?: {string}
   */
  this.write = function (value, toBash, type) {
    if (typeof value === 'object') {
      // Doesn't work for a logfile. ToDo: Find another way to write an object to logfile.
      this.logger.write(value.toString() + "\n");
    } else {
      this.logger.write(value + "\n");
    }

    if (typeof toBash === 'undefined' || toBash === false) {
      return;
    }

    if (typeof type === 'undefined' || type === '') {
      console.log(value);
      return;
    }

    console.log(this.getColor(type), value);
  };

  /**
   * Write output with a break before.
   *
   * @param value: {*}
   * @param toBash?: {boolean}
   * @param type?: {string}
   */
  this.writeLine = function (value, toBash, type) {
    this.logger.write("\n");

    if (typeof value === 'object') {
      // Doesn't work for a logfile. ToDo: Find another way to write an object to logfile.
      this.logger.write(value.toString() + "\n");
    } else {
      this.logger.write(value + "\n");
    }

    if (typeof toBash === 'undefined' || toBash === false) {
      return;
    }

    console.log();

    if (typeof type === 'undefined' || type === '') {
      console.log(value);
      return;
    }

    console.log(this.getColor(type), value);
  };

  /**
   * Write output with a break after.
   *
   * @param value: {*}
   * @param toBash?: {boolean}
   * @param type?: {string}
   */
  this.writeWithSpace = function (value, toBash, type) {
    if (typeof value === 'object') {
      // Doesn't work for a logfile. ToDo: Find another way to write an object to logfile.
      this.logger.write(value.toString() + "\n");
    } else {
      this.logger.write(value + "\n");
    }

    this.logger.write("\n");

    if (typeof toBash === 'undefined' || toBash === false) {
      return;
    }

    if (typeof type === 'undefined' || type === '') {
      console.log(value);
      console.log();
      return;
    }

    console.log(this.getColor(type), value);
    console.log();
  };

  /**
   * Get default ending information.
   *
   * @param numLinksAb: {int}
   * @param numLinksRel: {int}
   * @param numErrors: {int}
   * @returns {Array}
   */
  this.getEndSentences = function (numLinksAb, numLinksRel, numErrors) {
    return [
      this.sprintf('Found absolute links total: %s', numLinksAb),
      this.sprintf('Found relative links total: %s', numLinksRel),
      this.sprintf('Found links total: %s', (numLinksAb + numLinksRel)),
      this.sprintf('Errors total: %s', numErrors)
    ];
  };

  /**
   * Write array as strings with new line for each entry.
   *
   * @param sentences: {Array}
   * @param type: {string}
   */
  this.writeOutput = function (sentences, type) {
    this.writeLine(sentences[0], true, type);

    for (var i = 1; i < sentences.length; i += 1) {
      this.write(sentences[i], true);
    }
  };

  /**
   * Get colored command line output.
   *
   * @param type: {string}
   * @returns {string}
   */
  this.getColor = function (type) {
    var colors = {
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
      BgWhite: "\x1b[47m"
    };

    if (colors.hasOwnProperty(type)) {
      return colors[type] + '%s' + colors.reset;
    }
  };

  // Init logger to write all outputs into a logfile.
  this.initLogger();

  return this;
};