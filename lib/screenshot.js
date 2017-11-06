/**
 * Import modules.
 */
const {Chromeless} = require('chromeless'),
  {Spinner} = require('cli-spinner');

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
 * @param websites: {[{url: string, hasError: boolean, name: string, found_url: string}]}
 * @param debug: {boolean}
 * @returns {string}
 */
ScreenShot.prototype.doScreenshots = async function (websites, debug) {
  this.countUndone(websites);
  let tmpSpinner = null,
    stAdd = '',
    start = new Date();

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].hasError) {
      stAdd = ` (${this.undone} screenshot${((this.undone === 1) ? '' : 's')} remaining)`;
      tmpSpinner = new Spinner(spinnerText + stAdd);
      tmpSpinner.start();
      // Do the screenshot.
      await this.screenshotting(websites[i], debug);
      tmpSpinner.stop(true);
    }
  }

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

/**
 * Do a screenshot from a specific website.
 *
 * @param website: {{url: string, name: string, hasError: boolean, found_url: string}}
 * @param debug: {boolean}
 * @returns {Promise.<void>}
 */
ScreenShot.prototype.screenshotting = async function (website, debug) {
  const chromeless = new Chromeless(this.chromeless);
  let name = this.getScreenshotName(website.url, website.name),
    url = 'http://' + website.url,
    screenshot = '',
    entry = false,
    popup = false,
    screenshotOptions = {
      filePath: this.screenshot.filePath + name + '.png'
    };

  // Check if entry exists.
  try {
    entry = await chromeless
      .goto(url)
      .wait(this.wait.entry.before)
      .exists(this.exists.entry);

    this.output.writeConsole(`Check for entry button on "${url}". Entry button: "${entry}"`, debug, 'debug');
  } catch (error) {
    this.output.write(`Unable to check for enter button (url: ${url})`, true, 'error');
    console.log(error);
    return;
  }

  // If entry exists try if popup exists.
  try {
    popup = await chromeless
      .goto(url)
      .wait(this.wait.popup.before)
      .exists(this.exists.popup);

    this.output.writeConsole(`Check for popup on "${url}". Popup: "${popup}"`, debug, 'debug');
  } catch (error) {
    this.output.write(`Unable to check for popup (url: ${url})`, true, 'error');
    console.log(error);
    return;
  }

  // If there is no entry and no popup do a screenshot.
  if (!entry && !popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .setViewport(this.viewPort)
        .wait(this.wait.default)
        .screenshot(screenshotOptions);
    } catch (error) {
      this.output.write(`Unable to do screenshots - Part 1 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  // If there is an entry do a screenshot with clicking entry before.
  if (entry && !popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .wait(this.wait.entry.before)
        .click(this.exists.entry)
        .wait(this.wait.entry.after)
        .setViewport(this.viewPort)
        .wait(this.wait.default)
        .screenshot(screenshotOptions);
    } catch (error) {
      this.output.write(`Unable to do screenshots - Part 2 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  // If there is no entry but a popup do a screenshot after clicking on popup.
  if (!entry && popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .wait(this.wait.popup.before)
        .click(this.exists.popup)
        .wait(this.wait.popup.after)
        .setViewport(this.viewPort)
        .screenshot(screenshotOptions);
    } catch (error) {
      this.output.write(`Unable to do screenshots - Part 3 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  // If there are entry and popup do a screenshot after clicking on entry and popup.
  if (entry && popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .wait(this.wait.entry.before)
        .click(this.exists.entry)
        .wait(this.wait.popup.before)
        .click(this.exists.popup)
        .wait(this.wait.popup.after)
        .setViewport(this.viewPort)
        .screenshot(screenshotOptions);
    } catch (error) {
      this.output.write(`Unable to do screenshots - Part 4 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  await chromeless.end();
  this.done += 1;
  this.output.write(`Added screenshot (${this.done}) ${screenshot}`);
  this.decreaseUndone();

  let oldObject = {url: website.found_url, file_path: screenshot},
    structure = {_id: false},
    newObject = {
      url: website.found_url,
      file_path: screenshot,
      name,
      width: 1920,
      height: 1920,
    };

  this.DB.save(oldObject, structure, newObject, 'screenshots', function (error, result) {
    if (error) throw error;
  });
};

/**
 * Get name for this screenshot.
 *
 * @param url: {string}
 * @param pageName: {string}
 * @returns {string}
 */
ScreenShot.prototype.getScreenshotName = function (url, pageName) {
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
  s.viewPort = null;
  s.screenshot = null;
  s.exists = null;
  s.wait = null;
  s.undone = null;
  s.total = null;
  s.done = null;
  s.output = new Output(projectPath);
  s.DB = new DB();
}