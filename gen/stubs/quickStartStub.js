// Get commands from console.
const commands = require('minimist')(process.argv.slice(2)),

// Import WebCrawler.
  WebCrawler = require(`${__dirname}/%crawlerDirName%`);

// Create WebCrawler instance.
let crawler = new WebCrawler.Main(__dirname, commands);

%sectionAddModules%
%sectionCallbacks%
%sectionSetCallback%
// Start the crawling process.
crawler.crawl();