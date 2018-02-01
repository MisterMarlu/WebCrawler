require(`${__dirname}/debugging`);

// Import modules.
const fs = require('fs'),
  URL = require('url-parse'),
  axios = require('axios'),
  cheerio = require('cheerio'),

  // Import custom modules.
  {Global} = require(`${__dirname}/global`),
  {DB} = require(`${__dirname}/db`),
  {Output} = require(`${__dirname}/output`),
  {parseTime} = require(`${__dirname}/parser`),
  {Helper} = require(`${__dirname}/helper`),
  {Module} = require(`${__dirname}/module`);

let instance = null,
  moduleName = 'Crawler';

/**
 * Class Crawler.
 */
class Crawler extends Module {

  /**
   * Crawler constructor.
   *
   * @returns {*}
   */
  constructor() {
    super();

    if (instance instanceof Crawler) return instance;
    if (!(this instanceof Crawler)) return new Crawler();

    Global.set('followingPages', []);
    this.defaultArgs = {};
    this.visited = {};
    this.numVisited = 0;
    this.url = {};
    this.baseUrl = '';
    this.linkList = {};
    this.errorList = {};
    this.startTime = new Date();
    this.lockFileName = '';
    this.output = new Output();
    this.DB = new DB();

    instance = this;
    return this;
  }

