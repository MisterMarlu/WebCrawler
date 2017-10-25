/**
 * Import modules.
 */
const commands = require('minimist')(process.argv.slice(2));

/**
 * Import custom modules.
 */
const Crawler = require('./modules/crawler')(commands);

/**
 * Script that would be executed by command line. Use following syntax:
 * node [filename].js --key=value
 *
 * Read the readme.md file to get all available parameters.
 */

// Start crawling.
Crawler.crawl(true);
