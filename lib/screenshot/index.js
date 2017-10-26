/**
 * Import modules.
 */
const {Chromeless} = require('chromeless');
const Spinner = require('cli-spinner').Spinner;

/**
 * Import custom modules.
 */
const Output = require('../output').Output;
const {parseTime} = require('../parser');

/**
 * Necessary variables.
 */
let output = new Output(),
  instance = {};

/**
 * Constants.
 */
const spinnerText = '%s Waiting for screenshots. ',
  waitTimeout = 3000,
  viewPort = {width: 1920, height: 3500, scale: 1},
  options = {filePath: '/var/www/html/webcrawler/screenshots/'},
  exists = {
    entry: 'a[href*="?enter"]',
    popup: '.popup .popup_closebutton'
  },
  wait = {
    entry: {
      before: 100,
      after: 500
    },
    popup: {
      before: 1000,
      after: 1200
    },
    default: 2000
  };

/**
 * Screenshot constructor.
 *
 * @returns {Screenshot}
 * @constructor
 */
let Screenshot = function () {
  if (!this instanceof Screenshot) return new Screenshot();
  if (instance instanceof Screenshot) return instance;

  this.undone = 0;
  this.totalScreenshots = 0;
  this.screenshotsDone = 0;
  instance = this;

  return this;
};

/**
 * Do a screenshot for each website that does not has an error.
 *
 * @param websites: {array}
 * @param debug: {boolean}
 * @returns {string}
 */
Screenshot.prototype.doScreenshots = async function (websites, debug) {
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

  let t = parseTime((new Date() - start));
  let read = `${t.d} days, ${t.h}:${t.m}:${t.s}`;

  return `Time for screenshotting: ${read}`;
};

/**
 * Do a screenshot from a specific website.
 *
 * @param website: {{url: string,
 *    website: string,
 *    imprint: website || boolean,
 *    rto: boolean,
 *    hasError: boolean}}
 * @returns {Promise.<void>}
 */
Screenshot.prototype.screenshotting = async function (website, debug) {
  const chromeless = new Chromeless({waitTimeout});
  let name = this.getScreenshotName(website.website, website.imprint),
    url = 'http://' + website.website,
    screenshot = '',
    entry = false,
    popup = false,
    screenshotOptions = {
      filePath: options.filePath + name + '.png'
    };

  // Check if entry exists.
  try {
    entry = await chromeless
      .goto(url)
      .wait(wait.entry.before)
      .exists(exists.entry);

    output.writeLine(`Check for entry button on "${url}". Entry button: "${entry}"`, debug, 'debug');
  } catch (error) {
    output.write(`Unable to check for enter button (url: ${url})`, true, 'error');
    console.log(error);
    return;
  }

  // If entry exists try if popup exists.
  try {
    popup = await chromeless
      .goto(url)
      .wait(wait.popup.before)
      .exists(exists.popup);

    output.writeLine(`Check for popup on "${url}". Popup: "${popup}"`, debug, 'debug');
  } catch (error) {
    output.write(`Unable to check for popup (url: ${url})`, true, 'error');
    console.log(error);
    return;
  }

  // If there is no entry and no popup do a screenshot.
  if (!entry && !popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .setViewport(viewPort)
        .wait(wait.default)
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 1 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  // If there is an entry do a screenshot with clicking entry before.
  if (entry && !popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .wait(wait.entry.before)
        .click(exists.entry)
        .wait(wait.entry.after)
        .setViewport(viewPort)
        .wait(wait.default)
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 2 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  // If there is no entry but a popup do a screenshot after clicking on popup.
  if (!entry && popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .wait(wait.popup.before)
        .click(exists.popup)
        .wait(wait.popup.after)
        .setViewport(viewPort)
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 3 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  // If there are entry and popup do a screenshot after clicking on entry and popup.
  if (entry && popup) {
    try {
      screenshot = await chromeless
        .goto(url)
        .wait(wait.entry.before)
        .click(exists.entry)
        .wait(wait.popup.before)
        .click(exists.popup)
        .wait(wait.popup.after)
        .setViewport(viewPort)
        .screenshot(screenshotOptions);
    } catch (error) {
      output.write(`Unable to do screenshots - Part 4 (url: ${url})`, true, 'error');
      console.log(error);
      return;
    }
  }

  await chromeless.end();
  this.screenshotsDone += 1;
  output.write(`Added screenshot (${this.screenshotsDone}) ${screenshot}`);
  this.decreaseUndone();

  // If the website has an imprint do a screenshot.
  if (website.hasOwnProperty('imprint') && website.imprint.length > website.website.length) {
    let tmpWebsite = {imprint: true};

    for (let key in website) {
      if (website.hasOwnProperty(key) && key !== 'imprint' && key !== 'website') {
        tmpWebsite[key] = website[key];
      }

      if (key === 'website') {
        tmpWebsite.website = website.imprint;
      }
    }

    await this.screenshotting(tmpWebsite, debug);
  }
};

/**
 * Get name for this screenshot.
 *
 * @param website: {string}
 * @param isImprint?: {boolean}
 * @returns {string}
 */
Screenshot.prototype.getScreenshotName = function (website, isImprint) {
  if (typeof isImprint !== 'boolean') isImprint = false;

  while (website.charAt((website.length - 1)) === '/') {
    website = website.slice(0, -1);
  }

  website = website.split('/');

  let i = 0;
  while (i < website.length) {
    if (website[i].length < 1) {
      website.shift();
    } else {
      break;
    }
  }

  let name = website[0];

  if (isImprint) name = `imprint.${name}`;

  return name;
};

/**
 * Count websites without screenshot.
 *
 * @param websites: {array}
 * @returns {number}
 */
Screenshot.prototype.countUndone = function (websites) {
  this.undone = 0;

  for (let i = 0; i < websites.length; i += 1) {
    if (!websites[i].hasError) {
      this.undone += 1;

      if (websites[i].imprint > websites[i].website) {
        this.undone += 1;
      }
    }
  }

  this.totalScreenshots = this.undone;

  return this.undone;
};

/**
 * Decrease the number of undone screenshots.
 */
Screenshot.prototype.decreaseUndone = function () {
  this.undone -= 1;

  if (this.undone <= 0) this.undone = 0;
};

exports.Screenshot = Screenshot;