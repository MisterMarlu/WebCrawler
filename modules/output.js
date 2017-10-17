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
    this.writeWithSpace('Name of this log file: ' + info.name + '.log');
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

    this.writeOutput(sentences);
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

    this.writeOutput(sentences);
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
   */
  this.write = function (string) {
    this.logger.write(string + "\n");
    console.log(string);
  };

  /**
   * Write output with a break before.
   *
   * @param string: string
   */
  this.writeLine = function (string) {
    this.logger.write("\n");
    this.logger.write(string + "\n");

    console.log();
    console.log(string);
  };

  /**
   * Write output with a break after.
   *
   * @param string: string
   */
  this.writeWithSpace = function (string) {
    this.logger.write(string + "\n");
    this.logger.write("\n");

    console.log(string);
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
   */
  this.writeOutput = function (sentences) {
    this.writeLine(sentences[0]);

    for (var i = 1; i < sentences.length; i += 1) {
      this.write(sentences[i]);
    }
  };

  this.initLogger();

  return this;
};