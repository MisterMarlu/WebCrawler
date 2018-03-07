// Get commands from console.
const commands = require('minimist')(process.argv.slice(2)),
// Import WebCrawler.
  {WebCrawler} = require(`${__dirname}/%crawlerDirName%`);

// Create WebCrawler instance.
let crawler = new WebCrawler(__dirname, commands);

// Start the crawling process.
crawler.crawl();