/**
 * This script is for testing simple things like functions, so the crawler doesn't have to
 * crawl through any website. Mush faster, yeah!
 */

// const commands = require('minimist')(process.argv.slice(2));
const Crawler = require('./lib/crawler').Crawler;

let commands = {
  startUrl: 'http://www.ladies.de',
  pageLimit: '20',
  debug: 'true',
  screenshots: 'false'
};

let crawler = new Crawler(commands);
crawler.start();