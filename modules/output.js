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

  this.initLogger = function () {
    var name = 'crawler-1';
    var path = 'logs/' + name + '.log';
    var info = this.checkLogFile(name, path);

    this.logger = fs.createWriteStream(info.path, {flags: 'a'});
    this.writeWithSpace('Name of this log file: ' + info.name + '.log', 'success');
  };

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
   * @param numPages: int
   * @param numLinksAb: int
   * @param numLinksRel: int
   * @param numErrors: int
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
   * @param numPages: int
   * @param numLinksAb: int
   * @param numLinksRel: int
   * @param numErrors: int
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
   *
   * @param format: string
   * @returns {*}
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
   * @param string: string
   * @param type?: string
   */
  this.write = function (string, type) {
    this.logger.write(string + "\n");

    if (typeof type !== 'string' || type === '') {
      console.log(string);
    } else {
      console.log(this.getColor(type), string);
    }
  };

  /**
   * Write output with a break before.
   *
   * @param string: string
   * @param type?: string
   */
  this.writeLine = function (string, type) {
    this.logger.write("\n");
    this.logger.write(string + "\n");

    console.log();

    if (typeof type !== 'string' || type === '') {
      console.log(string);
    } else {
      console.log(this.getColor(type), string);
    }
  };

  /**
   * Write output with a break after.
   *
   * @param string: string
   * @param type?: string
   */
  this.writeWithSpace = function (string, type) {
    this.logger.write(string + "\n");
    this.logger.write("\n");

    if (typeof type !== 'string' || type === '') {
      console.log(string);
    } else {
      console.log(this.getColor(type), string);
    }

    console.log();
  };

  /**
   * Get default ending information.
   *
   * @param numLinksAb: int
   * @param numLinksRel: int
   * @param numErrors: int
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
   * @param sentences: Array
   * @param type: string
   */
  this.writeOutput = function (sentences, type) {
    this.writeLine(sentences[0], type);

    for (var i = 1; i < sentences.length; i += 1) {
      this.write(sentences[i]);
    }
  };

  /**
   * Get colored command line output.
   *
   * @param type: string
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
      FgMagenta: "\x1b[35m",
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

  this.initLogger();

  return this;
};