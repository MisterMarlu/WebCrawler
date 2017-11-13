/**
 * Import modules.
 */
const {Chromeless} = require('chromeless'),
  {Spinner} = require('cli-spinner'),
  {spawn} = require('child_process'),
  axios = require('axios');

/**
 * Import custom modules.
 */
const {Output} = require(`${__dirname}/output`),
  {DB} = require(`${__dirname}/db`),
  {parseTime} = require(`${__dirname}/parser`);

/**
 * Globals.
 */
let instance = {};

/**
 * Constants.
 */
const spinnerText = '%s Waiting for screenshots. ';

/**
 * Screenshot constructor.
 *
 * @param projectPath: {string}
 * @returns {ScreenShot}
 * @constructor
 */
let ScreenShot = function (projectPath) {
  if (!this instanceof ScreenShot) return new ScreenShot(projectPath);
  if (instance instanceof ScreenShot) return instance;

  init(this, projectPath);
  instance = this;

  return this;
};

/**
 * Set configurations.
 *
 * @param config: {{}}
 */
ScreenShot.prototype.setConfig = function (config) {
  if (typeof config !== 'object') {
    return;
  }

  for (let key in config) {
    if (config.hasOwnProperty(key)) {
      this[key] = config[key];
    }
  }
};

/**
 * Get any parameter.
 *
 * @param parameter
 * @returns {*}
 */
ScreenShot.prototype.get = function (parameter) {
  if (typeof this[parameter] === 'undefined') return false;

  return this[parameter];
};

/**
 * Do a screenshot for each website that does not has an error.
 *
 * @param websites: {[{url: string, has_error: boolean, name: string, found_url: string}]}
 * @param debug: {boolean}
 * @param callback?: {function}
 * @returns {string}
 */
ScreenShot.prototype.doScreenshots = async function (websites, debug, callback) {
  this.countUndone(websites);
  let tmpSpinner = null,
    stAdd = '',
    start = new Date(),
    chromeArgs = [
      '--headless',
      '--hide-scrollbars',
      '--remote-debugging-port=9222',
      '--disable-gpu'
    ];

  let chrome = spawn('google-chrome-stable', chromeArgs);

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].has_error) {
      for (let j = 0; j < this.resolutions.length; j += 1) {
        stAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
        tmpSpinner = new Spinner(spinnerText + stAdd);
        tmpSpinner.start();
        // Do the screenshot.
        await this.checkUrl(websites[i], j, debug, callback);
        tmpSpinner.stop(true);
      }
    }
  }

  chrome.kill('SIGINT');

  let time = new Date() - start,
    t = parseTime(time),
    read = `${t.d} days, ${t.h}:${t.m}:${t.s}`;

  return {
    time,
    timeString: `Time for screenshotting: ${read}`,
    done: this.done,
    undone: this.undone,
    total: this.total
  };
};

ScreenShot.prototype.checkUrl = async function (website, resIndex, debug, callback) {
  let url = 'http://' + website.url,
    self = this;

  await axios.get(url)
    .then(async function (response) {
      await self.screenshotting(website, resIndex, debug, callback);
    })
    .catch(function (error) {
      console.log('Invalid url: ', url);
    });
};

/**
 * Do a screenshot from a specific website.
 *
 * @param website: {{url: string, has_error: boolean, name: string, found_url: string}}
 * @param resIndex: {number}
 * @param debug: {boolean}
 * @param callback?: {function}
 * @returns {Promise.<void>}
 */
ScreenShot.prototype.screenshotting = async function (website, resIndex, debug, callback) {
  const chromeless = new Chromeless(this.chromeless);
  let name = this.getScreenshotName(website.url, website.name, resIndex),
    url = 'http://' + website.url,
    screenshot = '',
    elements = [],
    waits = [],
    screenshotOptions = {
      filePath: this.screenshot.filePath + name + '.png'
    };

  this.resolutions[resIndex].scale = 1;

  for (let i = 0; i < this.clicks.length; i += 1) {
    let tmpElement = await chromeless
      .goto(url)
      .wait(this.clicks[i].waits.before)
      .exists(this.clicks[i].element);

    if (tmpElement) {
      elements.push(this.clicks[i].element);
      waits.push(this.clicks[i].wait);
    }
  }

  await chromeless.goto(url);

  for (let i = 0; i < elements.length; i += 1) {
    await chromeless
      .wait(waits[i].before)
      .click(elements[i])
      .wait(waits[i].after);
  }

  screenshot = await chromeless
    .setViewport(this.resolutions[resIndex])
    .wait(2000)
    .screenshot(screenshotOptions);

  await chromeless.end();
  this.done += 1;
  this.output.write(`Added screenshot (${this.done}) ${screenshot}`);
  this.decreaseUndone();

  let oldObject = {url: website.found_url, file_path: screenshot},
    newObject = {
      url: website.found_url,
      file_path: screenshot,
      name: `${name}.png`,
      width: this.resolutions[resIndex].width,
      height: this.resolutions[resIndex].height,
    };

  await this.DB.save(oldObject, newObject, 'screenshots', async function (error, result) {
    if (error) throw error;

    if (typeof callback === 'function') {
      await callback(website.found_url);
    }
  });
};

/**
 * Get name for this screenshot.
 *
 * @param url: {string}
 * @param pageName: {string}
 * @param resIndex: {number}
 * @returns {string}
 */
ScreenShot.prototype.getScreenshotName = function (url, pageName, resIndex) {
  if (typeof pageName === 'undefined') pageName = '';

  while (url.charAt((url.length - 1)) === '/') {
    url = url.slice(0, -1);
  }

  url = url.split('/');

  let i = 0;
  while (i < url.length) {
    if (url[i].length < 1) {
      url.shift();
    } else {
      break;
    }
  }

  let name = url[0];

  if (pageName.length > 0) name = `${pageName}.${name}`;

  name = `${this.resolutions[resIndex].width}-${this.resolutions[resIndex].height}.${name}`;

  return name;
};

/**
 * Decrease the number of undone screenshots.
 */
ScreenShot.prototype.decreaseUndone = function () {
  this.undone -= 1;

  if (this.undone <= 0) this.undone = 0;
};

/**
 * Decrease the number of undone screenshots.
 */
ScreenShot.prototype.countUndone = function (websites) {
  this.undone = 0;

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].hasError) {
      this.undone += 1;
    }
  }

  this.undone *= this.resolutions.length;

  this.total = this.undone;
};

exports.ScreenShot = ScreenShot;

/**
 * Initialize ScreenShot.
 *
 * @param projectPath: {string}
 * @param s: {ScreenShot}
 */
function init(s, projectPath) {
  s.chromeless = null;
  s.screenshot = null;
  s.undone = null;
  s.total = null;
  s.done = null;
  s.output = new Output(projectPath);
  s.DB = new DB();
  s.clicks = null;
  s.resolutions = null;
}