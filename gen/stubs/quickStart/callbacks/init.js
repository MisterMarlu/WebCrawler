/**
 * Callback for initiation.
 *
 * @async
 * @param {WebCrawler} crawler The WebCrawler instance.
 * @param {object} options The options for the webcrawler.
 * @param {string} [options.startUrl=https://www.phpdoc.org/] The url you are starting from.
 * @param {number} [options.pageLimit=0] The limit of pages to crawl. 0 will be infinite.
 * @param {number} [options.debug=0] Turn on/off the debug mode.
 * @param {string} [options.debugModule=] Specify a module to debug. If empty and debug is on, all modules will be debugged.
 * @param {number} [options.screenShots=0] Turn on/of the function to create screenshots.
 * @returns {Promise} Returns an empty Promise.
 */
async function initCallback(crawler, options) {
  %%loop=ModuleName;
  if (crawler.%ModuleName%.hasOwnProperty('init') && typeof crawler.%ModuleName%.init === 'function') {
    await crawler.%ModuleName%.init(crawler, options);
  }

  %%endloop
  crawler.startCrawling();
}