  /**
   * Initiate the crawling process.
   *
   * @returns {Promise<string|*>}
   */
  async start() {
    this.output.writeConsole(`${moduleName}.start - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    // Prevent multiple processes.
    if (this.hasLockFile()) return;

    this.url = new URL(Global.get('START_URL'));
    this.baseUrl = `${this.url.protocol}//${this.url.hostname}`;

    // ToDo: Optional db.
    Global.get('followingPages').push(Global.get('START_URL'));
    this.createLockFile();

    // Start timer and begin the crawling process.
    this.startTime = new Date();
    return await this.crawl();
  }

  /**
   * Write ending lines into the .log file, remove .lock file.
   */
  end() {
    this.output.writeConsole(`${moduleName}.end - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let finishDelay = parseInt(this.numVisited / 2);

    finishDelay = (finishDelay < 5000) ? 5000 : finishDelay;

    setTimeout(function () {
      this.output.writeUserInput(this);
      this.getReadableTime();
      this.output.logger.end();
      this.removeLockFile();
    }, finishDelay);
  }

  /**
   * Check if url already visited. If not, visit this url.
   *
   * @returns {Promise<*>}
   */
  async crawl() {
    this.output.writeConsole(`${moduleName}.crawl - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    // Page limit is reached, leave process.
    if (this.numVisited >= Global.get('PAGE_LIMIT') && Global.get('PAGE_LIMIT') !== 0) return 'page limit';

    // ToDo: Optional DB.
    let nextPage = Global.get('followingPages').pop();

    // Website already visited, continue with next.
    if (nextPage in this.visited) {
      this.output.write(`Url ${nextPage} already visited.`, Helper.isDebug(moduleName));
      return await this.crawl();
    }

    // No more websites available, leave process.
    if (typeof nextPage === 'undefined') return 'last page';

    return await this.visitPage(nextPage);
  }

  /**
   * Visit the url and let the customer search for whatever he want.
   *
   * @param url: String
   * @returns {Promise<*>}
   */
  async visitPage(url) {
    this.output.writeConsole(`${moduleName}.visitPage - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.increaseVisited(url);

    this.output.writeLine(`Visiting page ${url}`, Helper.isDebug(moduleName));
    this.output.write(`Visited pages: ${this.numVisited}`, true);

    // Make the request.
    await axios.get(url)
      .then(async response => {
        this.output.write(`Status: ${response.status}`, Helper.isDebug(moduleName));

        if (response.status !== 200) return this.crawl();

        // Reading the DOM.
        let $ = cheerio.load(response.data);

        // Call the search callback function so the customer can do everything he want.
        if (Helper.hasCallback('search')) {
          Helper.getCallback('search')($, url, Global.get('DEBUG'));
        }

        // Find all links to collect the next links to visit.
        this.collectLinks($);
      })
      .catch(error => {
        this.output.writeLine(`Error on url ${url}`, true, 'warning');

        if (typeof error.response !== 'undefined') {
          this.output.write(`Status: ${error.response.status}`, true, 'warning');
          this.output.writeWithSpace(`Status text: ${error.response.statusText}`, true, 'warning');

          if (typeof this.errorList[error.response.status] === 'undefined') {
            this.errorList[error.response.status] = [];
          }

          this.errorList[error.response.status].push(url);
        } else {
          // Oh no, something went wrong in the code :(
          this.output.write('Request was sent with no response.', true, 'error');

          if (Helper.isDebug(moduleName)) console.log(error);
        }
      });

    // Repeat.
    return this.crawl();
  }

  /**
   * Increase visited pages counter.
   *
   * @param url: String
   */
  increaseVisited(url) {
    this.output.writeConsole(`${moduleName}.increaseVisited - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    this.visited[url] = true;
    this.numVisited += 1;

    // Update starting url.
    let filter = {url: Global.get('START_URL')},
      update = {url: Global.get('START_URL'), num_visited: this.numVisited};
    this.DB.save(filter, update, 'starting_urls');
  }

  /**
   * Collect all (relative) links.
   *
   * @param $: Cheerios jQuery like DOM
   * @returns {Promise<void>}
   */
  async collectLinks($) {
    this.output.writeConsole(`${moduleName}.collectLinks - File: ${__filename} - Line: ${__line}`, Helper.isDebug('Links'), 'debug');
    let self = this,
      links = $("a[href^='/']"),
      abLinks = $("a[href^='http']"),
      count = 0,
      countAbLinks = 0;

    // Add links to link list.
    await links.each(() => {
      if (self.collectRelativeLinks($(this).attr('href'))) count += 1;
    });

    await abLinks.each(() => {
      let href = $(this).attr('href');

      if (href.includes(self.baseUrl)) {
        if (self.linkList['typeRelative'].indexOf(href) === -1) {
          self.linkList['typeRelative'].push(href);
          Global.get('followingPages').push(href);
          countAbLinks += 1;
        }
      }
    });

    this.output.write(`Relative links: ${count}`, Helper.isDebug(moduleName));
    this.output.write(`Absolute links: ${countAbLinks}`, Helper.isDebug(moduleName));
  }

  /**
   * Split relative from shorted absolute links (e.g. "/google.com").
   *
   * @param link: String
   * @returns {boolean}
   */
  collectRelativeLinks(link) {
    this.output.writeConsole(`${moduleName}.collectRelativeLinks - File: ${__filename} - Line: ${__line}`, Helper.isDebug('Links'), 'debug');
    let linkArray = link.split('/'),
      linkType = 'typeRelative';

    for (let i = 0; i < link.length;) {
      if (linkArray[0] === '') {
        linkArray.shift();
      } else {
        i += 1;
      }
    }

    if (linkArray.length === 0 || linkArray[0].includes('.')) linkType = 'typeAbsolute';
    link = linkArray.join('/');

    let tmpUrlRel = `${this.baseUrl}/${link}`,
      tmpUrlAbs = `${this.url.protocol}//${link}`,
      tmpUrl = (linkType === 'typeRelative') ? tmpUrlRel : tmpUrlAbs;

    if (link.length > 0) {
      if (!this.linkList[linkType].includes(tmpUrl)) {
        this.linkList[linkType].push(tmpUrl);

        if (linkType === 'typeRelative') Global.get('followingPages').push(tmpUrl);
      }
    }

    return (linkType === 'typeRelative');
  }

  /**
   * Check if command is default.
   *
   * @param command: String
   * @returns {boolean}
   */
  isDefault(command) {
    this.output.writeConsole(`${moduleName}.isDefault - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    if (!Global.get('input').hasOwnProperty(command)) return false;

    return (Global.get('input')[command] === Global.get('input').default[command]);
  }

  /**
   * Stops execution timer and prints readable time.
   */
  getReadableTime() {
    this.output.writeConsole(`${moduleName}.getReadableTime - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    let ms = new Date() - this.startTime,
      time = parseTime(ms),
      timeString = `${time.d} days, ${time.h}:${time.m}:${time.s}`;

    this.output.write(timeString, true, 'success');
    this.output.writeLine(`Stopped at: ${new Date()}`, true, 'success');
  }

  /**
   * Creates lock file.
   */
  createLockFile() {
    this.output.writeConsole(`${moduleName}.createLockFile - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    // Update starting url.
    let filter = {url: Global.get('START_URL')},
      update = {
        url: Global.get('START_URL'),
        active: true
      };

    this.DB.save(filter, update, 'starting_urls');

    fs.writeFileSync(`${Global.get('projectPath')}/${this.lockFileName}`, new Date());
  }

  /**
   * Removes lock file.
   */
  removeLockFile() {
    this.output.writeConsole(`${moduleName}.removeLockFile - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    fs.unlinkSync(`${Global.get('projectPath')}/${this.lockFileName}`);

    // Update starting url.
    let filter = {url: Global.get('START_URL')},
      update = {
        url: Global.get('START_URL'),
        active: false
      },
      self = this;

    this.DB.save(filter, update, 'starting_urls', (err, res) => {
      if (err) throw err;

      self.DB.database.close();
    });
  }

  /**
   * Check if lock file exists.
   *
   * @returns {boolean}
   */
  hasLockFile() {
    this.output.writeConsole(`${moduleName}.hasLockFile - File: ${__filename} - Line: ${__line}`, Helper.isDebug(moduleName), 'debug');
    return fs.existsSync(`${Global.get('projectPath')}/${this.lockFileName}`);
  }
}

exports.Crawler = Crawler;