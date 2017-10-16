/**
 * @author lbraun
 * @date 16.10.2017
 * @licence MIT
 */

const commands = require('minimist')(process.argv.slice(2));
const Crawler = require('./modules/crawler')(commands);

Crawler.crawl();
