/**
 * Callback for outputting some information at the end of the log file.
 *
 * @param {string} reason The reason why the crawler has stopped the process.
 */
function outputCallback(reason) {
  crawler.output.writeLine(`Crawling process stopped because we reached the ${reason}.`, true, 'warning');

  // Maybe some custom outputs at the end of the crawling process?
}