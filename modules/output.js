/**
 * @author lbraun
 * @date 16.10.2017
 * @licence MIT
 */

module.exports = function () {
  this.pageLimitOut = function (numPages, numLinksAb, numLinksRel, numErrors) {
    var sentences = [
      this.sprintf('Reached max limit of number of pages to visit. (Pages: %s)', numPages)
    ];

    sentences = sentences.concat(this.getEndSentences(numLinksAb, numLinksRel, numErrors));

    this.writeOutput(sentences);
  };

  this.lastPageOut = function (numPages, numLinksAb, numLinksRel, numErrors) {
    var sentences = [
      this.sprintf('No more pages to visit. (Pages: %s)', numPages)
    ];

    sentences = sentences.concat(this.getEndSentences(numLinksAb, numLinksRel, numErrors));

    this.writeOutput(sentences);
  };

  this.sprintf = function (format) {
    for (var i = 1; i < arguments.length; i += 1) {
      format = format.replace(/%s/, arguments[i]);
    }

    return format;
  };

  this.write = function (string) {
    console.log(string);
  };

  this.writeLine = function (string) {
    console.log();
    console.log(string);
  };

  this.getEndSentences = function (numLinksAb, numLinksRel, numErrors) {
    return [
      this.sprintf('Found absolute links total: %s', numLinksAb),
      this.sprintf('Found relative links total: %s', numLinksRel),
      this.sprintf('Found links total: %s', (numLinksAb + numLinksRel)),
      this.sprintf('Errors total: ', numErrors)
    ];
  };

  this.writeOutput = function (sentences) {
    this.writeLine(sentences[0]);

    for (var i = 1; i < sentences.length; i += 1) {
      this.write(sentences[i]);
    }
  };

  return this;
};