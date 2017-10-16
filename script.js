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
 * node script.js --key=value --key=value
 */

// Start crawling.
Crawler.crawl();
