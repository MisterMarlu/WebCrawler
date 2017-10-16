/**
 * Module output
 *
 * @returns {module}
 */
module.exports = function () {
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
    console.log(string);
  };

  /**
   * Write output with a break before.
   *
   * @param string: string
   */
  this.writeLine = function (string) {
    console.log();
    console.log(string);
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
      this.sprintf('Errors total: ', numErrors)
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

  return this;
};