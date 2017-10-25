/**
 * Import modules.
 */
const commands = require('minimist')(process.argv.slice(2));

/**
 * Import custom modules.
 */
const Crawler = require('./lib/crawler').Crawler;

/**
 * Script that would be executed by command line. Use following syntax:
 * node [filename].js --key=value
 *
 * Read the readme.md file to get all available parameters.
 */

// Init crawler.
let crawler = new Crawler(commands);

// Start crawling.
crawler.start();