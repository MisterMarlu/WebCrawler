/**
 * Callback for doing screenshots.
 *
 * @async
 * @param {object} commands The options for the webcrawler.
 * @param {string} [commands.startUrl=https://www.phpdoc.org/] The url you are starting from.
 * @param {number} [commands.pageLimit=0] The limit of pages to crawl. 0 will be infinite.
 * @param {number} [commands.debug=0] Turn on/off the debug mode.
 * @param {string} [commands.debugModule=] Specify a module to debug. If empty and debug is on, all modules will be debugged.
 * @param {number} [commands.screenShots=0] Turn on/of the function to create screenshots.
 * @returns {Promise} Returns an empty Promise.
 */
async function screenshotCallback(commands) {
  // Some logic here.
}